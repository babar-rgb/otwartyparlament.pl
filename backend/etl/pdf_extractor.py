import sys
import os
import requests
import subprocess
import tempfile
from sqlalchemy import text
import re

# Path setup
# Path setup not needed if imported as module in backend
try:
    from backend.core.orm_db import SessionLocal
except ImportError:
    # Fallback if running directly
    sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
    from backend.core.orm_db import SessionLocal

from backend.core.logger import get_logger
logger = get_logger("etl.pdf_extractor")

class PDFReplyExtractor:
    def run(self):
        """Run batch extraction of PDF replies."""
        logger.info("Starting PDF Reply Extraction...")
        batch_extract()

def clean_extracted_text(text_content):
    if not text_content:
        return ""
        
    # Remove header/footer noise often found in official documents
    lines = text_content.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        # Skip empty lines but preserve paragraph structure? 
        # Actually, pdftotext preserves layout somewhat.
        # Let's just fix weird whitespace.
        if not line:
            continue
            
        # Filter out common page headers/footers if detected (simple heuristics)
        if re.match(r'^Strona \d+ z \d+$', line): continue
        
        cleaned_lines.append(line)
        
    content = '\n'.join(cleaned_lines)
    
    # Capitalize paragraphs
    # (Reuse logic from previous fix)
    # ...
    
    return content


def extract_pdf_reply(interp_id):
    db = SessionLocal()
    try:
        logger.debug(f"Checking Interpellation {interp_id} for PDF attachments...")
        query = text("SELECT id, raw_data, reply_content FROM interpellations WHERE id = :id")
        row = db.execute(query, {"id": interp_id}).fetchone()
        
        if not row:
            return

        raw = row.raw_data
        if not raw or 'replies' not in raw:
            return

        replies = raw['replies']
        
        updated_content = ""
        processed_pdfs = 0
        
        for reply in replies:
            from_str = reply.get('from', 'Odpowiedź')
            
            # Look for attachments
            pdf_url = None
            if 'attachments' in reply:
                for att in reply['attachments']:
                    if att['name'].lower().endswith('.pdf'):
                        pdf_url = att['URL']
                        break
            
            if not pdf_url:
                continue
            
            logger.info(f"Found PDF for Interpellation {interp_id}: {pdf_url}")
            
            # Download PDF
            try:
                r = requests.get(pdf_url, timeout=30)
                if r.status_code != 200:
                    logger.error(f"Failed to download PDF {pdf_url}")
                    continue
                    
                with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tf:
                    tf.write(r.content)
                    temp_path = tf.name
                
                # Extract text using pdftotext
                try:
                    completion = subprocess.run(['pdftotext', '-layout', temp_path, '-'], capture_output=True, text=True)
                    raw_text = completion.stdout
                    
                    # If empty or extremely short, assume Scanned PDF and try OCR
                    if not raw_text or len(raw_text.strip()) < 50:
                        logger.info(f"PDF seems scanned (text len < 50). Attempting OCR for {pdf_url}...")
                        
                        # Convert to images
                        img_prefix = temp_path + "_img"
                        subprocess.run(['pdftoppm', '-png', '-r', '150', temp_path, img_prefix], check=True)
                        
                        # Find generated images
                        import glob
                        images = sorted(glob.glob(f"{img_prefix}-*.png"))
                        ocr_text = ""
                        
                        for img in images:
                            try:
                                # Run Tesseract
                                # Try Polish first
                                try:
                                    ocr_res = subprocess.run(['tesseract', img, 'stdout', '-l', 'pol'], capture_output=True, text=True, check=True)
                                    ocr_text += ocr_res.stdout + "\n"
                                except subprocess.CalledProcessError:
                                    # Fallback to default (usually English)
                                    logger.warning(f"Polish OCR failed for {img}, retrying with default/English...")
                                    ocr_res = subprocess.run(['tesseract', img, 'stdout'], capture_output=True, text=True, check=True)
                                    ocr_text += ocr_res.stdout + "\n"
                            finally:
                                os.remove(img)
                        
                        if ocr_text.strip():
                            raw_text = ocr_text
                            logger.info(f"OCR successful! Extracted {len(raw_text)} chars.")
                        else:
                            logger.warning(f"OCR also failed or file empty.")

                    if raw_text.strip():
                        cleaned = clean_extracted_text(raw_text)
                        
                        header = f"--- {from_str} (PDF) ---\n"
                        updated_content += f"{header}\n\n{cleaned}\n\n"
                        processed_pdfs += 1
                    else:
                        logger.warning(f"Extracted text was empty for {pdf_url}")
                        
                except Exception as e:
                    logger.error(f"Error running extraction: {e}")
                finally:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                    
            except Exception as e:
                logger.error(f"Error downloading PDF: {e}")

        if processed_pdfs > 0:
            # Update DB
            db.execute(
                text("UPDATE interpellations SET reply_content = :rc WHERE id = :id"),
                {"rc": updated_content, "id": interp_id}
            )
            db.commit()
            logger.info(f"✅ Interpellation {interp_id}: Updated with PDF content!")
        else:
            logger.debug(f"Interpellation {interp_id}: No content extracted.")

    except Exception as e:
        logger.error(f"Error processing {interp_id}: {e}")
    finally:
        db.close()

def batch_extract():
    """Find and process all pending PDF replies."""
    db = SessionLocal()
    try:
        logger.info("Searching for interpellations with PDF replies that need extraction...")
        # Heuristic: Find items with attachments in replies, AND (no content OR short content which implies just a link)
        query = text("""
            SELECT id 
            FROM interpellations 
            WHERE raw_data::text LIKE '%attachments%' 
            AND (reply_content IS NULL OR length(reply_content) < 500)
            ORDER BY id DESC
        """)
        results = db.execute(query).fetchall()
        
        total = len(results)
        logger.info(f"Found {total} candidates for PDF extraction.")
        
        if total == 0:
            return

        for i, row in enumerate(results):
            # Log progress every 10 items
            if i % 10 == 0:
                logger.info(f"Processing candidate {i+1}/{total} (ID: {row.id})...")
            extract_pdf_reply(row.id)
            
    except Exception as e:
        logger.error(f"Batch Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    PDFReplyExtractor().run()
