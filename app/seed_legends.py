from . import db
from .models import Product

# Mapping of player to (player_folder, image_id) for getting correct image URLs
# Image ID is used for both front and back (e.g., 496 for 496-front.png and 496-back.png)
PLAYER_CLUB_MAP = {
    'cristiano-ronaldo': {
        '16/17': ('ronaldo', '496'),  # Real Madrid 16/17 Purple
        '07/08': ('ronaldo', '497'),  # Man United 07/08
        '11/12': ('ronaldo', '498'),  # Real Madrid 11/12
        '2016': ('ronaldo', '500'),   # Portugal Euro 2016
        '2018': ('ronaldo', '499'),   # Portugal World Cup 2018
    },
    'lionel-messi': {
        '08/09': ('messi', '501'),  # Barcelona 08/09
        '14/15': ('messi', '502'),  # Barcelona 14/15
        '18/19': ('messi', '503'),  # Barcelona 18/19
        '2014': ('messi', '504'),   # Argentina World Cup 2014
        '2022': ('messi', '505'),   # Argentina World Cup 2022
    },
    'zinedine-zidane': {
        '01/02': ('zidane', '506'),   # Real Madrid Centenary
        '97/98': ('zidane', '507'),   # Juventus
        '95/96': ('zidane', '508'),   # Bordeaux
        '05/06': ('zidane', '508'),   # Real Madrid
        '1998': ('zidane', '509'),    # France World Cup 1998
        '2006': ('zidane', '510'),    # France World Cup 2006
    },
    'neymar-jr': {
        '14/15': ('neymar', '511'),   # Barcelona
        '11/12': ('neymar', '512'),   # Santos
        '19/20': ('neymar', '513'),   # PSG Jordan
        '2014': ('neymar', '514'),    # Brazil World Cup 2014
        '2018': ('neymar', '515'),    # Brazil World Cup 2018
    },
    'sergio-ramos': {
        '13/14': ('sergio', None),
        '16/17': ('sergio', None),
        '21/22': ('sergio', None),
    },
    'marcelo': {
        '16/17': ('marcelo', None),
        '21/22': ('marcelo', None),
        '13/14': ('marcelo', None),
    },
    'xavi': {
        '08/09': ('xavi', None),
        '10/11': ('xavi', None),
        '14/15': ('xavi', None),
    },
    'andres-iniesta': {
        '08/09': ('iniesta', None),
        '14/15': ('iniesta', None),
        '17/18': ('iniesta', None),
    },
    'luka-modric': {
        '10/11': ('maldini', None),
        '17/18': ('maldini', None),
        '21/22': ('maldini', None),
    },
    'karim-benzema': {
        '07/08': ('benzema', None),
        '11/12': ('benzema', None),
        '21/22': ('benzema', None),
    },
    'toni-kroos': {
        '12/13': ('kroos', None),
        '16/17': ('kroos', None),
        '23/24': ('kroos', None),
    },
    'thierry-henry': {
        '03/04': ('henry', None),
        '05/06': ('henry', None),
        '08/09': ('henry', None),
    },
    'paolo-maldini': {
        '02/03': ('maldini', None),
        '88/89': ('maldini', None),
        '06/07': ('maldini', None),
    },
}

