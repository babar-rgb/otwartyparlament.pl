import logging
logging.basicConfig(level=logging.INFO)

import sys
import os

# Ensure we can import core modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.core.db import db

# Data from report
MPS_DATA = {
    # PSL
    "Andrzej Grzyb": {"twitter": "https://x.com/GrzybAndrzej", "facebook": "https://www.facebook.com/AndrzejGrzybMEP/"},
    "Wiesław Różyński": {"twitter": "https://x.com/wieslawrozynski", "facebook": None},
    "Władysław Bartoszewski": {"twitter": "https://x.com/WTBartoszewski", "facebook": "https://www.facebook.com/WTBartoszewski/"},
    
    # Polska 2050
    "Bożenna Hołownia": {"twitter": None, "facebook": "https://www.facebook.com/bozenna.holownia"},
    
    # Republikanie (Jan Ardanowski in DB)
    "Jan Ardanowski": {"twitter": "https://x.com/jkardanowski", "facebook": "https://www.facebook.com/jkardanowski/"},
    
    # Lewica
    "Tadeusz Tomaszewski": {"twitter": None, "facebook": "https://www.facebook.com/taddek.tomaszewski/"}
}

def update_mps():
    logging.info(f"Updating {len(MPS_DATA)} MPs...")
    
    with db.get_cursor(commit=True) as cur:
        updated_count = 0
        for name, links in MPS_DATA.items():
            updates = []
            if links['facebook']:
                updates.append(f'"facebook": "{links["facebook"]}"')
            if links['twitter']:
                updates.append(f'"twitter": "{links["twitter"]}"')
                
            if not updates:
                continue
                
            json_fragment = '{' + ', '.join(updates) + '}'
            
            logging.info(f"Updating {name} with {json_fragment}...")
            
            cur.execute(
                "UPDATE mps SET contact_info = contact_info || %s::jsonb WHERE name = %s",
                (json_fragment, name)
            )
            updated_count += 1
            
        logging.info(f"Updated {updated_count} MPs successfully.")

if __name__ == "__main__":
    update_mps()
