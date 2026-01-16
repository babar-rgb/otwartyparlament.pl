import logging
import time
import json
from dotenv import load_dotenv

load_dotenv("/Users/kajtek/sejm/git/parlament/.env")

import os
import google.generativeai as genai
from backend.core.orm_db import SessionLocal
from backend.models import Bill, BillAnalysis, LegislativeProcess, LegislativeStage
from backend.services.gemini import GeminiService
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backfill_projects")

key = os.getenv("GEMINI_API_KEY")
if key:
    genai.configure(api_key=key)
else:
    logger.error("❌ API Key NOT found!")

def backfill_projects(limit=50):
    db = SessionLocal()
    gemini = GeminiService()
    
    try:
        logger.info(f"🚀 Starting Project Analysis Backfill (Limit: {limit})")
        
        # Find Bills WITHOUT Analysis
        # Left Outer Join with BillAnalysis
        bills = db.query(Bill).outerjoin(BillAnalysis).filter(
            BillAnalysis.bill_id == None,
            # Bill.term == 10 # REMOVED: Bill model does not have 'term' column. Assuming all Bills in DB are relevant.
        ).limit(limit).all()
        
        logger.info(f"🎯 Found {len(bills)} sleeping projects to process.")
        
        for bill in bills:
            logger.info(f"⚙️ Processing Bill {bill.number}: {bill.title[:40]}...")
            
            # 1. Analyze with Gemini (doc_type='bill')
            analysis_json = gemini.analyze_expert(
                title=bill.title,
                description=bill.description or "",
                bill_text=bill.content[:50000] if bill.content else None,
                doc_type="bill"
            )
            
            if analysis_json:
                # 2. Save Analysis
                ba = BillAnalysis(
                    bill_id=bill.id,
                    summary=analysis_json.get("summary"),
                    pros=analysis_json.get("pros"),
                    cons=analysis_json.get("cons"),
                    importance=analysis_json.get("importance_score") or 0,
                    impact=json.dumps(analysis_json.get("personas"), ensure_ascii=False)
                )
                db.add(ba)
                
                # 3. Create/Link Legislative Process (The "Sleeping" Process)
                # Check if stage exists
                existing_stage = db.query(LegislativeStage).filter_by(bill_number=bill.number).first()
                if existing_stage and existing_stage.process_id:
                     logger.info(f"   🔗 Already linked to Process {existing_stage.process_id}")
                else:
                    # New Process for this Bill
                    process_id = str(uuid.uuid4())
                    new_process = LegislativeProcess(
                        id=process_id,
                        title=bill.title[:150],
                        status="SUBMITTED",
                        start_date=bill.date
                    )
                    db.add(new_process)
                    
                    # New Stage
                    new_stage = LegislativeStage(
                        id=str(uuid.uuid4()),
                        process_id=process_id,
                        stage_type="SUBMISSION",
                        title=f"Wpłynięcie projektu (Druk {bill.number})",
                        description=bill.title[:200],
                        date=bill.date,
                        bill_number=bill.number
                    )
                    db.add(new_stage)
                    logger.info(f"   🆕 Created Sleeping Process: {process_id}")

                db.commit()
                logger.info("   ✅ Saved.")
                time.sleep(4)
            else:
                logger.error("   ❌ Gemini failed.")

    except Exception as e:
        logger.error(f"Critical: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    backfill_projects()
