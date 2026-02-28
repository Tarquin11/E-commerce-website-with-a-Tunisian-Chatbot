from flask import Blueprint, jsonify, request, current_app, send_file, abort
from . import db, cache
from .models import Product, Cart, Order, OrderItem, Club, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from .seed_data import seed_products
from sqlalchemy import or_, func, and_
import re
import json
import os
try:
    from deep_translator import GoogleTranslator
except Exception:
    GoogleTranslator = None

from concurrent.futures import ThreadPoolExecutor

main_bp = Blueprint('main', __name__)

def init_app(app):
    cache.init_app(app)
    with app.app_context():
        # Only seed on explicit startup to avoid interfering with CLI commands
        # Set environment variable SEED_ON_STARTUP=1 to enable automatic seeding
        seed_flag = app.config.get('SEED_ON_STARTUP') or os.environ.get('SEED_ON_STARTUP')
        if str(seed_flag).lower() in ('1', 'true', 'yes'):
            try:
                seed_products()
            except Exception:
                # don't fail app startup if seeding fails
                try:
                    current_app.logger.exception('Seeding failed')
                except Exception:
                    pass


def season_to_year(season_str: str):
    if not season_str:
        return 0
    m = re.search(r"(\d{2,4})", season_str)
    if not m:
        return 0
    part = m.group(1)
    try:
        num = int(part)
    except ValueError:
        return 0
    if len(part) == 4:
        return num
    if num <= 49:
        return 2000 + num
    return 1900 + num

@main_bp.route('/clubs', methods=['GET'])
def get_clubs():
    results = db.session.query(
        Club,
        func.count(Product.id).label('product_count')
    ).outerjoin(Product, and_(Product.club_id == Club.id, Product.is_deleted == False)).group_by(Club.id).all()

    return jsonify([{
        'id': c.id,
        'name': c.name,
        'logo_url': c.logo_url,
        'description': c.description,
        'country': c.country,
        'product_count': int(count)
    } for c, count in results])

@main_bp.route('/clubs/<int:club_id>/products', methods=['GET'])
def get_club_products(club_id):
    club = Club.query.get_or_404(club_id)
    products = club.products.filter(Product.is_deleted == False).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'price': p.price,
        'stock': p.stock,
        'image_url': p.image_url,
        'category': p.category,
        'season': p.season,
        'player_slug': getattr(p, 'player_slug', None),
    } for p in products])

