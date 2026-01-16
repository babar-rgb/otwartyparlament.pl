import sys
import os
import time
import logging

# Setup path
sys.path.append(os.getcwd())

from backend.core.orm_db import SessionLocal
from backend import models
from backend.services.ollama import ollama_service
from backend.etl.digitize_pdfs import download_pdf, extract_text_from_pdf
from sqlalchemy import text

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("etl.fill_missing")

def is_polish_enough(text):
    if not text: return True
    # Check for CJK characters range (Chinese/Japanese/Korean)
    cjk_chars = [c for c in text if '\u4e00' <= c <= '\u9fff']
    if len(cjk_chars) > 2: 
        return False
    return True

def run_fill():
    logger.info("🚀 Starting Background Analysis Filler...")
    
    db = SessionLocal()
    try:
        # Find bills that have NO analysis
        # Method 1: Get all IDs with analysis
        existing_ids = [r[0] for r in db.query(models.BillAnalysis.bill_id).all()]
        existing_set = set(existing_ids)
        
        # Get all bills
        all_bills = db.query(models.Bill).all()
        
        candidates = [b for b in all_bills if b.id not in existing_set]
        # Sort by ID descending (newest first)
        candidates.sort(key=lambda x: x.id, reverse=True)
        
        logger.info(f"📊 Found {len(candidates)} bills missing analysis. Processing newest first.")
        
        processed = 0
        
        for bill in candidates:
            try:
                logger.info(f"👉 Processing Bill {bill.id} ({bill.number})...")
                
                # 1. Ensure Content
                text_content = bill.content
                if not text_content or len(text_content) < 500:
                    logger.info("   📥 Fetching PDF content...")
                    pdf_path, _ = download_pdf(bill.number)
                    if pdf_path:
                        text_content = extract_text_from_pdf(pdf_path)
                        if text_content and len(text_content) > 500:
                            bill.content = text_content
                            db.commit()
                        else:
                            logger.warning("   ⚠️ Text extraction failed or too short.")
                    else:
                        logger.warning("   ⚠️ PDF download failed.")
                
                if not text_content or len(text_content) < 500:
                    logger.warning("   ⏭️  Skipping due to lack of content.")
                    continue

                # 2. Analyze
                logger.info("   🤖 Generating Analysis with Ollama...")
                analysis = ollama_service.analyze_legislative_text(bill.title, text_content)
                
                if analysis:
                    # VALIDATION
                    summary = analysis.get("summary", "")
                    impact = analysis.get("impact", "")
                    pros = " ".join(analysis.get("pros", []))
                    cons = " ".join(analysis.get("cons", []))
                    
                    if not (is_polish_enough(summary) and is_polish_enough(impact) and is_polish_enough(pros) and is_polish_enough(cons)):
                        logger.error(f"   ❌ HALLUCINATION DETECTED (Chinese characters)! Skipping save for Bill {bill.id}.")
                        continue

                    # Save
                    new_analysis = models.BillAnalysis(
                        bill_id=bill.id,
                        summary=analysis.get("summary", ""),
                        pros=analysis.get("pros", []),
                        cons=analysis.get("cons", []),
                        impact=analysis.get("impact", ""),
                        importance=analysis.get("importance", 0)
                    )
                    db.add(new_analysis)
                    db.commit()
                    processed += 1
                    logger.info("   ✅ Saved.")
                else:
                    logger.error("   ❌ Analysis failed.")
                
                # Sleep to be nice to Ollama
                time.sleep(1) 

            except Exception as e:
                logger.error(f"   ❌ Error processing bill {bill.id}: {e}")
                db.rollback()

        logger.info(f"🏁 Finished. Generated {processed} analyses.")
        
    finally:
        db.close()

if __name__ == "__main__":
    run_fill()
