from PIL import Image, ImageDraw, ImageFont
import os

def create_placeholder_images():
    """Create placeholder jersey images for new gen players"""
    
    players_data = {
        'mbappe': [
            (1, 'Monaco 16/17', '#FF0000'),    
            (2, 'PSG 23/24', '#004687'),        
            (3, 'Real Madrid 24/25', '#FFFFFF'), 
            (4, 'France 2018', '#1B4995'),      
            (5, 'France 2022', '#4B81C0'),      
        ],
        'bellingham': [
            (1, 'Dortmund 22/23', '#FFD700'),   
            (2, 'Real Madrid 23/24', '#FFFFFF'), 
            (3, 'Real Madrid 24/25', '#808080'), 
            (4, 'England 2024', '#FFFFFF'),     
            (5, 'England 2022', '#CC0000'),    
        ],
        'harry-kane': [
            (1, 'Tottenham 17/18', '#FFFFFF'),
            (2, 'Bayern 23/24', '#DC052D'),    
            (3, 'Bayern 24/25', '#000000'),     
            (4, 'England 2018', '#FFFFFF'),     
            (5, 'England 2023', '#0066CC'),     
        ],
        'vini-jr': [
            (1, 'Real Madrid 21/22', '#FFFFFF'), 
            (2, 'Real Madrid 23/24', '#FFFFFF'), 
            (3, 'Real Madrid 24/25', '#FFFFFF'),
            (4, 'Brazil 2022', '#FFDD00'),      
            (5, 'Brazil 2024', '#0066CC'),     
        ],
    }
    
    for player_folder, jerseys in players_data.items():
        player_path = f'frontend/public/images/new_gen_players/{player_folder}'
        os.makedirs(player_path, exist_ok=True)
        
        for image_id, description, color in jerseys:
            img_front = Image.new('RGB', (400, 500), color=color)
            draw = ImageDraw.Draw(img_front)
            text = f"{description}\n(Front)"
            draw.text((50, 200), text, fill='white', font=None)
            
            img_front.save(f'{player_path}/{image_id}-front.png')
            img_back = Image.new('RGB', (400, 500), color=color)
            draw = ImageDraw.Draw(img_back)
            text = f"{description}\n(Back)"
            draw.text((50, 200), text, fill='white', font=None)
            img_back.save(f'{player_path}/{image_id}-back.png')
            print(f"[OK] Created {player_folder}/{image_id}-front.png and {image_id}-back.png")

if __name__ == '__main__':
    create_placeholder_images()
    print("\n[OK] All placeholder images created successfully")