@main_bp.route('/products/search', methods=['GET'])
def search_products():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    # Flexible matching: always use contains matching for broadness
    pattern = f"%{query}%"

    # Detect season tokens like '23/24' or '2016/17' in the query
    season_match = re.search(r"(\d{2,4})\s*[\/-]\s*(\d{2,4})", query)
    season_candidates = []
    club_query_part = query
    if season_match:
        a, b = season_match.group(1), season_match.group(2)
        # Normalize candidates e.g. '23/24', '2324', '2023/24', '202324'
        season_candidates.append(f"{a}/{b}")
        season_candidates.append(f"{a}{b}")
        if len(a) == 2:
            season_candidates.append(f"20{a}/{b}")
            season_candidates.append(f"20{a}{b}")
        # remove the season part from club_query_part to allow separate matching
        club_query_part = re.sub(re.escape(season_match.group(0)), '', query, flags=re.IGNORECASE).strip()

    # If query contains a club + season (e.g. 'real madrid 23/24'), try to return club-specific season matches
    results = []
    if season_candidates and club_query_part:
        # remove common filler words so 'real madrid 23/24 kit' -> 'real madrid'
        club_query_part_clean = re.sub(r"\b(kit|jersey|home|away|third|shirt|season)\b", "", club_query_part, flags=re.IGNORECASE).strip()
        tokens = re.findall(r"\w+", club_query_part_clean.lower())

        season_filters = [Product.season.ilike(f"%{cand}%") for cand in season_candidates]

        matched_clubs = []
        if tokens:
            # match clubs where all tokens appear in the club name
            for club in Club.query.all():
                name_lower = (club.name or '').lower()
                if all(t in name_lower for t in tokens):
                    matched_clubs.append(club)
        else:
            matched_clubs = Club.query.filter(Club.name.ilike(f"%{club_query_part}%")).all()

        # Fallback: if no matched clubs via token matching, try a looser ilike on cleaned club part
        if not matched_clubs and club_query_part_clean:
            looser = Club.query.filter(Club.name.ilike(f"%{club_query_part_clean}%")).all()
            if looser:
                matched_clubs = looser
                current_app.logger.debug("[search] Fallback looser club match used: %s", [c.name for c in looser])

        # collect products for matched clubs for the requested seasons
        q_results = []
        for club in matched_clubs:
            prods = Product.query.filter(
                Product.club_id == club.id,
                or_(*season_filters),
                Product.is_deleted == False
            ).all()
            q_results.extend(prods)

        results = q_results

    # If no club+season specific hits, perform a broader initial search including player_slug
    if not results:
        initial = Product.query.join(Club).filter(
            or_(
                Product.name.ilike(pattern),
                Product.description.ilike(pattern),
                Club.name.ilike(pattern),
                Product.season.ilike(pattern),
                Product.player_slug.ilike(pattern)
            ),
            Product.is_deleted == False
        ).limit(100).all()

        # If the query is mostly a club name (no digits), return up to 4 latest kits per matched club
        clubs = Club.query.filter(Club.name.ilike(pattern)).all()
        contains_digits = bool(re.search(r"\d", query))

        if clubs and not contains_digits:
            allowed_years = set([2021, 2022, 2023, 2024, 2025])
            limit_per_club = 4
            for club in clubs:
                prods = club.products.filter(Product.is_deleted == False).all()
                season_map = {}
                for p in prods:
                    y = season_to_year(p.season or '')
                    if y in allowed_years:
                        season_map.setdefault(y, []).append(p)

                picked = []
                for y in sorted(season_map.keys(), reverse=True):
                    for p in season_map[y]:
                        if len(picked) >= limit_per_club:
                            break
                        picked.append(p)
                    if len(picked) >= limit_per_club:
                        break

                results.extend(picked)

        # Fallback to initial broad matches
        if not results:
            results = initial

    # Sort final results by season year desc then id and limit
    sorted_results = sorted(
        results,
        key=lambda p: (season_to_year(p.season or ''), p.id),
        reverse=True,
    )[:50]

    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'price': p.price,
        'stock': p.stock,
        'image_url': getattr(p, 'image_url', None),
        'category': getattr(p, 'category', None),
        'club': p.club.name if p.club else None,
        'club_id': p.club.id if p.club else None,
        'season': p.season,
    } for p in sorted_results])


def recommend_size_from_measurements(height_cm: float = None, weight_kg: float = None, age: int = None, fit_pref: str = 'regular'):
    """
    Simple heuristic sizing function. Returns a size string and category ('Adult' or 'Youth').
    This is intentionally conservative and meant for recommendation only.
    """
    try:
        h = float(height_cm) if height_cm is not None else None
    except Exception:
        h = None
    try:
        w = float(weight_kg) if weight_kg is not None else None
    except Exception:
        w = None
    try:
        a = int(age) if age is not None else None
    except Exception:
        a = None

    category = 'Adult'
    if a is not None and a < 14:
        category = 'Youth'


    if h is None and w is None:
        return {'size': 'M', 'category': category}


    if category == 'Youth':
        if h is None:
            return {'size': 'M (Youth)', 'category': category}
        if h < 130:
            size = 'XS (Youth)'
        elif h < 140:
            size = 'S (Youth)'
        elif h < 150:
            size = 'M (Youth)'
        elif h < 160:
            size = 'L (Youth)'
        else:
            size = 'XL (Youth)'
     
        if fit_pref == 'tight':
   
            if size.startswith('M'):
                size = 'S (Youth)'
        elif fit_pref == 'loose':
            if size.startswith('M'):
                size = 'L (Youth)'
        return {'size': size, 'category': category}


    size = 'M'
    if h is not None:
        if h < 165:
            size = 'S'
        elif h < 175:
            size = 'M'
        elif h < 185:
            size = 'L'
        else:
            size = 'XL'
    if h is not None and w is not None and h > 0:
        bmi = w / ((h/100.0) ** 2)
        if bmi < 19:
            if size == 'M': size = 'S'
            elif size == 'L': size = 'M'
        elif bmi > 27:
            if size == 'M': size = 'L'
            elif size == 'L': size = 'XL'

    if fit_pref == 'tight':
        if size == 'M': size = 'S'
        elif size == 'L': size = 'M'
    elif fit_pref == 'loose':
        if size == 'M': size = 'L'
        elif size == 'S': size = 'M'

    return {'size': size, 'category': category}


