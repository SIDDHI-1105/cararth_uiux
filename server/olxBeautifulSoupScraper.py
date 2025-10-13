#!/usr/bin/env python3
"""
OLX India Scraper using Beautiful Soup
Free alternative to Apify for scraping OLX car listings
"""

import requests
from bs4 import BeautifulSoup
import json
import sys
import re
from typing import List, Dict, Any
from datetime import datetime

def clean_price(price_text: str) -> int:
    """Extract numeric price from text like '₹ 4,50,000'"""
    if not price_text:
        return 0
    # Remove currency symbols and commas
    cleaned = re.sub(r'[₹,\s]', '', price_text)
    try:
        return int(cleaned)
    except:
        return 0

def extract_year_from_text(text: str) -> int:
    """Extract year from text"""
    if not text:
        return 0
    # Find 4-digit year (2000-2025)
    match = re.search(r'(20[0-2][0-9])', text)
    return int(match.group(1)) if match else 0

def scrape_olx_hyderabad(max_listings: int = 100) -> List[Dict[str, Any]]:
    """
    Scrape OLX Hyderabad car listings using Beautiful Soup
    
    Args:
        max_listings: Maximum number of listings to scrape
        
    Returns:
        List of car listing dictionaries
    """
    listings = []
    base_url = "https://www.olx.in/hyderabad_g4058877/cars_c84"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        print(f"🚀 Scraping OLX Hyderabad cars...")
        print(f"📡 Fetching: {base_url}")
        
        response = requests.get(base_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'lxml')
        
        # Find all listing cards (OLX uses li elements with specific data attributes)
        listing_elements = soup.find_all('li', {'data-aut-id': 'itemBox'})
        
        print(f"📦 Found {len(listing_elements)} listings on page")
        
        for idx, element in enumerate(listing_elements[:max_listings]):
            try:
                # Extract title
                title_elem = element.find('span', {'data-aut-id': 'itemTitle'})
                title = title_elem.text.strip() if title_elem else "Unknown Car"
                
                # Extract price
                price_elem = element.find('span', {'data-aut-id': 'itemPrice'})
                price_text = price_elem.text.strip() if price_elem else "0"
                price = clean_price(price_text)
                
                # Extract location
                location_elem = element.find('span', {'data-aut-id': 'item-location'})
                location = location_elem.text.strip() if location_elem else "Hyderabad"
                
                # Extract link
                link_elem = element.find('a', {'data-aut-id': 'itemImage'})
                url = link_elem.get('href', '') if link_elem else ""
                if url and not url.startswith('http'):
                    url = f"https://www.olx.in{url}"
                
                # Extract image
                img_elem = element.find('img', {'data-aut-id': 'itemImage'})
                image_url = img_elem.get('src', '') if img_elem else ""
                
                # Extract description/details
                desc_elem = element.find('div', {'data-aut-id': 'itemDetails'})
                description = desc_elem.text.strip() if desc_elem else ""
                
                # Try to extract year from title or description
                year = extract_year_from_text(f"{title} {description}")
                
                # Extract make/model from title (first two words usually)
                title_parts = title.split()
                make = title_parts[0] if len(title_parts) > 0 else "Unknown"
                model = " ".join(title_parts[1:3]) if len(title_parts) > 1 else "Unknown"
                
                listing = {
                    'title': title,
                    'make': make,
                    'model': model,
                    'year': year if year > 0 else 2020,  # Default year
                    'price': price,
                    'location': location,
                    'city': 'Hyderabad',
                    'url': url,
                    'images': [image_url] if image_url else [],
                    'description': description,
                    'source': 'OLX',
                    'scraped_at': datetime.now().isoformat()
                }
                
                listings.append(listing)
                print(f"✓ {idx+1}. {title} - ₹{price:,}")
                
            except Exception as e:
                print(f"❌ Error extracting listing {idx+1}: {str(e)}", file=sys.stderr)
                continue
        
        print(f"\n✅ Scraped {len(listings)} OLX listings")
        return listings
        
    except requests.RequestException as e:
        print(f"❌ Request failed: {str(e)}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"❌ Scraping failed: {str(e)}", file=sys.stderr)
        return []

def main():
    """Main entry point"""
    max_listings = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    
    listings = scrape_olx_hyderabad(max_listings)
    
    # Output as JSON for Node.js to consume
    print(json.dumps({
        'success': True,
        'count': len(listings),
        'listings': listings
    }, indent=2))

if __name__ == "__main__":
    main()
