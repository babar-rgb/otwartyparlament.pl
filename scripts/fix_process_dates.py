import logging
import os
from dotenv import load_dotenv

# Load env before imports
load_dotenv("/Users/kajtek/sejm/git/parlament/.env")

from backend.core.orm_db import SessionLocal
from backend.models import LegislativeProcess, LegislativeStage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fix_dates")

def fix_process_dates():
    db = SessionLocal()
    try:
        logger.info("🚀 Starting Process Date Fixer...")
        
        # 1. Inspect Stats
        total = db.query(LegislativeProcess).count()
        missing = db.query(LegislativeProcess).filter(LegislativeProcess.start_date == None).count()
        
        logger.info(f"📊 Total Processes: {total}")
        logger.info(f"⚠️ Processes with start_date=None: {missing}")
        
        # 2. Inspect Sample
        samples = db.query(LegislativeProcess).limit(5).all()
        for s in samples:
            logger.info(f"   🔍 Sample {s.id[:8]}: Date={s.start_date} (Type: {type(s.start_date)}) Title={s.title[:30]}...")
            
        # 3. Find processes with missing start_date AND fix
        processes = db.query(LegislativeProcess).filter(LegislativeProcess.start_date == None).all()
        
        updated_count = 0
        
        for proc in processes:
            # Find earliest stage
            earliest_stage = db.query(LegislativeStage).filter(
                LegislativeStage.process_id == proc.id
            ).order_by(LegislativeStage.date).first()
            
            if earliest_stage and earliest_stage.date:
                proc.start_date = earliest_stage.date
                logger.info(f"   ✅ Process {proc.id[:8]}... updated start_date to {earliest_stage.date}")
                updated_count += 1
            else:
                 logger.warning(f"   ⚠️ Process {proc.id[:8]}... has no stages with dates!")
        
        db.commit()
        logger.info(f"🎉 Fixed {updated_count} processes.")
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_process_dates()