@main_bp.route('/chat/search_jersey', methods=['POST'])
def chat_search_jersey():
    """
    STRICT search logic - returns exact matches only.
    If user asks for 21/22 and it doesn't exist, returns empty list.
    No fallback to random products.
    """
    try:
        data = request.get_json() or {}
        
        # 1. Extract inputs
        club_query = (data.get('club') or '').strip()
        player_name = (data.get('player_name') or data.get('player') or '').strip()
        season = (data.get('season') or '').strip()
        kit_type = (data.get('kit_type') or '').strip().lower()
        
        # 2. Extract Biometrics
        height_cm = data.get('height_cm')
        weight_kg = data.get('weight_kg')
        age = data.get('age')
        gender = (data.get('gender') or 'male').lower()
        fit_pref = (data.get('fit_pref') or 'regular').lower()

        # 3. Calculate Size & BMI
        rec = recommend_size_from_measurements(height_cm=height_cm, weight_kg=weight_kg, age=age, fit_pref=fit_pref)
        bmi = None
        if height_cm and weight_kg:
            try:
                h_m = float(height_cm) / 100.0
                bmi = round(float(weight_kg) / (h_m * h_m), 1)
            except Exception:
                bmi = None

        # 4. Search Logic - STRICT FILTERING
        # A. Find Club (required)
        if not club_query:
            return jsonify({'status': 'error', 'message': 'club is required'}), 400
            
        club_match = Club.query.filter(Club.name.ilike(f'%{club_query}%')).first()
        if not club_match:
            popular = Club.query.join(Product).filter(Product.is_deleted == False).group_by(Club.id).order_by(func.count(Product.id).desc()).limit(5).all()
            return jsonify({
                'status': 'club_not_found',
                'suggestions': [c.name for c in popular],
                'bmi': bmi,
                'recommended_size': rec['size'],
                'matches': []
            })

        # B. Build STRICT query - apply ALL specified filters
        query = Product.query.filter(
            Product.club_id == club_match.id,
            Product.is_deleted == False,
            Product.stock > 0
        )
        
        # STRICT: If season specified, ONLY return that season
        if season:
            query = query.filter(Product.season.ilike(f'%{season}%'))
        
        # STRICT: If kit_type specified, ONLY return that type
        if kit_type:
            query = query.filter(or_(
                Product.name.ilike(f'%{kit_type}%'),
                Product.category.ilike(f'%{kit_type}%')
            ))
        
        # STRICT: If player_name specified, ONLY return that player
        if player_name:
            query = query.filter(or_(
                Product.player_slug.ilike(f'%{player_name}%'),
                Product.name.ilike(f'%{player_name}%')
            ))
        
        # Execute strict query
        matches = query.limit(5).all()
        
        # Return exact matches OR empty list (NO fallbacks)
        return jsonify({
            'status': 'exact_match' if matches else 'no_match',
            'club_name': club_match.name,
            'matches': [{'id': p.id, 'name': p.name, 'price': p.price, 'image_url': getattr(p, 'image_url', None)} for p in matches],
            'bmi': bmi,
            'recommended_size': rec['size']
        })

    except Exception as e:
        current_app.logger.error(f"Search Error: {e}")
        return jsonify({'error': str(e)}), 500


