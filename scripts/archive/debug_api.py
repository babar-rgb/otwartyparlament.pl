import logging
import json
from dotenv import load_dotenv
from datetime import date

# Load env
load_dotenv("/Users/kajtek/sejm/git/parlament/.env")

from backend.core.orm_db import SessionLocal
from backend.models import LegislativeProcess

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("debug_api")

def debug_api_response():
    db = SessionLocal()
    try:
        # 1. Check Process "43" (from users screenshot URL... wait, 43? IDs are UUIDs usually)
        # Maybe frontend is using shortened ID or something? Or maybe it is an ID.
        # Let's list all processes to see what ID "43" could match.
        
        logger.info("Listing all processes IDs to find '43'...")
        all_procs = db.query(LegislativeProcess).limit(10).all()
        for p in all_procs:
            logger.info(f"ID: {p.id} | Title: {p.title[:20]}")
            
        # 2. Simulate API logic for LIST
        logger.info("\n--- Simulate LIST /processes ---")
        items = db.query(LegislativeProcess).limit(1).all()
        for p in items:
            stages_count = len(p.stages) 
            last_stage = p.stages[-1] if p.stages else None
            
            resp = {
                "id": p.id,
                "title": p.title,
                "status": p.status,
                "start_date": p.start_date.isoformat() if p.start_date else None,
                "stage_count": stages_count,
                 # Just testing start_date mostly
            }
            logger.info(f"List Item: {json.dumps(resp, indent=2)}")

        # 3. Simulate DETAILS for a valid ID
        if items:
            target_id = items[0].id
            logger.info(f"\n--- Simulate DETAILS /processes/{target_id} ---")
            process = db.query(LegislativeProcess).filter(LegislativeProcess.id == target_id).first()
            
            # Serialize stages
            stages_serialized = []
            if process.stages:
                for s in process.stages:
                    stages_serialized.append({
                        "id": s.id,
                        "title": s.title,
                        "date": s.date.isoformat() if s.date else None
                    })
            
            resp_detail = {
                "id": process.id,
                "start_date": process.start_date.isoformat() if process.start_date else None,
                "stages": stages_serialized
            }
            logger.info(f"Detail Resp: {json.dumps(resp_detail, indent=2)}")

    finally:
        db.close()

if __name__ == "__main__":
    debug_api_response()
