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
    # Find bills that don't have a topic assigned yet (or no analysis)
    bills = db.query(Bill).filter(Bill.topic.is_(None)).order_by(Bill.date.desc()).limit(batch_size).all()
    
    if not bills:
        logger.info("No bills to process.")
        return 0

    logger.info(f"Processing batch of {len(bills)} bills...")
    
    processed_count = 0
    for bill in bills:
        try:
            logger.info(f" -> Analyzing Bill {bill.number} ({bill.process_id}): {bill.title[:50]}...")
            
            # Context for the bill
            context_text = bill.description or ""
            # Fallback if description is too short
            if len(context_text) < 50:
                 context_text = bill.title

            analysis_data = ollama_service.analyze_legislative_text(bill.title, context_text)
            
            if analysis_data:
                # 1. Update Bill metadata (Topic/Importance)
                category = analysis_data.get("category", "Inne")
                bill.topic = category
                bill.importance = analysis_data.get("importance", 5)
                
                # 2. Save Analysis (Upsert)
                analysis = BillAnalysis(
                    bill_id=bill.id,
                    summary=analysis_data.get("summary"),
                    pros=analysis_data.get("pros", []),
                    cons=analysis_data.get("cons", []),
                    impact=analysis_data.get("impact"),
                    importance=bill.importance
                )
                db.merge(analysis)
                db.add(bill) 
                
                logger.info(f"   ✓ Success: {category}")
                processed_count += 1
                db.commit() 
            else:
                logger.warning(f"   ✗ Failed to get analysis for Bill {bill.id}")
                
        except Exception as e:
            logger.error(f"   ✗ Error processing Bill {bill.id}: {e}")
            db.rollback()
            
        time.sleep(0.5) # Small cooldown

    return processed_count

def main():
    logger.info("🚀 Starting Bill Analysis ETL (Ollama)...")
    db = SessionLocal()
    try:
        total = 0
        while True:
            # Small batches
            count = process_bills(db, batch_size=10)
            if count == 0:
                break
            total += count
            logger.info(f"Cumulative total: {total}")
            
            # if total >= 50:
            #     logger.info("🛑 Reached limit of 50 bills. Stopping.")
            #     break
            
        logger.info(f"✅ Bill processing complete. Total analyzed: {total}")
        
    except KeyboardInterrupt:
        logger.info("🛑 Interrupted by user. Exiting...")
    except Exception as e:
        logger.error(f"Fatal error in ETL: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
