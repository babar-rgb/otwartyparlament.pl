
import os
import sys
import requests
import subprocess
import tempfile
import time
import logging
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add project root to python path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../'))

from backend.core.orm_db import SessionLocal
from backend import models
from backend.services.ollama import ollama_service

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("etl.bills_content")

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

def download_pdf(print_number):
    """
    Downloads the first PDF attachment for a given print number.
    Returns: (pdf_path, pdf_url) or (None, None)
    """
    if not print_number:
        return None, None
        
    meta_url = f"{SEJM_API_URL}/prints/{print_number}"
    try:
        resp = requests.get(meta_url, timeout=10)
        if resp.status_code != 200:
            logger.warning(f"  ⚠️ Meta fetch failed: {resp.status_code}")
            return None, None
            
        data = resp.json()
        attachments = data.get("attachments", [])
        if not attachments:
            logger.warning("  ⚠️ No attachments found.")
            return None, None
            
        filename = attachments[0]
        pdf_url = f"{SEJM_API_URL}/prints/{print_number}/{filename}"
        
        logger.info(f"  ⬇️ Downloading {filename}...")
        pdf_resp = requests.get(pdf_url, stream=True, timeout=30)
        
        if pdf_resp.status_code == 200:
            fd, tmp_path = tempfile.mkstemp(suffix=f"_sejm_{print_number}.pdf")
            os.close(fd)
            
            with open(tmp_path, 'wb') as f:
                for chunk in pdf_resp.iter_content(chunk_size=8192):
                    f.write(chunk)
            return tmp_path, pdf_url
            
        return None, None
        
    except Exception as e:
        logger.error(f"  ❌ Download error: {e}")
        return None, None

def extract_text_from_pdf(pdf_path):
    """
    Extracts text from PDF using pdftotext (must be installed system-wide).
    """
    try:
        # -layout preserves basic layout which is sometimes helpful, but raw text is fine too.
        # -f 1 -l 10 limits to first 10 pages to save time/tokens if documents are huge.
        result = subprocess.run(
            ["pdftotext", "-layout", "-f", "1", "-l", "15", pdf_path, "-"], 
            capture_output=True, 
            text=True
        )
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            logger.error(f"  ❌ pdftotext failed: {result.stderr}")
            return None
    except Exception as e:
        logger.error(f"  ❌ pdftotext execution error: {e}")
        return None

def process_single_bill(db: Session, bill: models.Bill):
    logger.info(f"📄 Processing Bill ID: {bill.id} (Print: {bill.number})")
    
    # 1. Download content
    pdf_path, pdf_url = download_pdf(bill.number)
    
    if not pdf_path:
        logger.warning(f"  ⚠️ Skipping {bill.id}: No PDF content.")
        return False
        
    try:
        # 2. Extract Text
        logger.info("  📝 Extracting text...")
        text_content = extract_text_from_pdf(pdf_path)
        
        if not text_content or len(text_content) < 100:
            logger.warning("  ⚠️ Extracted text too short or empty.")
            return False
            
        logger.info(f"  ✅ Extracted {len(text_content)} chars.")
        
        # Save raw content to Bill
        bill.content = text_content
        db.add(bill)
        db.commit() # Commit content immediately
        
        # 3. Analyze with AI
        logger.info("  🤖 Analyzing with Ollama...")
        analysis = ollama_service.analyze_legislative_text(bill.title, text_content)
        
        if analysis:
            # 4. Save
            bill_analysis = models.BillAnalysis(
                bill_id=bill.id,
                summary=analysis.get("summary"),
                pros=analysis.get("pros", []),
                cons=analysis.get("cons", []),
                impact=analysis.get("impact"),
                importance=analysis.get("importance", 0)
            )
            
            # Use merge to upsert
            db.merge(bill_analysis)
            db.commit()
            logger.info("  💾 Saved Analysis.")
            return True
        else:
            logger.warning(f"  ⚠️ AI returned no result for Bill {bill.id}. Content saved, analysis skipped.")
            return False
            
    finally:
        # Cleanup
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

def run_pipeline(limit=10, force=False):
    db = SessionLocal()
    try:
        # Verify pdftotext exists
        try:
            subprocess.run(["pdftotext", "-v"], capture_output=True)
        except FileNotFoundError:
            logger.error("❌ pdftotext not found! Please install poppler-utils.")
            return

        # Find bills missing content (backfill + new)
        query = db.query(models.Bill).filter(
            models.Bill.content == None,
            models.Bill.number != None
        )
        
        # Prioritize newer bills
        bills = query.order_by(models.Bill.date.desc()).limit(limit).all()
        
        logger.info(f"found {len(bills)} bills pending analysis.")
        
        processed_count = 0
        for bill in bills:
            if process_single_bill(db, bill):
                processed_count += 1
            # Rate limit/Sleep to be nice to local AI
            time.sleep(1)
            
        logger.info(f"🏁 Finished. Processed {processed_count} bills.")
        
    finally:
        db.close()

if __name__ == "__main__":
    run_pipeline(limit=20)
