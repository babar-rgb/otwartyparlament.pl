import logging
logging.basicConfig(level=logging.INFO)
import sys
import os
import re

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.orm_db import SessionLocal
from backend.models import Vote, Bill

def auto_link_votes():
    session = SessionLocal()
    try:
        # Get unlinked votes for Term 10 (since we only have Term 10 bills for now)
        unlinked_votes = session.query(Vote).filter(
            Vote.bill_id == None,
            Vote.term == 10
        ).all()
        logging.info(f"Checking {len(unlinked_votes)} unlinked votes for Term 10...")
        
        linked_count = 0
        for vote in unlinked_votes:
            # Look for "druk nr XXX" or "druku nr XXX"
            # We check both topic and description
            text_to_search = f"{vote.topic or ''} {vote.description or ''}"
            match = re.search(r'druki? nr (\d+)', text_to_search, re.IGNORECASE)
            
            if match:
                print_number = match.group(1)
                # Find the bill (assuming it's Term 10)
                bill = session.query(Bill).filter(
                    Bill.number == print_number
                ).first()
                
                if bill:
                    vote.bill_id = bill.id
                    session.add(vote)
                    linked_count += 1
                    if linked_count % 50 == 0:
                        logging.info(f"Linked {linked_count} votes...")
        
        session.commit()
        logging.info(f"Finished! Total votes linked: {linked_count}")

    except Exception as e:
        logging.info(f"Linking Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    auto_link_votes()
