import sys
import os
import time
from pathlib import Path
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent.parent))

from backend.core.orm_db import SessionLocal
from backend.models import Bill, BillAnalysis
from backend.services.ollama import ollama_service
from backend.core.logger import get_logger

logger = get_logger("etl.process_bills_ollama")

def process_bills(db: Session, batch_size: int = 50):
    """
    Finds bills without analysis and processes them with Ollama.
    """
    # Find bills that don't have analysis yet
    bills = db.query(Bill).filter(~Bill.analysis.has()).limit(batch_size).all()
    
    if not bills:
        logger.info("No bills to process.")
        return 0

    logger.info(f"Processing batch of {len(bills)} bills...")
    
    processed_count = 0
    for bill in bills:
        try:
            logger.info(f" -> Analyzing Bill {bill.number}: {bill.title[:50]}...")
            
            # Prepare text for analysis (title + description)
            full_text = f"{bill.title}\n\nUzasadnienie:\n{bill.description or ''}"
            
            analysis_data = ollama_service.analyze_legislative_text(bill.title, full_text)
            
            if analysis_data:
                # Save to BillAnalysis
                analysis = BillAnalysis(
                    bill_id=bill.id,
                    summary=analysis_data.get("summary"),
                    pros=analysis_data.get("pros", []),
                    cons=analysis_data.get("cons", []),
                    impact=analysis_data.get("impact"),
                    importance=analysis_data.get("importance", 0)
                )
                db.add(analysis)
                
                # Optional: update bill importance for sorting
                # bill.importance = analysis_data.get("importance", 0) 
                
                logger.info(f"   ✓ Success (Importance: {analysis.importance})")
                processed_count += 1
                db.commit() # Commit each to save progress if interrupted
            else:
                logger.warning(f"   ✗ Failed to get analysis for Bill {bill.id}")
                
        except Exception as e:
            logger.error(f"   ✗ Error processing Bill {bill.id}: {e}")
            db.rollback()
            
        time.sleep(1) # Small cooldown for local GPU/CPU

    return processed_count

def main():
    logger.info("🚀 Starting Nightly Bill Analysis ETL (Ollama)...")
    db = SessionLocal()
    try:
        total = 0
        while True:
            count = process_bills(db, batch_size=10)
            if count == 0:
                break
            total += count
            logger.info(f"Cumulative total: {total}")
            
        logger.info(f"✅ Nightly processing complete. Total analyzed: {total}")
        
    except KeyboardInterrupt:
        logger.info("🛑 Interrupted by user. Exiting and saving progress...")
    except Exception as e:
        logger.error(f"Fatal error in ETL: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
