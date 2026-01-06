import sys
import os
import time
from pathlib import Path
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent.parent))

from backend.core.orm_db import SessionLocal
from backend.models import Vote, VoteAnalysis, Bill
from backend.services.ollama import ollama_service
from backend.core.logger import get_logger

import re

logger = get_logger("etl.process_votes_ollama")

def extract_print_number(title):
    """
    Extracts print number (druk nr ...) from vote title.
    """
    if not title:
        return None
    match = re.search(r'druki? nr (\d+)', title, re.IGNORECASE)
    if match:
        return match.group(1)
    return None

def process_votes(db: Session, batch_size: int = 50):
    """
    Finds votes without analysis and processes them with Ollama.
    """
    # Find votes that don't have analysis yet
    votes = db.query(Vote).filter(~Vote.analysis.has()).order_by(Vote.date.desc()).limit(batch_size).all()
    
    if not votes:
        logger.info("No votes to process.")
        return 0

    logger.info(f"Processing batch of {len(votes)} votes...")
    
    processed_count = 0
    for vote in votes:
        try:
            logger.info(f" -> Analyzing Vote {vote.id}: {vote.title_clean[:50]}...")
            
            # Context for the vote
            title = vote.title_clean or vote.title_raw
            context = f"Tytuł: {title}\nOpis: {vote.description or ''}"
            
            # Try to find print number in title
            print_nr = extract_print_number(title)
            if print_nr:
                bill = db.query(Bill).filter(Bill.number == print_nr).first()
                if bill:
                    context += f"\n\nPowiązany Projekt Ustawy (Druk {print_nr}): {bill.title}\nUzasadnienie projektu: {bill.description or ''}"
                    logger.info(f"   + Found linked bill: Druk {print_nr}")

            analysis_data = ollama_service.analyze_vote(title, context)
            
            if analysis_data:
                # Save to VoteAnalysis
                analysis = VoteAnalysis(
                    vote_id=vote.id,
                    summary=analysis_data.get("summary"),
                    pros=analysis_data.get("pros", []),
                    cons=analysis_data.get("cons", []),
                    mind_map=analysis_data.get("mind_map") # Optional, if AI provides it
                )
                db.add(analysis)
                
                logger.info(f"   ✓ Success")
                processed_count += 1
                db.commit() 
            else:
                logger.warning(f"   ✗ Failed to get analysis for Vote {vote.id}")
                
        except Exception as e:
            logger.error(f"   ✗ Error processing Vote {vote.id}: {e}")
            db.rollback()
            
        time.sleep(0.5) # Small cooldown

    return processed_count

def main():
    logger.info("🚀 Starting Vote Analysis ETL (Ollama)...")
    db = SessionLocal()
    try:
        total = 0
        while True:
            count = process_votes(db, batch_size=10)
            if count == 0:
                break
            total += count
            logger.info(f"Cumulative total: {total}")
            
        logger.info(f"✅ Vote processing complete. Total analyzed: {total}")
        
    except KeyboardInterrupt:
        logger.info("🛑 Interrupted by user. Exiting...")
    except Exception as e:
        logger.error(f"Fatal error in ETL: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
