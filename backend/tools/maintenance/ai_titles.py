import sys
import os
import re
import argparse
import random
import time

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.orm_db import SessionLocal
from backend.models import Vote, Bill
from backend.services.gemini import gemini_service

def resolve_bill_content(session, vote, verbose=False):
    """
    Tries to find the bill content associated with a vote.
    Strategy:
    1. Check vote.bill_id
    2. Check for "Druk nr XXX" in vote title
    """
    bill = None
    
    # 1. Direct Link
    if vote.bill_id:
        bill = session.query(Bill).filter(Bill.id == vote.bill_id).first()
        if bill and verbose:
            print(f"   [LINK] Found linked bill by ID: {bill.print_number}")

    # 2. Extract from title if not found
    if not bill:
        match = re.search(r'druki? nr (\d+)', vote.title, re.IGNORECASE)
        if match:
            print_number = match.group(1)
            # Try to find bill by print number (fuzzy match or exact?)
            # Assuming 'term' matches vote's term
            bill = session.query(Bill).filter(
                Bill.print_number == print_number, 
                Bill.term == vote.term
            ).first()
            if bill and verbose:
                 print(f"   [REGEX] Found bill by print number: {print_number}")

    if bill and bill.content:
        return bill.content
    
    if bill and bill.description:
        return bill.description # Fallback to description
        
    return ""

def process_titles(limit=10, force=False, verbose=False, dry_run=False):
    session = SessionLocal()
    try:
        query = session.query(Vote).filter(Vote.term.in_([9, 10]))
        
        if not force:
            query = query.filter(Vote.title_clean == None)
        
        # Randomize to get variety in testing
        votes = query.order_by(Vote.date.desc()).limit(limit * 3).all() 
        # Sort by date desc is better for relevance, but limit * 3 and then random sample allows to check different types
        
        if not votes:
            print("No votes to process.")
            return

        print(f"Found {len(votes)} potential votes. Processing {limit}...")
        
        processed_count = 0
        for vote in votes:
            if processed_count >= limit:
                break
                
            print(f"\nProcessing Vote ID: {vote.id} | Date: {vote.date}")
            print(f"Original Title: {vote.title}")
            
            # Resolve Content
            bill_content = resolve_bill_content(session, vote, verbose)
            context_source = "BILL CONTENT" if bill_content and len(bill_content) > 500 else "DESCRIPTION/NONE"
            print(f"Context Source: {context_source} (Len: {len(bill_content) if bill_content else 0})")

            if dry_run:
                continue

            # Generate
            new_title = gemini_service.generate_simple_title(
                original_title=vote.title,
                description=vote.description or "",
                bill_content=bill_content or ""
            )
            
            print(f"Generated Title: \033[92m{new_title}\033[0m")
            
            vote.title_clean = new_title
            session.add(vote)
            processed_count += 1
            
            # Rate limiting safe guard
            time.sleep(1)

        session.commit()
        print(f"\nSaved {processed_count} titles.")

    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=5, help="Number of votes to process")
    parser.add_argument("--force", action="store_true", help="Reprocess existing titles")
    parser.add_argument("--verbose", action="store_true", help="Show debug info")
    parser.add_argument("--dry-run", action="store_true", help="Don't call API or save")

    args = parser.parse_args()
    process_titles(limit=args.limit, force=args.force, verbose=args.verbose, dry_run=args.dry_run)
