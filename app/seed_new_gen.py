from . import db
from .models import Product, Club

NEW_GEN_PLAYER_MAP = {
    'kylian-mbappe': {
        '16/17': ('mbappe', '601'),      
        '23/24': ('mbappe', '602'),     
        '24/25': ('mbappe', '603'),      
        '2018': ('mbappe', '604'),      
        '2022': ('mbappe', '605'),      
    },
    'jude-bellingham': {
        '22/23': ('bellingham', '606'),  
        '23/24': ('bellingham', '607'), 
        '24/25': ('bellingham', '608'),  
        '2024': ('bellingham', '609'), 
        '2022': ('bellingham', '610'),   
    },
    'harry-kane': {
        '17/18': ('harry-kane', '1'),  
        '23/24': ('harry-kane', '2'),  
        '24/25': ('harry-kane', '3'), 
        '2018': ('harry-kane', '4'),   
        '2023': ('harry-kane', '5'),   
    },
    'vini-jr': {
        '21/22': ('vini-jr', '616'),     
        '23/24': ('vini-jr', '617'),    
        '24/25': ('vini-jr', '618'),     
        '2022': ('vini-jr', '619'),      
        '2024': ('vini-jr', '620'),      
    },
}

NEW_GEN_PLAYER_DATA = {
    'kylian-mbappe': {
        'full_name': 'Kylian Mbappé',
        'items': [
            {'name': '16/17 AS Monaco (Home)', 'cat': 'Club', 'season': '16/17'},
            {'name': '23/24 PSG (Home)', 'cat': 'Club', 'season': '23/24'},
            {'name': '24/25 Real Madrid (Home)', 'cat': 'Club', 'season': '24/25'},
            {'name': '2018 France (Home/Navy)', 'cat': 'Country', 'tourn': 'World Cup 2018'},
            {'name': '2022 France (Home/Blue)', 'cat': 'Country', 'tourn': 'World Cup 2022'},
        ]
    },
    'jude-bellingham': {
        'full_name': 'Jude Bellingham',
        'items': [
            {'name': '22/23 Borussia Dortmund (Home)', 'cat': 'Club', 'season': '22/23'},
            {'name': '23/24 Real Madrid (Home)', 'cat': 'Club', 'season': '23/24'},
            {'name': '24/25 Real Madrid (Third/Grey-Black)', 'cat': 'Club', 'season': '24/25'},
            {'name': '2024 England (Home/White)', 'cat': 'Country', 'tourn': 'Euro 2024'},
            {'name': '2022 England (Away/Red)', 'cat': 'Country', 'tourn': 'World Cup 2022'},
        ]
    },
    'harry-kane': {
        'full_name': 'Harry Kane',
        'items': [
            {'name': '17/18 Tottenham (Home)', 'cat': 'Club', 'season': '17/18'},
            {'name': '23/24 Bayern Munich (Home)', 'cat': 'Club', 'season': '23/24'},
            {'name': '24/25 Bayern Munich (Champions League/Black)', 'cat': 'Club', 'season': '24/25'},
            {'name': '2018 England (Home/White)', 'cat': 'Country', 'tourn': 'World Cup 2018'},
            {'name': '2023 England (Away/Blue)', 'cat': 'Country', 'tourn': 'Euro 2023'},
        ]
    },
    'vini-jr': {
        'full_name': 'Vinícius Júnior',
        'items': [
            {'name': '21/22 Real Madrid (Home)', 'cat': 'Club', 'season': '21/22'},
            {'name': '23/24 Real Madrid (Home)', 'cat': 'Club', 'season': '23/24'},
            {'name': '24/25 Real Madrid (Home/White)', 'cat': 'Club', 'season': '24/25'},
            {'name': '2022 Brazil (Home/Yellow)', 'cat': 'Country', 'tourn': 'World Cup 2022'},
            {'name': '2024 Brazil (Away/Blue)', 'cat': 'Country', 'tourn': 'Copa America 2024'},
        ]
    },
}

def seed_new_gen_players():
    """Seed new generation players with their jersey products"""
    
    clubs = {}
    club_names = ['AS Monaco', 'PSG', 'Real Madrid', 'France', 'Brazil', 'Borussia Dortmund', 'England', 'Tottenham', 'Bayern Munich']
    
    for club_name in club_names:
        club = Club.query.filter_by(name=club_name).first()
        if not club:
            club = Club(
                name=club_name,
                country='France' if club_name == 'AS Monaco' or club_name == 'PSG' else 'Spain' if club_name == 'Real Madrid' else 'France' if club_name == 'France' else 'Brazil' if club_name == 'Brazil' else 'Germany' if club_name == 'Borussia Dortmund' or club_name == 'Bayern Munich' else 'England',
                description=f'{club_name} official jersey',
                logo_url=f'/images/clubs/{club_name.lower().replace(" ", "_")}.png',
                league='La Liga' if club_name == 'Real Madrid' else 'Ligue 1' if club_name in ['PSG', 'AS Monaco'] else 'Bundesliga' if club_name in ['Borussia Dortmund', 'Bayern Munich'] else 'Premier League' if club_name == 'Tottenham' else 'International'
            )
            db.session.add(club)
            db.session.flush()
        clubs[club_name] = club
    for slug, info in NEW_GEN_PLAYER_DATA.items():
        full_name = info.get('full_name')
        for item in info.get('items', []):
            product_name = f"{full_name} - {item['name']}"
            existing = Product.query.filter_by(name=product_name).first()
            if existing:
                continue
            club_name = 'Real Madrid' 
            if 'Monaco' in item['name']:
                club_name = 'AS Monaco'
            elif 'PSG' in item['name']:
                club_name = 'PSG'
            elif 'Real Madrid' in item['name']:
                club_name = 'Real Madrid'
            elif 'Dortmund' in item['name']:
                club_name = 'Borussia Dortmund'
            elif 'Bayern' in item['name']:
                club_name = 'Bayern Munich'
            elif 'Tottenham' in item['name']:
                club_name = 'Tottenham'
            elif 'France' in item['name']:
                club_name = 'France'
            elif 'England' in item['name']:
                club_name = 'England'
            elif 'Brazil' in item['name']:
                club_name = 'Brazil'
            
            club = clubs[club_name]
            image_url = '/images/new_gen_players/placeholder.png' 
            season = item.get('season', '')
            
            if slug in NEW_GEN_PLAYER_MAP and season in NEW_GEN_PLAYER_MAP[slug]:
                player_folder, image_id = NEW_GEN_PLAYER_MAP[slug][season]
                image_url = f'/images/new_gen_players/{player_folder}/{image_id}'
            else:
                tourn = item.get('tourn', '')
                if tourn:
                    year = tourn.split()[-1]
                    if slug in NEW_GEN_PLAYER_MAP and year in NEW_GEN_PLAYER_MAP[slug]:
                        player_folder, image_id = NEW_GEN_PLAYER_MAP[slug][year]
                        image_url = f'/images/new_gen_players/{player_folder}/{image_id}'
            
            product = Product(
                name=product_name,
                description=f'{full_name} - {item["name"]} authentic replica jersey',
                price=50.00,
                stock=100,
                image_url=image_url,
                category=item.get('cat', 'Jersey'),
                club_id=club.id,
                season=season if season else item.get('tourn', ''),
                is_legendary=False,
                player_slug=slug
            )
            
            db.session.add(product)
    
    db.session.commit()
    print(f"[OK] Successfully seeded new gen players")

if __name__ == '__main__':
    from app import create_app
    app = create_app()
    with app.app_context():
        seed_new_gen_players()