@main_bp.route('/chat/local_reco', methods=['POST'])
def chat_local_reco():
    """
    Local Reco Size Engine endpoint.
    Accepts: { club, height_cm, weight_kg, age, gender, season, player_name, flock_name, flock_number, add_to_cart (bool), payment_method }
    Returns recommended size, matches, and optionally adds item to authenticated user's cart.
    """
    try:
        data = request.get_json() or {}
        try:
            current_app.logger.debug('[local_reco] payload: %s', json.dumps(data, ensure_ascii=False))
        except Exception:
            try:
                print('[local_reco] payload:', data, flush=True)
            except Exception:
                pass
        club = (data.get('club') or '').strip()
        height_cm = data.get('height_cm')
        weight_kg = data.get('weight_kg')
        age = data.get('age')
        gender = (data.get('gender') or '').strip().lower()
        season = (data.get('season') or '').strip()
        player_name = (data.get('player_name') or '').strip()
        
        # GUARD: Don't search if we have no search criteria (neither club nor player specified)
        if not club and not player_name:
            current_app.logger.debug('[local_reco] No club or player_name provided - returning empty matches')
            return jsonify({
                'matches': [],
                'recommended_size': None,
                'category': None,
                'club_found': False,
                'club_name': None,
                'status': 'waiting_for_input'
            })
        flock_name = (data.get('flock_name') or '').strip()
        flock_number = data.get('flock_number')
        add_to_cart = bool(data.get('add_to_cart'))
        payment_method = (data.get('payment_method') or '').strip()

        rec = recommend_size_from_measurements(height_cm=height_cm, weight_kg=weight_kg, age=age, fit_pref=(data.get('fit_pref') or 'regular'))

        # Attempt to identify club
        club_match = None
        if club:
            club_match = Club.query.filter(Club.name.ilike(f"%{club}%")).first()
        current_app.logger.debug('[local_reco] club=%s club_match=%s', club, getattr(club_match, 'name', None))

        # If player specified, prefer player collections
        matches = []
        if player_name:
            current_app.logger.debug('[local_reco] searching by player_name=%s', player_name)
            player_norm = player_name.lower()
            q = Product.query.filter(
                or_(
                    func.lower(Product.player_slug).like(f"%{player_norm}%"),
                    func.lower(Product.name).like(f"%{player_norm}%")
                ),
                Product.is_deleted == False,
                Product.stock > 0
            )
            # respect optional season and kit_type if provided
            if season:
                season_match = re.search(r"(\d{2,4})\s*[\/\-]\s*(\d{2,4})", season)
                cands = []
                if season_match:
                    a, b = season_match.group(1), season_match.group(2)
                    if len(a) == 2:
                        cands.extend([f"{a}/{b}", f"20{a}/{b}", f"{a}{b}", f"20{a}{b}"])
                    else:
                        cands.extend([f"{a}/{b}", f"{a}{b}"])
                else:
                    cands.append(season)
                season_filters = [Product.season.ilike(f"%{cand}%") for cand in set(cands) if cand]
                if season_filters:
                    q = q.filter(or_(*season_filters))
            if data.get('kit_type'):
                kt = (data.get('kit_type') or '').strip().lower()
                if kt:
                    q = q.filter(or_(Product.name.ilike(f"%{kt}%"), Product.category.ilike(f"%{kt}%")))
            products = q.limit(20).all()
            for p in products:
                matches.append({
                    'id': p.id, 'name': p.name, 'price': p.price, 'stock': p.stock, 'image_url': p.image_url, 'season': p.season, 'club': p.club.name if p.club else None
                })
            current_app.logger.debug('[local_reco] player search matched %d products', len(matches))

        # If club+season specified, prefer that
        if not matches and club_match:
            q = Product.query.filter(
                Product.club_id == club_match.id,
                Product.is_deleted == False,
            )
            if season:
                # Build season candidates similar to other search endpoints
                season_match = re.search(r"(\d{2,4})\s*[\/-]\s*(\d{2,4})", season)
                season_filters = []
                if season_match:
                    a, b = season_match.group(1), season_match.group(2)
                    cands = [f"{a}/{b}", f"{a}{b}"]
                    if len(a) == 2:
                        cands.extend([f"20{a}/{b}", f"20{a}{b}"])
                    season_filters = [Product.season.ilike(f"%{cand}%") for cand in cands]
                else:
                    season_filters = [Product.season.ilike(f"%{season}%")]
                q = q.filter(or_(*season_filters))
            q = q.filter(Product.stock > 0).limit(50)
            club_products = q.all()
            current_app.logger.debug('[local_reco] club search found %d products for club %s (season filter=%s)', len(club_products), getattr(club_match, 'name', None), season)

            # If kit_type not provided and multiple kit types exist, ask user to clarify
            if club_products and not (data.get('kit_type')):
                # detect kit types present in the matched products
                types = set()
                for p in club_products:
                    nm = (p.name or '').lower()
                    if 'home' in nm:
                        types.add('home')
                    if 'away' in nm:
                        types.add('away')
                    if 'third' in nm:
                        types.add('third')
                if len(types) > 1:
                    return jsonify({'needs_kit_type': True, 'available_types': sorted(list(types)), 'club_name': club_match.name})

            for p in club_products:
                matches.append({'id': p.id, 'name': p.name, 'price': p.price, 'stock': p.stock, 'image_url': p.image_url, 'season': p.season, 'club': club_match.name})
            current_app.logger.debug('[local_reco] appended %d club_products to matches', len(club_products))

        # Fallback: broad search
        if not matches:
            pattern = f"%{club or player_name or ''}%"
            products = Product.query.join(Club).filter(
                or_(
                    Product.name.ilike(pattern),
                    Product.description.ilike(pattern),
                    Club.name.ilike(pattern),
                    Product.player_slug.ilike(pattern)
                ),
                Product.is_deleted == False,
                Product.stock > 0
            ).limit(30).all()
            for p in products:
                matches.append({'id': p.id, 'name': p.name, 'price': p.price, 'stock': p.stock, 'image_url': p.image_url, 'season': p.season, 'club': p.club.name if p.club else None})

        # Save user measurements/preferences if user authenticated
        user_id = None
        try:
            user_id = get_jwt_identity()
        except Exception:
            user_id = None
        if user_id:
            try:
                user = User.query.get(user_id)
                if user:
                    user.measurements = {'height_cm': height_cm, 'weight_kg': weight_kg, 'age': age, 'gender': gender}
                    prefs = user.preferences or {}
                    if flock_name:
                        prefs['last_flock'] = {'name': flock_name, 'number': flock_number}
                    if payment_method:
                        prefs['preferred_payment'] = payment_method
                    user.preferences = prefs
                    if data.get('preferred_language'):
                        user.preferred_language = data.get('preferred_language')
                    db.session.commit()
            except Exception:
                db.session.rollback()

        response = {
            'recommended_size': rec['size'],
            'category': rec['category'],
            'matches': matches,
            'club_found': bool(club_match),
            'club_name': club_match.name if club_match else None
        }
        try:
            current_app.logger.debug('[local_reco] response prepared: matches=%d recommended_size=%s', len(matches), rec['size'])
            # log top match names for diagnostics
            if matches:
                current_app.logger.debug('[local_reco] top matches: %s', ', '.join([m['name'] for m in matches[:5]]))
        except Exception:
            pass

        # Optionally add first matched product to authenticated user's cart
        if add_to_cart and matches and user_id:
            try:
                first = matches[0]
                cart_item = Cart.query.filter_by(user_id=user_id, product_id=first['id'], meta=None).first()
                if cart_item:
                    cart_item.quantity += 1
                else:
                    cart_item = Cart(user_id=user_id, product_id=first['id'], quantity=1, meta={'flock_name': flock_name, 'flock_number': flock_number})
                    db.session.add(cart_item)
                db.session.commit()
                response['added_to_cart'] = True
                response['added_product_id'] = first['id']
            except Exception as e:
                db.session.rollback()
                current_app.logger.debug('Failed to add to cart: %s', e)

        # If no matches found, mark result not found
        if not matches:
            response['zero_results'] = True
            # suggestions: popular clubs
            popular = Club.query.join(Product).filter(Product.is_deleted == False).group_by(Club.id).order_by(func.count(Product.id).desc()).limit(5).all()
            response['suggestions'] = [c.name for c in popular]

        return jsonify(response)
    except Exception as e:
        current_app.logger.exception('local_reco_error')
        # Return structured error details for easier debugging in development
        err_payload = {'error': 'internal_server_error', 'message': str(e)}
        try:
            # include exception type and a short repr when available
            err_payload['type'] = type(e).__name__
            err_payload['repr'] = repr(e)
        except Exception:
            pass
        return jsonify(err_payload), 500


