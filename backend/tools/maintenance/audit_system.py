import logging
logging.basicConfig(level=logging.INFO)
import sys
import os
import re

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.orm_db import SessionLocal
from backend.models import Vote, Bill

def run_audit():
    session = SessionLocal()
    try:
        logging.info("=== Sejm Data Audit Report ===")
        
        # 1. Votes Stats
        total_votes_9 = session.query(Vote).filter(Vote.term == 9).count()
        total_votes_10 = session.query(Vote).filter(Vote.term == 10).count()
        logging.info(f"Total Votes (Term 9): {total_votes_9}")
        logging.info(f"Total Votes (Term 10): {total_votes_10}")
        
        # 2. Vote-Bill Linking
        votes_with_bill = session.query(Vote).filter(Vote.bill_id != None).count()
        votes_without_bill = (total_votes_9 + total_votes_10) - votes_with_bill
        logging.info(f"Votes linked to Bills: {votes_with_bill}")
        logging.info(f"Votes NOT linked to Bills: {votes_without_bill}")
        
        # 3. Fuzzy match check (potential links)
        # We check how many votes without bill_id have "druk nr" in description (or would-be title)
        # Since 'title' is missing, we check 'topic' or 'description' or 'name_citizen'
        # based on my previous probe, 'description' seems to hold some text.
        potential_links = session.query(Vote).filter(
            Vote.bill_id == None,
            Vote.description.ilike('%druk%')
        ).count()
        logging.info(f"Votes with potential 'druk' mention (unlinked): {potential_links}")
        
        # 4. Bills Content Stats
        total_bills = session.query(Bill).count()
        bills_with_content = session.query(Bill).filter(Bill.content != None, Bill.content != "").count()
        bills_with_url = session.query(Bill).filter(Bill.url != None).count()
        
        logging.info(f"\n--- Bill Content Audit ---")
        logging.info(f"Total Bills in DB: {total_bills}")
        logging.info(f"Bills with extracted content: {bills_with_content}")
        logging.info(f"Bills missing content: {total_bills - bills_with_content}")
        logging.info(f"Bills with target URL (for download): {bills_with_url}")
        
        # 5. Analysis coverage
        from backend.models import VoteAnalysis, BillAnalysis
        votes_analyzed = session.query(VoteAnalysis).count()
        bills_analyzed = session.query(BillAnalysis).count()
        logging.info(f"\n--- AI Analysis Coverage ---")
        logging.info(f"Votes with AI Analysis: {votes_analyzed}")
        logging.info(f"Bills with AI Analysis: {bills_analyzed}")

        logging.info("\n=== End of Report ===")

    except Exception as e:
        logging.info(f"Audit Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    run_audit()