LEGEND_DATA = {
    'cristiano-ronaldo': {
        'full_name': 'Cristiano Ronaldo',
        'items': [
            {'name': '16/17 Real Madrid (Purple)', 'cat': 'Club', 'season': '16/17'},
            {'name': '07/08 Man Utd (Red)', 'cat': 'Club', 'season': '07/08'},
            {'name': '11/12 Real Madrid (Gold)', 'cat': 'Club', 'season': '11/12'},
            {'name': '2018 Portugal (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2018'},
            {'name': '2016 Portugal (Euro)', 'cat': 'Country', 'tourn': 'Euro 2016'},
        ]
    },
    'lionel-messi': {
        'full_name': 'Lionel Messi',
        'items': [
            {'name': '08/09 Barcelona (Half/Half)', 'cat': 'Club', 'season': '08/09'},
            {'name': '14/15 Barcelona', 'cat': 'Club', 'season': '14/15'},
            {'name': '18/19 Barcelona', 'cat': 'Club', 'season': '18/19'},
            {'name': '2014 Argentina (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2014'},
            {'name': '2022 Argentina (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2022'},
        ]
    },
    'zinedine-zidane': {
        'full_name': 'Zinedine Zidane',
        'items': [
            {'name': '01/02 Real Madrid (Centenary)', 'cat': 'Club', 'season': '01/02'},
            {'name': '97/98 Juventus', 'cat': 'Club', 'season': '97/98'},
            {'name': '05/06 Real Madrid', 'cat': 'Club', 'season': '05/06'},
            {'name': '1998 France (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 1998'},
            {'name': '2006 France (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2006'},
        ]
    },
    'neymar-jr': {
        'full_name': 'Neymar Jr.',
        'items': [
            {'name': '14/15 Barcelona', 'cat': 'Club', 'season': '14/15'},
            {'name': '11/12 Santos', 'cat': 'Club', 'season': '11/12'},
            {'name': '19/20 PSG (Jordan)', 'cat': 'Club', 'season': '19/20'},
            {'name': '2014 Brazil (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2014'},
            {'name': '2018 Brazil (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2018'},
        ]
    },
    'pele': {
        'full_name': 'Pelé',
        'items': [
            {'name': '1963 Santos', 'cat': 'Club', 'season': '1963'},
            {'name': '1970 NY Cosmos', 'cat': 'Club', 'season': '1970'},
            {'name': '1962 Santos', 'cat': 'Club', 'season': '1962'},
            {'name': '1958 Brazil (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 1958'},
            {'name': '1970 Brazil (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 1970'},
        ]
    },
    'diego-maradona': {
        'full_name': 'Diego Maradona',
        'items': [
            {'name': '86/87 Napoli (Buitoni)', 'cat': 'Club', 'season': '86/87'},
            {'name': '81/82 Boca Juniors', 'cat': 'Club', 'season': '81/82'},
            {'name': '92/93 Sevilla', 'cat': 'Club', 'season': '92/93'},
            {'name': '1986 Argentina (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 1986'},
            {'name': '1994 Argentina (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 1994'},
        ]
    },
    'sergio-ramos': {
        'full_name': 'Sergio Ramos',
        'items': [
            {'name': '13/14 Real Madrid', 'cat': 'Club', 'season': '13/14'},
            {'name': '16/17 Real Madrid', 'cat': 'Club', 'season': '16/17'},
            {'name': '21/22 PSG', 'cat': 'Club', 'season': '21/22'},
            {'name': '2010 Spain (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2010'},
            {'name': '2012 Spain (Euro)', 'cat': 'Country', 'tourn': 'Euro 2012'},
        ]
    },
    'marcelo': {
        'full_name': 'Marcelo Vieira',
        'items': [
            {'name': '16/17 Real Madrid', 'cat': 'Club', 'season': '16/17'},
            {'name': '21/22 Real Madrid', 'cat': 'Club', 'season': '21/22'},
            {'name': '13/14 Real Madrid', 'cat': 'Club', 'season': '13/14'},
            {'name': '2013 Brazil (Confed Cup)', 'cat': 'Country', 'tourn': 'Confed Cup 2013'},
            {'name': '2018 Brazil (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2018'},
        ]
    },
    'xavi': {
        'full_name': 'Xavi',
        'items': [
            {'name': '08/09 Barcelona', 'cat': 'Club', 'season': '08/09'},
            {'name': '10/11 Barcelona', 'cat': 'Club', 'season': '10/11'},
            {'name': '14/15 Barcelona', 'cat': 'Club', 'season': '14/15'},
            {'name': '2008 Spain (Euro)', 'cat': 'Country', 'tourn': 'Euro 2008'},
            {'name': '2010 Spain (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2010'},
        ]
    },
    'andres-iniesta': {
        'full_name': 'Andrés Iniesta',
        'items': [
            {'name': '08/09 Barcelona', 'cat': 'Club', 'season': '08/09'},
            {'name': '14/15 Barcelona', 'cat': 'Club', 'season': '14/15'},
            {'name': '17/18 Barcelona', 'cat': 'Club', 'season': '17/18'},
            {'name': '2010 Spain (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2010'},
            {'name': '2012 Spain (Euro)', 'cat': 'Country', 'tourn': 'Euro 2012'},
        ]
    },
    'karim-benzema': {
        'full_name': 'Karim Benzema',
        'items': [
            {'name': '21/22 Real Madrid', 'cat': 'Club', 'season': '21/22'},
            {'name': '11/12 Real Madrid', 'cat': 'Club', 'season': '11/12'},
            {'name': '07/08 Lyon', 'cat': 'Club', 'season': '07/08'},
            {'name': '2014 France (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2014'},
            {'name': '2021 France (Euro 2020)', 'cat': 'Country', 'tourn': 'Euro 2020'},
        ]
    },
    'toni-kroos': {
        'full_name': 'Toni Kroos',
        'items': [
            {'name': '16/17 Real Madrid', 'cat': 'Club', 'season': '16/17'},
            {'name': '23/24 Real Madrid', 'cat': 'Club', 'season': '23/24'},
            {'name': '12/13 Bayern Munich', 'cat': 'Club', 'season': '12/13'},
            {'name': '2014 Germany (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2014'},
            {'name': '2024 Germany (Euro)', 'cat': 'Country', 'tourn': 'Euro 2024'},
        ]
    },
    'thierry-henry': {
        'full_name': 'Thierry Henry',
        'items': [
            {'name': '03/04 Arsenal', 'cat': 'Club', 'season': '03/04'},
            {'name': '05/06 Arsenal (Maroon)', 'cat': 'Club', 'season': '05/06'},
            {'name': '08/09 Barcelona', 'cat': 'Club', 'season': '08/09'},
            {'name': '1998 France (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 1998'},
            {'name': '2006 France (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2006'},
        ]
    },
    'luka-modric': {
        'full_name': 'Luka Modrić',
        'items': [
            {'name': '17/18 Real Madrid', 'cat': 'Club', 'season': '17/18'},
            {'name': '21/22 Real Madrid', 'cat': 'Club', 'season': '21/22'},
            {'name': '10/11 Tottenham', 'cat': 'Club', 'season': '10/11'},
            {'name': '2018 Croatia (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2018'},
            {'name': '2022 Croatia (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2022'},
        ]
    },
    'paolo-maldini': {
        'full_name': 'Paolo Maldini',
        'items': [
            {'name': '02/03 AC Milan', 'cat': 'Club', 'season': '02/03'},
            {'name': '88/89 AC Milan', 'cat': 'Club', 'season': '88/89'},
            {'name': '06/07 AC Milan', 'cat': 'Club', 'season': '06/07'},
            {'name': '1994 Italy (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 1994'},
            {'name': '2000 Italy (Euro)', 'cat': 'Country', 'tourn': 'Euro 2000'},
        ]
    },
    'mesut-ozil': {
        'full_name': 'Mesut Özil',
        'items': [
            {'name': '11/12 Real Madrid', 'cat': 'Club', 'season': '11/12'},
            {'name': '13/14 Arsenal', 'cat': 'Club', 'season': '13/14'},
            {'name': '16/17 Arsenal', 'cat': 'Club', 'season': '16/17'},
            {'name': '2010 Germany (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2010'},
            {'name': '2014 Germany (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2014'},
        ]
    },
    'steven-gerrard': {
        'full_name': 'Steven Gerrard',
        'items': [
            {'name': '04/05 Liverpool', 'cat': 'Club', 'season': '04/05'},
            {'name': '08/09 Liverpool', 'cat': 'Club', 'season': '08/09'},
            {'name': '13/14 Liverpool', 'cat': 'Club', 'season': '13/14'},
            {'name': '2004 England (Euro)', 'cat': 'Country', 'tourn': 'Euro 2004'},
            {'name': '2010 England (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2010'},
        ]
    },
    'frank-lampard': {
        'full_name': 'Frank Lampard',
        'items': [
            {'name': '04/05 Chelsea', 'cat': 'Club', 'season': '04/05'},
            {'name': '11/12 Chelsea', 'cat': 'Club', 'season': '11/12'},
            {'name': '09/10 Chelsea', 'cat': 'Club', 'season': '09/10'},
            {'name': '2004 England (Euro)', 'cat': 'Country', 'tourn': 'Euro 2004'},
            {'name': '2010 England (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2010'},
        ]
    },
    'didier-drogba': {
        'full_name': 'Didier Drogba',
        'items': [
            {'name': '11/12 Chelsea', 'cat': 'Club', 'season': '11/12'},
            {'name': '04/05 Chelsea', 'cat': 'Club', 'season': '04/05'},
            {'name': '03/04 Marseille', 'cat': 'Club', 'season': '03/04'},
            {'name': '2006 Ivory Coast (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2006'},
            {'name': '2012 Ivory Coast (AFCON)', 'cat': 'Country', 'tourn': 'AFCON 2012'},
        ]
    },
    'raul': {
        'full_name': 'Raúl González',
        'items': [
            {'name': '01/02 Real Madrid', 'cat': 'Club', 'season': '01/02'},
            {'name': '97/98 Real Madrid', 'cat': 'Club', 'season': '97/98'},
            {'name': '09/10 Real Madrid', 'cat': 'Club', 'season': '09/10'},
            {'name': '2000 Spain (Euro)', 'cat': 'Country', 'tourn': 'Euro 2000'},
            {'name': '2002 Spain (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2002'},
        ]
    },
    'andrea-pirlo': {
        'full_name': 'Andrea Pirlo',
        'items': [
            {'name': '06/07 AC Milan', 'cat': 'Club', 'season': '06/07'},
            {'name': '11/12 Juventus', 'cat': 'Club', 'season': '11/12'},
            {'name': '14/15 Juventus', 'cat': 'Club', 'season': '14/15'},
            {'name': '2006 Italy (World Cup)', 'cat': 'Country', 'tourn': 'World Cup 2006'},
            {'name': '2012 Italy (Euro)', 'cat': 'Country', 'tourn': 'Euro 2012'},
        ]
    }
}