@main_bp.route('/products', methods=['GET'])
def get_products():
    club = request.args.get('club')
    season = request.args.get('season')
    player = request.args.get('player')
    query = Product.query.filter_by(is_deleted=False)
    if club and club != "All Clubs":
        query = query.filter(Product.club == club)
    if season and season != "All Seasons":
        query = query.filter(Product.season == season)
    if player:
        # allow backend to return both explicitly tagged legendary items and any product mentioning the player
        player_normalized = player.lower()
        query = query.filter(or_(
            func.lower(Product.player_slug).like(f"%{player_normalized}%"),
            func.lower(Product.name).like(f"%{player_normalized}%")
        ))

    products = query.all()
    return jsonify([
        {
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'price': p.price,
            'stock': p.stock,
            'image_url': getattr(p, 'image_url', None),
            'category': getattr(p, 'category', None),
            'club': p.club.name if p.club else None,
            'club_id': p.club.id if p.club else None,
            'season': p.season,
            'is_legendary': getattr(p, 'is_legendary', False),
            'player_slug': getattr(p, 'player_slug', None),
            'tournament': getattr(p, 'tournament', None)
        }
        for p in products
    ])

@main_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()  
def soft_delete_product(product_id):
    current_user_id = get_jwt_identity()
    admin_config = current_app.config.get('ADMIN_USER_IDS', [])
    if isinstance(admin_config, (int, str)):
        try:
            admin_ids = {int(admin_config)}
        except Exception:
            admin_ids = set()
    else:
        try:
            admin_ids = set(int(x) for x in admin_config)
        except Exception:
            admin_ids = set()

    if current_user_id not in admin_ids:
        abort(403)

    product = Product.query.get_or_404(product_id)
    product.is_deleted = True
    db.session.commit()
    return jsonify({'message': f'Product {product_id} has been soft deleted'})


