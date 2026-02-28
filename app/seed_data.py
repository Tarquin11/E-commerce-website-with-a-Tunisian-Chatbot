import os
from . import db
from .models import Product, Club

def seed_products():
    club_data = [
        {
            "name": "Real Madrid",
            "country": "Spain",
            "league": "La Liga",
            "logo_url": "/../src/assets/RealMadrid.png",
            "description": "¡Hala Madrid y nada más!"
        },
        {
            "name": "Barcelona",
            "country": "Spain",
            "league": "La Liga",
            "logo_url": "/../src/assets/Barca.png",
            "description": "Més que un club!"
        },
        {
            "name": "Manchester United",
            "country": "England",
            "league": "Premier League",
            "logo_url": "/../src/assets/ManUtd.png",
            "description": "Glory, Glory Man United!"
        },
        {
            "name": "Manchester City",
            "country": "England",
            "league": "Premier League",
            "logo_url": "/../src/assets/ManCity.png",
            "description": "Blue Moon ! "
        },
        {
            "name": "Liverpool",
            "country": "England",
            "league": "Premier League",
            "logo_url": "/../src/assets/Liverpool.png",
            "description": "You'll Never Walk Alone !"
        },
        {
            "name": "PSG",
            "country": "France",
            "league": "Ligue 1",
            "logo_url": "/../src/assets/PSG.png",
            "description": "Ici C'est Paris !"
        },
        {
            "name": "Chelsea",
            "country": "England",
            "league": "Premier League",
            "logo_url": "/../src/assets/Chelsea.png",
            "description": "Born Is the King"
        },
        {
            "name": "Bayern Munich",
            "country": "Germany",
            "league": "Bundesliga",
            "logo_url": "/../src/assets/Bayern.png",
            "description": "Mia San Mia !"
        },
        {
            "name": "Inter Milan",
            "country": "Italy",
            "league": "Serie A",
            "logo_url": "/../src/assets/Inter.png",
            "description": "Nerazzurri sempre !"
        },
        {
            "name": "Juventus",
            "country": "Italy",
            "league": "Serie A",
            "logo_url": "/../src/assets/Juventus.png",
            "description": "Storia Grande Amore !"
        },
        {
            "name": "Esperance de Tunis",
            "country": "Tunisia",
            "league": "Ligue 1",
            "logo_url": "/../src/assets/Esperance.png",
            "description": "Taraji Dawla !"
        },
    ]
    
    kit_types = ["Home", "Away", "Third"]
    seasons = []
    for year in range(11, 26): 
        start_year = str(year).zfill(2)
        end_year = str(year + 1).zfill(2)
        seasons.append(f"{start_year}/{end_year}")
    default_price = 29.99
    default_stock = 50
    Product.query.delete()
    Club.query.delete()
    club_objects = {}
    for club_info in club_data:
        club = Club(**club_info)
        db.session.add(club)
        db.session.flush()  
        club_objects[club.name] = club
    for club in club_objects.values():
        for season in seasons:
            for kit in kit_types:
                try:
                    basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
                    images_root = os.path.join(basedir, 'frontend', 'public', 'images')
                    desired = club.name.lower().replace(' ', '_')
                    folder_name = None
                    if os.path.isdir(images_root):
                        for entry in os.listdir(images_root):
                            if entry.lower() == desired:
                                folder_name = entry
                                break
                    if not folder_name:
                        folder_name = desired
                    club_slug = folder_name
                except Exception:
                    club_slug = club.name.lower().replace(' ', '_')
                kit_letter = kit[0] 
                season_year = int(season.split('/')[0])
                season_end_year = int(season.split('/')[1])
                
                if season_year < 20: 
                    price = 29.99 
                elif season_year < 22: 
                    price = 39.99
                elif season_year < 24:
                    price = 49.99
                else:
                    price = 59.99
                product = Product(
                    name=f"{club.name} {kit} Kit {season}",
                    description=f"Official {club.name} {kit} jersey for the {season} season",
                    price=price,
                    stock=default_stock,
                    image_url=f"/images/{club_slug}/{season_end_year}{kit_letter}.png",
                    category='Jersey',
                    club_id=club.id,
                    season=season,
                    is_deleted=False
                )
                db.session.add(product)
    db.session.commit()
    try:
        LEGENDARY_DATA = {
            'ronaldo': {
                'full_name': 'Cristiano Ronaldo',
                'jerseys': [
                    {'name': '16/17 Real Madrid (Purple)', 'cat': 'Club', 'season': '16/17'},
                    {'name': '07/08 Man Utd (Red)', 'cat': 'Club', 'season': '07/08'},
                    {'name': '11/12 Real Madrid (Gold)', 'cat': 'Club', 'season': '11/12'},
                    {'name': '2018 Portugal (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2018'},
                    {'name': '2016 Portugal (Euro)', 'cat': 'Country', 'tourn': 'Euro 2016'},
                ]
            },
            'messi': {
                'full_name': 'Lionel Messi',
                'jerseys': [
                    {'name': '08/09 Barcelona (Half/Half)', 'cat': 'Club', 'season': '08/09'},
                    {'name': '14/15 Barcelona', 'cat': 'Club', 'season': '14/15'},
                    {'name': '18/19 Barcelona', 'cat': 'Club', 'season': '18/19'},
                    {'name': '2014 Argentina (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2014'},
                    {'name': '2022 Argentina (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2022'},
                ]
            },
        }

        for slug, info in LEGENDARY_DATA.items():
            for j in info['jerseys']:
                product_name = f"{info['full_name']}, {j['name']}"
                exists = Product.query.filter_by(name=product_name).first()
                if not exists:
                    p = Product(
                        name=product_name,
                        description=product_name,
                        price=59.99,
                        stock=10,
                        image_url='/images/jersey-placeholder.png',
                        category=j.get('cat', 'Jersey'),
                        club_id=None,
                        season=j.get('season'),
                        tournament=j.get('tourn'),
                        is_deleted=False,
                        is_legendary=True,
                        player_slug=slug
                    )
                    db.session.add(p)
        db.session.commit()
    except Exception:
        try:
            db.session.rollback()
        except Exception:
            pass