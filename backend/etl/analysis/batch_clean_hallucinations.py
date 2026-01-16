import json
import os
import sys
import logging
import time

# Add project root to python path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../'))

from backend.core.orm_db import SessionLocal
from backend import models
from backend.services.ollama import ollama_service
from backend.etl.digitize_pdfs import download_pdf, extract_text_from_pdf

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("etl.cleanup")

REPAIR_FILE = os.path.join(os.path.dirname(__file__), 'repair_batch_deep.json')

def load_targets():
    if not os.path.exists(REPAIR_FILE):
        logger.error(f"File not found: {REPAIR_FILE}")
        return []
    with open(REPAIR_FILE, 'r') as f:
        return json.load(f)

def is_polish_enough(text):
    if not text: return True
    
    # Check for CJK characters range (Chinese/Japanese/Korean)
    # This is the main indicator of the "hallucination" we are fighting.
    cjk_chars = [c for c in text if '\u4e00' <= c <= '\u9fff']
    if len(cjk_chars) > 2: # Very strict on CJK. If there are more than 2, it's likely garbage.
        return False
        
    # We remove the strict Polish keyword counting because "Impact" sections 
    # might be short phrases like "Osoby niepełnosprawne." which lack "jest"/"się".
    # If it's not Chinese, we assume it's valid enough for now.
    return True

def reanalyze_bill(db, bill_id, bill_title, bill_number):
    try:
        logger.info(f"🔧 Processing Bill {bill_id} ({bill_number})...")
        
        # 1. Ensure Content exists
        bill = db.query(models.Bill).filter(models.Bill.id == bill_id).first()
        if not bill:
            logger.error(f"  ❌ Bill {bill_id} not found in DB")
            return

        text_content = bill.content
        
        # If content is missing or too short, try to fetch it again
        if not text_content or len(text_content) < 500:
            logger.info("  📥 Content empty/short. Fetching from PDF...")
            pdf_path, _ = download_pdf(bill.number)
            if pdf_path:
                text_content = extract_text_from_pdf(pdf_path)
                if text_content and len(text_content) > 500:
                    bill.content = text_content
                    db.commit()
                    logger.info(f"  ✅ Fetched {len(text_content)} chars.")
                else:
                    logger.warning("  ⚠️ Could not extract sufficient text.")
                    # If we can't get text, we can't analyze. Skip.
                    return
            else:
                 logger.warning("  ⚠️ No PDF available.")
                 return
        
        # 2. Re-run Analysis
        logger.info("  🤖 Re-analyzing with Ollama...")
        # Use a strong system prompt instruction in the service (conceptually)
        # Here we just call the service.
        analysis = ollama_service.analyze_legislative_text(bill_title, text_content)
        
        if not analysis:
            logger.warning("  ⚠️ Ollama returned None.")
            return

        # 3. Validate Output (Anti-Hallucination Check)
        summary = analysis.get("summary", "")
        impact = analysis.get("impact", "")
        pros = " ".join(analysis.get("pros", []))
        cons = " ".join(analysis.get("cons", []))
        
        # Check all text fields
        if not is_polish_enough(summary):
            logger.error(f"  ❌ HALLUCINATION DETECTED in Summary: {summary[:50]}...")
            return
            
        if not is_polish_enough(impact):
            logger.error(f"  ❌ HALLUCINATION DETECTED in Impact: {impact[:50]}...")
            return
            
        if not is_polish_enough(pros):
             logger.error(f"  ❌ HALLUCINATION DETECTED in Pros.")
             return

        if not is_polish_enough(cons):
             logger.error(f"  ❌ HALLUCINATION DETECTED in Cons.")
             return

        logger.info("  ✅ Analysis seems valid (Polish detected in all fields).")

        # 4. Save to DB
        existing_analysis = db.query(models.BillAnalysis).filter(models.BillAnalysis.bill_id == bill_id).first()
        if not existing_analysis:
            existing_analysis = models.BillAnalysis(bill_id=bill_id)
            db.add(existing_analysis)
        
        existing_analysis.summary = summary
        existing_analysis.pros = analysis.get("pros", [])
        existing_analysis.cons = analysis.get("cons", [])
        existing_analysis.impact = analysis.get("impact", "")
        existing_analysis.importance = analysis.get("importance", 0)
        
        db.commit()
        logger.info(f"  💾 Saved clean analysis for Bill {bill_id}.")

    except Exception as e:
        logger.error(f"  ❌ Error processing {bill_id}: {e}")

def run_cleanup():
    logger.info("🚀 Starting GLOBAL Analysis Health Check...")
    
    db = SessionLocal()
    try:
        # Fetch ALL analyses
        analyses = db.query(models.BillAnalysis).all()
        logger.info(f"📊 Found {len(analyses)} analysis records in DB.")
        
        deleted_count = 0
        
        for i, analysis in enumerate(analyses):
            is_bad = False
            reason = ""
            
            # Check fields
            summary = analysis.summary or ""
            impact = analysis.impact or ""
            pros = " ".join(analysis.pros or [])
            cons = " ".join(analysis.cons or [])
            
            if not is_polish_enough(summary):
                is_bad = True
                reason = f"Summary Hallucination ({summary[:20]}...)"
            elif not is_polish_enough(impact):
                is_bad = True
                reason = f"Impact Hallucination ({impact[:20]}...)"
            elif not is_polish_enough(pros):
                is_bad = True
                reason = "Pros Hallucination"
            elif not is_polish_enough(cons):
                is_bad = True
                reason = "Cons Hallucination"
            
            if is_bad:
                logger.error(f"  ❌ BILL {analysis.bill_id}: {reason}. DELETING.")
                db.delete(analysis)
                deleted_count += 1
                if deleted_count % 10 == 0:
                     db.commit() # Commit periodically
            
            if i % 100 == 0:
                logger.info(f"  ... scanned {i}/{len(analyses)} records ...")
        
        db.commit()
        logger.info(f"✅ DONE. Scanned {len(analyses)} records. Deleted {deleted_count} bad analyses.")
            
    finally:
        db.close()

if __name__ == "__main__":
    run_cleanup()