@main_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    p = Product.query.get_or_404(product_id)
    return jsonify({
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'price': p.price,
        'stock': p.stock,
        'image_url': getattr(p, 'image_url', None),
        'category': getattr(p, 'category', None),
        'club': {
            'id': p.club.id,
            'name': p.club.name,
            'league': getattr(p.club, 'league', 'Unknown'),
            'logo_url': p.club.logo_url,
            'country': p.club.country,
            'description': p.club.description
        } if p.club else None,
        'club_id': p.club.id if p.club else None,
        'season': p.season,
        'is_legendary': getattr(p, 'is_legendary', False),
        'player_slug': getattr(p, 'player_slug', None),
    })


def translate_single_cached(text, target_lang):
    """Helper function to translate a single text string with caching."""
    if not text or not target_lang or GoogleTranslator is None:
        return ''
    try:
        return GoogleTranslator(source='auto', target=target_lang).translate(text)
    except Exception:
        return ''


@main_bp.route('/translate', methods=['POST'])
def translate_text():
    if GoogleTranslator is None:
        return jsonify({'error': 'Translation service not available'}), 503

    data = request.get_json() or {}
    text = data.get('text', '').strip()
    target_lang = data.get('target_lang', 'en').strip()

    if not text:
        return jsonify({'error': 'text is required'}), 400
    if not target_lang:
        return jsonify({'error': 'target_lang is required'}), 400

    try:
        translated = translate_single_cached(text, target_lang)
        return jsonify({'translated': translated})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@main_bp.route('/translate/batch', methods=['POST'])
def translate_batch():
    data = request.get_json() or {}
    texts = data.get('texts')
    target_lang = data.get('target_lang')
    if not isinstance(texts, list):
        return jsonify({'error': 'texts must be a list'}), 400
    if not target_lang:
        return jsonify({'error': 'target_lang is required'}), 400

    results = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = [ex.submit(translate_single_cached, t, target_lang) for t in texts]
        for fut in futures:
            try:
                results.append(fut.result())
            except Exception:
                results.append('')

    return jsonify({'translations': results})


