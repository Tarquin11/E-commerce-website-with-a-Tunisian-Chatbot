#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to update legendary product image URLs in the database
"""
from app import create_app, db
from app.models import Product
from app.seed_legends import PLAYER_CLUB_MAP, LEGEND_DATA

def update_legendary_images():
    app = create_app()
    with app.app_context():
        updated = 0
        for slug, info in LEGEND_DATA.items():
            full = info.get('full_name')
            for item in info.get('items', []):
                product_name = f"{full} - {item['name']}"
                product = Product.query.filter_by(name=product_name).first()
                
                if not product:
                    continue
                
                # Generate image URL - use old_gen_players folder
                image_url = '/images/old_gen_players/placeholder.png'  # Default fallback
                
                # Try to get season (for clubs) or tournament year (for countries)
                season_key = item.get('season', '') or item.get('tourn', '')
                
                # Extract just the year for country tournaments (e.g., "World Cup 2018" -> "2018")
                if not item.get('season') and item.get('tourn'):
                    # Extract year from tournament string
                    tourn = item.get('tourn', '')
                    year = tourn.split()[-1] if tourn else ''
                    season_key = year
                
                # Try to get player mapping for this season
                if slug in PLAYER_CLUB_MAP and season_key in PLAYER_CLUB_MAP[slug]:
                    player_folder, image_id = PLAYER_CLUB_MAP[slug][season_key]
                    if image_id:
                        # Use specific image ID for both front and back
                        image_url = f'/images/old_gen_players/{player_folder}/{image_id}'
                    else:
                        # Use first available image (front) from player folder
                        image_url = f'/images/old_gen_players/{player_folder}/{player_folder}-front.png'
                else:
                    # Fallback: use player folder with standard naming
                    player_slug = slug.split('-')[0]  # Get first part of slug
                    image_url = f'/images/old_gen_players/{player_slug}/{player_slug}-front.png'
                
                if product.image_url != image_url:
                    product.image_url = image_url
                    db.session.add(product)
                    updated += 1
                    print(f"[OK] Updated: {product_name} -> {image_url}")
        
        db.session.commit()
        print(f"\n[OK] Successfully updated {updated} products")

if __name__ == '__main__':
    update_legendary_images()
