import logging
logging.basicConfig(level=logging.INFO)
import sys
import os
from sqlalchemy import text, func

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.core.orm_db import SessionLocal
from backend.models import Vote

def check_data_quality():
    db = SessionLocal()
    try:
        total = db.query(Vote).count()
        if total == 0:
            logging.info("No votes in DB.")
            return

        with_print = db.query(Vote).filter(Vote.print_number != None).count()
        logging.info(f"Total Votes: {total}")
        logging.info(f"Votes with Print Number (DB column): {with_print} ({with_print/total*100:.1f}%)")
        
        # Check extraction regex quality
        import re
        extracted_count = 0
        votes = db.query(Vote).all()
        for v in votes:
            if re.search(r'druki? n?r (\d+)', v.title_raw or "", re.IGNORECASE):
                extracted_count += 1
        
        logging.info(f"Votes with extractable Print Number (Regex): {extracted_count} ({extracted_count/total*100:.1f}%)")
        
        # Check potential False Positives with current loose logic
        loose_groups = 0
        for v in votes:
             # If no print number, we currently rely on this:
             if not re.search(r'druki? n?r (\d+)', v.title_raw or "", re.IGNORECASE):
                 loose_groups += 1
                 
        logging.info(f"Votes relying on LOOSE text matching (RISK): {loose_groups}")

    finally:
        db.close()

if __name__ == "__main__":
    check_data_quality()