@main_bp.route('/locales/generate/<string:lang_code>', methods=['POST'])
def generate_locale(lang_code):
    locales_dir = os.path.join(current_app.root_path, '..', 'frontend', 'src', 'locales')
    locales_dir = os.path.normpath(locales_dir)
    en_file = os.path.join(locales_dir, 'en.json')
    target_file = os.path.join(locales_dir, f'{lang_code}.json')


    if os.path.exists(target_file):
        return jsonify({'status': 'cached'}), 200

    if not os.path.exists(en_file):
        return jsonify({'error': 'English source file not found on server.'}), 404

    with open(en_file, 'r', encoding='utf-8') as f:
        en_data = json.load(f)

    def translate_recursive(obj):
        if isinstance(obj, dict):
            return {k: translate_recursive(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [translate_recursive(v) for v in obj]
        if isinstance(obj, str):
            return translate_single_cached(obj, lang_code)
        return obj

    translated = translate_recursive(en_data)

    try:
        os.makedirs(locales_dir, exist_ok=True)
        with open(target_file, 'w', encoding='utf-8') as tf:
            json.dump(translated, tf, ensure_ascii=False, indent=2)
    except Exception as e:
        current_app.logger.debug('Failed to write translated file: %s', e)

    return jsonify({'status': 'generated'}), 200


@main_bp.route('/cart', methods=['GET'])
@jwt_required()
def get_cart():
    current_user_id = get_jwt_identity()
    print(f'[GET_CART] User {current_user_id} fetching cart', flush=True)
    cart_items = Cart.query.filter_by(user_id=current_user_id).all()
    print(f'[GET_CART] Found {len(cart_items)} items', flush=True)
    result = [
        {
            'productId': item.product_id,
            'quantity': item.quantity,
            'meta': item.meta,
            'product': {
                'id': item.product.id,
                'name': item.product.name,
                'price': item.product.price,
                'stock': item.product.stock,
                'image_url': getattr(item.product, 'image_url', None),
            }
        }
        for item in cart_items
    ]
    print(f'[GET_CART] Returning: {result}', flush=True)
    return jsonify(result)


@main_bp.route('/cart/add', methods=['POST'])
@jwt_required()
def add_to_cart():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        print(f'[CART_ADD] User {current_user_id}, payload: {data}', flush=True)
        product_id = data.get('productId')
        if product_id is None:
            return jsonify({'error': 'productId is required'}), 400

        try:
            quantity = int(data.get('quantity', 1))
        except (TypeError, ValueError):
            return jsonify({'error': 'quantity must be an integer'}), 400

        if quantity <= 0:
            return jsonify({'error': 'quantity must be at least 1'}), 400
        product = Product.query.get(product_id)
        if not product or getattr(product, 'is_deleted', False):
            return jsonify({'error': 'Product not found'}), 404
        meta = data.get('meta')
        cart_item = Cart.query.filter_by(user_id=current_user_id, product_id=product_id, meta=meta).first()
        if cart_item:
            cart_item.quantity = cart_item.quantity + quantity
        else:
            cart_item = Cart(user_id=current_user_id, product_id=product_id, quantity=quantity, meta=meta)
            db.session.add(cart_item)

        db.session.commit()
        print(f'[CART_ADD] Success: added product {product_id} for user {current_user_id}', flush=True)
        return jsonify({'message': 'Product added to cart'})
    except Exception as e:
        print(f'[CART_ADD_ERROR] {str(e)}', flush=True)
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@main_bp.route('/cart/add-debug', methods=['POST'])
def add_to_cart_debug():
    """Temporary debug endpoint to inspect incoming add-to-cart requests and headers.
    Does not require authentication. Remove this once debugging is complete.
    """
    data = request.get_json() or {}
    auth = None
    try:
        auth = request.headers.get('Authorization')
    except Exception:
        auth = None
    print('[DEBUG] /cart/add-debug received payload:', data)
    print('[DEBUG] Authorization header:', auth)
    return jsonify({'received': data, 'authorization': bool(auth), 'auth_header': auth}), 200
@main_bp.route('/cart/update/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_cart_quantity(product_id):
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    quantity = int(data.get('quantity', 1))

    cart_item = Cart.query.filter_by(user_id=current_user_id, product_id=product_id).first_or_404()
    cart_item.quantity = quantity
    db.session.commit()
    return jsonify({'message': 'Cart updated'})


@main_bp.route('/cart/remove/<int:product_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(product_id):
    current_user_id = get_jwt_identity()
    Cart.query.filter_by(user_id=current_user_id, product_id=product_id).delete()
    db.session.commit()
    return jsonify({'message': 'Item removed from cart'})


@main_bp.route('/orders', methods=['POST'])
@jwt_required()
def place_order():
    from .email_service import send_order_confirmation_email

    current_user_id = get_jwt_identity()
    data = request.get_json() or {}

    cart_items = Cart.query.filter_by(user_id=current_user_id).all()
    if not cart_items:
        return jsonify({'error': 'Cart is empty'}), 400
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    SHIPPING_COST = current_app.config.get('SHIPPING_COST', 15)
    JERSEY_TAX_RATE = current_app.config.get('JERSEY_TAX_RATE', 0.15)
    SHIPPING_TAX_RATE = current_app.config.get('SHIPPING_TAX_RATE', 0.07)
    coupon_code = (data.get('coupon_code') or '').strip()
    VALID_COUPONS = set(current_app.config.get('VALID_COUPONS', ['12345678', '00000000', '87654321', 'CR7GOAT']))
    subtotal = sum(item.product.price * item.quantity for item in cart_items)
    jersey_unit_prices = []
    for item in cart_items:
        if getattr(item.product, 'category', '').lower() == 'jersey':
            jersey_unit_prices.extend([item.product.price] * item.quantity)

    jersey_count = len(jersey_unit_prices)
    jersey_subtotal = sum(jersey_unit_prices)

    discount = 0.0
    coupon_applied = None
    if coupon_code and coupon_code in VALID_COUPONS and jersey_count > 0:
        coupon_applied = coupon_code
        if 1 <= jersey_count <= 3:
            discount = jersey_subtotal * 0.15
        else:
            discount = min(jersey_unit_prices)

    subtotal_after_discount = max(0.0, subtotal - discount)
    jersey_tax = max(0.0, (jersey_subtotal - min(discount, jersey_subtotal)) * JERSEY_TAX_RATE)
    shipping_tax = SHIPPING_COST * SHIPPING_TAX_RATE
    total_price = subtotal_after_discount + jersey_tax + SHIPPING_COST + shipping_tax

    new_order = Order(
        user_id=current_user_id,
        total_price=total_price,
        street_address=data.get('street_address', ''),
        city=data.get('city', ''),
        postal_code=data.get('postal_code', ''),
        country=data.get('country', ''),
        phone=data.get('phone', '')
    )
    db.session.add(new_order)
    db.session.flush()
    order_items_for_email = []
    free_one_price = 0.0
    if coupon_applied and jersey_count > 3:
        free_one_price = min(jersey_unit_prices)
    remaining_free = 1 if (coupon_applied and jersey_count > 3) else 0

    for item in cart_items:
        unit_price = item.product.price
        qty = item.quantity
        line_total = unit_price * qty
        if getattr(item.product, 'category', '').lower() == 'jersey' and coupon_applied:
            if 1 <= jersey_count <= 3:
                adj_total = round(line_total * 0.85, 2)
            else:
                adj_total = line_total
                while remaining_free > 0 and qty > 0 and unit_price == free_one_price:
                    adj_total -= unit_price
                    remaining_free -= 1
                    qty -= 1
        else:
            adj_total = line_total

        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.product.price
        )
        db.session.add(order_item)
        order_items_for_email.append({
            'name': item.product.name,
            'quantity': item.quantity,
            'price': item.product.price,
            'total': round(adj_total, 2)
        })
    
    Cart.query.filter_by(user_id=current_user_id).delete()
    db.session.commit()
    try:
        payment_method = (data.get('payment_method') or '').strip() or None
        executor = ThreadPoolExecutor(max_workers=1)
        app_obj = current_app._get_current_object()
        def _send_in_context(app, fn, *a, **kw):
            with app.app_context():
                try:
                    fn(*a, **kw)
                except Exception:
                    try:
                        current_app.logger.exception('Email send failed')
                    except Exception:
                        pass

        executor.submit(
            _send_in_context,
            app_obj,
            send_order_confirmation_email,
            user_email=user.email,
            user_name=user.username,
            order_id=new_order.id,
            order_items=order_items_for_email,
            total_price=total_price,
            subtotal=subtotal_after_discount,
            jersey_tax=jersey_tax,
            shipping_tax=shipping_tax,
            shipping_cost=SHIPPING_COST,
            coupon_code=coupon_applied,
            discount=round(discount, 2),
            payment_method=payment_method
        )
    except Exception as e:
        try:
            current_app.logger.warning('Failed to queue confirmation email: %s', e)
        except Exception:
            pass
    
    return jsonify({
        'message': 'Order placed successfully',
        'order_id': new_order.id,
        'total_price': round(total_price, 2),
        'subtotal': round(subtotal_after_discount, 2),
        'jersey_tax': round(jersey_tax, 2),
        'shipping_tax': round(shipping_tax, 2),
        'shipping': SHIPPING_COST,
        'coupon': coupon_applied,
        'discount': round(discount, 2)
    }), 201
