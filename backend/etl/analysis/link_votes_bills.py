
import sys
import os
import re
import logging
from sqlalchemy import or_
from typing import Optional

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../'))

from backend.core.orm_db import SessionLocal
from backend.models import Vote, Bill
from backend.services.ollama import ollama_service

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger("etl.linking")

def extract_print_number(text: str) -> Optional[str]:
    """
    Extracts print number from vote title (e.g. 'druk nr 55').
    """
    if not text:
        return None
    
    # Common patterns: "druk nr 55", "druku nr 55", "druk 55"
    match = re.search(r"druk(?:u)?\s+nr\s+(\d+(?:-\w+)?)", text, re.IGNORECASE)
    if match:
        return match.group(1)
    
    match_short = re.search(r"druk\s+(\d+(?:-\w+)?)", text, re.IGNORECASE)
    if match_short:
        return match_short.group(1)
        
    return None

def link_votes_to_bills():
    session = SessionLocal()
    try:
        # 1. Fetch unlinked votes
        logger.info("🔍 Fetching unlinked votes...")
        votes = session.query(Vote).filter(Vote.bill_id.is_(None)).order_by(Vote.date.desc()).all()
        logger.info(f"Found {len(votes)} unlinked votes.")
        
        linked_count = 0
        ai_linked_count = 0
        
        for vote in votes:
            # A. Heuristic Linking (Regex)
            print_num = extract_print_number(vote.title_clean or vote.name_citizen)
            
            candidate_bill = None
            
            if print_num:
                # Try to find bill by number
                # Note: Bill.number matches print number
                candidate_bill = session.query(Bill).filter(Bill.number == print_num).first()
                
                if candidate_bill:
                    vote.bill_id = candidate_bill.id
                    vote.print_number = print_num
                    linked_count += 1
                    if linked_count % 100 == 0:
                        logger.info(f"🔗 Linked {linked_count} votes via Regex (Last: {print_num})")
                    continue # Success with regex, skip AI

            # B. AI / Semantic Linking (Fallback)
            # Only if heuristic failed and we have Ollama service
            # For massive batch, we might skip this or run it selectively.
            # Let's try to match by Similarity of Title if sitting matches?
            
            # Simple fallback: Match by Exact Title substring?
            # Or skip for now to keep it safe for nightly run.
            
        session.commit()
        logger.info(f"✅ Linking complete. Regex Linked: {linked_count}")
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    link_votes_to_bills()
