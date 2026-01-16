import logging
import sys
from dotenv import load_dotenv

load_dotenv("/Users/kajtek/sejm/git/parlament/.env")

from backend.core.orm_db import SessionLocal
from backend.models import LegislativeProcess, LegislativeStage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("debug_43")

def inspect_process():
    db = SessionLocal()
    try:
        # Check specific UUID found earlier
        target_id = "d54b20c4-95f5-48a0-8405-c34b08455207"
        logger.info(f"🔍 Inspecting Target ID: {target_id}")
        
        proc = db.query(LegislativeProcess).filter(LegislativeProcess.id == target_id).first()
        
        if proc:
            logger.info(f"✅ FOUND Process {target_id}")
            logger.info(f"   Title: {proc.title}")
            logger.info(f"   Date: {proc.start_date}")
            
            stages = proc.stages
            logger.info(f"   Stages Count: {len(stages)}")
            
            for s in stages:
                logger.info(f"      - Stage: {s.title} (Date: {s.date})")
                
            if len(stages) == 0:
                logger.warning("   ⚠️ Process exists but has 0 stages!")
        else:
            logger.error(f"❌ Target Process {target_id} NOT found!")
            
        # Check for ID "43" one last time with exact string match
        proc_43 = db.query(LegislativeProcess).filter(LegislativeProcess.id == "43").first()
        if proc_43:
             logger.info("Wait, ID '43' found now!")

                
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_process()
