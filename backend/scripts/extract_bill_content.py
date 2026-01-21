import sys
import os
import requests
import subprocess
import tempfile
import re
import time
import random
from bs4 import BeautifulSoup

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.orm_db import SessionLocal
from backend.models import Bill

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
]

def clean_text(text):
    if not text: return ""
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_content(limit=100):
    session = SessionLocal()
    try:
        # Priority: Term 10 bills without content
        # We assume they are Druki and use the API
        pending_bills = session.query(Bill).filter(
            (Bill.content == None) | (Bill.content == "")
        ).limit(limit).all()
        
        print(f"Found {len(pending_bills)} bills to process (limit: {limit}).")
        
        success_count = 0
        for bill in pending_bills:
            print(f"--- Processing Bill {bill.number} ---")
            
            # 1. Try Sejm API directly (Term 10)
            # URL Pattern: https://api.sejm.gov.pl/sejm/term10/prints/{number}/{number}.pdf
            api_pdf_url = f"https://api.sejm.gov.pl/sejm/term10/prints/{bill.number}/{bill.number}.pdf"
            
            headers = {"User-Agent": random.choice(USER_AGENTS)}
            r = None
            extracted_text = ""
            
            print(f"   Trying API PDF: {api_pdf_url}")
            try:
                r = requests.get(api_pdf_url, headers=headers, timeout=20)
                if r.status_code == 200 and 'pdf' in r.headers.get('Content-Type', '').lower():
                    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tf:
                        tf.write(r.content)
                        temp_path = tf.name
                    try:
                        res = subprocess.run(['pdftotext', '-layout', temp_path, '-'], capture_output=True, text=True)
                        extracted_text = res.stdout
                        print("   ✅ API PDF success.")
                    finally:
                        if os.path.exists(temp_path): os.remove(temp_path)
            except Exception as e:
                print(f"   API target failed: {e}")

            # 2. Fallback to existing URL (Portal scraper)
            if not extracted_text and bill.url:
                print(f"   Falling back to portal URL: {bill.url}")
                try:
                    r = requests.get(bill.url, headers=headers, timeout=20)
                    if r.status_code == 200:
                        content_type = r.headers.get('Content-Type', '').lower()
                        if 'pdf' in content_type:
                             with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tf:
                                tf.write(r.content)
                                temp_path = tf.name
                             try:
                                res = subprocess.run(['pdftotext', '-layout', temp_path, '-'], capture_output=True, text=True)
                                extracted_text = res.stdout
                             finally:
                                if os.path.exists(temp_path): os.remove(temp_path)
                        else:
                            soup = BeautifulSoup(r.text, 'html.parser')
                            main_body = soup.find('body')
                            extracted_text = main_body.get_text() if main_body else soup.get_text()
                except Exception as e:
                    print(f"   Portal fallback failed: {e}")

            if extracted_text and len(extracted_text.strip()) > 100:
                bill.content = clean_text(extracted_text)
                success_count += 1
                print(f"   ✅ Saved {len(bill.content)} characters.")
            else:
                print("   ❌ Failed to extract meaningful content.")
            
            time.sleep(random.uniform(0.5, 1.5))

            if success_count % 5 == 0:
                session.commit()

        session.commit()
        print(f"Finished! Successfully extracted content for {success_count} bills.")

    except Exception as e:
        print(f"Global Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=100)
    args = parser.parse_args()
    extract_content(limit=args.limit)
