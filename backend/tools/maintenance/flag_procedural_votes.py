import logging
import sys
import os

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.core.db import db

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("maintenance.flag_procedural")

def run_cleanup():
    logger.info("🚀 Starting procedural votes cleanup...")
    
    # Define patterns for procedural votes
    # These match what we added to the API filter
    patterns = [
        '%posiedzenie Sejmu%', 
        '%przerw%', 
        '%odroczen%', 
        '%Głosowanie proceduralne%', 
        '%wniosek o%', 
        '%porządek dzienny%'
    ]
    
    total_updated = 0
    
    for pattern in patterns:
        query = "UPDATE votes SET is_procedural = True WHERE title_raw ILIKE %s AND is_procedural = False"
        try:
            # We use the raw DB execute which handles the commit if using our Database wrapper
            # Database.execute(query, params) uses a commit=True cursor
            db.execute(query, (pattern,))
            # We don't have row count in our custom execute easy, so we just log progress
            logger.info(f"Flagged votes matching: {pattern}")
        except Exception as e:
            logger.error(f"Error flagging pattern {pattern}: {e}")

    # Specifically flag "Nagłówek Posiedzenia" street titles
    try:
        db.execute("UPDATE votes SET is_procedural = True WHERE street_title = 'Nagłówek Posiedzenia' AND is_procedural = False")
        logger.info("Flagged 'Nagłówek Posiedzenia' street titles")
    except Exception as e:
        logger.error(f"Error flagging street titles: {e}")

    logger.info("✅ Cleanup finished.")

if __name__ == "__main__":
    run_cleanup()