def seed_all_legends():
    count = 0
    for slug, info in LEGEND_DATA.items():
        full = info.get('full_name')
        for item in info.get('items', []):
            product_name = f"{full} - {item['name']}"
            exists = Product.query.filter_by(name=product_name).first()
            if exists:
                continue
            
            # Generate image URL - use old_gen_players folder
            image_url = '/images/old_gen_players/placeholder.png'  # Default fallback
            season = item.get('season', '')
            
            # Try to get player mapping for this season
            if slug in PLAYER_CLUB_MAP and season in PLAYER_CLUB_MAP[slug]:
                player_folder, image_id = PLAYER_CLUB_MAP[slug][season]
                if image_id:
                    # Use specific image ID for both front and back
                    # Store as JSON-like format: player/image_id (front and back will be suffixed in frontend)
                    image_url = f'/images/old_gen_players/{player_folder}/{image_id}'
                else:
                    # Use first available image (front) from player folder
                    image_url = f'/images/old_gen_players/{player_folder}/{player_folder}-front.png'
            else:
                # Fallback: use player folder with standard naming
                player_slug = slug.split('-')[0]  # Get first part of slug
                image_url = f'/images/old_gen_players/{player_slug}/{player_slug}-front.png'
            
            p = Product(
                name=product_name,
                description=product_name,
                price=89.99,
                stock=10,
                image_url=image_url,
                category=item.get('cat', 'Jersey'),
                club_id=None,
                season=item.get('season'),
                tournament=item.get('tourn'),
                is_deleted=False,
                is_legendary=True,
                player_slug=slug
            )
            db.session.add(p)
            count += 1
    db.session.commit()
    return count
