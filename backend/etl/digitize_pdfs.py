import os
import sys
import requests
import subprocess
import tempfile
import time
import logging
from sqlalchemy.orm import Session
from sqlalchemy import text, func

# Add project root to python path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.core.orm_db import SessionLocal
from backend import models

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("etl.digitize")

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
        
        # logger.info(f"  ⬇️ Downloading {filename}...")
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
        # -layout preserves basic layout 
        # -f 1 -l 30 limits to first 30 pages (enough for most bills to get full context)
        result = subprocess.run(
            ["pdftotext", "-layout", "-f", "1", "-l", "40", pdf_path, "-"], 
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

def process_batch(limit=50):
    db = SessionLocal()
    try:
        # Check pdftotext
        try:
            subprocess.run(["pdftotext", "-v"], capture_output=True)
        except FileNotFoundError:
            logger.error("❌ pdftotext not found! Please install poppler-utils.")
            return

        # Find bills missing content
        query = db.query(models.Bill).filter(
            models.Bill.content == None,
            models.Bill.number != None
        )
        
        # Prioritize bills that have AI analysis but no content (weird state) OR just newest
        # Let's just do newest first to show immediate value on the site
        bills = query.order_by(models.Bill.date.desc()).limit(limit).all()
        
        count = len(bills)
        if count == 0:
            logger.info("✅ All bills have content!")
            return

        logger.info(f"🚀 Starting digitization for {count} bills...")
        
        success_count = 0
        for i, bill in enumerate(bills):
            # logger.info(f"[{i+1}/{count}] Processing Bill {bill.number}...")
            
            pdf_path, _ = download_pdf(bill.number)
            if not pdf_path:
                # Mark as empty string to avoid re-fetching constantly? 
                # Or just skip. For now skipping.
                print(f"[{i+1}/{count}] ⚠️ No PDF for {bill.number}", end='\r')
                continue

            try:
                text_content = extract_text_from_pdf(pdf_path)
                
                if text_content and len(text_content) > 100:
                    bill.content = text_content
                    db.add(bill)
                    db.commit()
                    success_count += 1
                    print(f"[{i+1}/{count}] ✅ Saved {len(text_content)} chars for {bill.number}", end='\r')
                else:
                    print(f"[{i+1}/{count}] ⚠️ Empty text for {bill.number}", end='\r')
                    
            finally:
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)
            
            # Tiny sleep to avoid hammering Sejm API too hard
            time.sleep(0.2)
            
        print(f"\n🏁 Batch complete. Updated {success_count}/{count} bills.")
        
    finally:
        db.close()

if __name__ == "__main__":
    # Get limit from args or default to 50
    limit = 50
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
        except ValueError:
            pass
            
    process_batch(limit)
