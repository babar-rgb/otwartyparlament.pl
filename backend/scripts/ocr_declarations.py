
import sys
import os
import requests
import subprocess
import tempfile
import time
import random
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.core.orm_db import SessionLocal
from backend.models import AssetDeclaration

def clean_text(text):
    if not text: return ""
    import re
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def run_ocr(limit=100):
    session = SessionLocal()
    try:
        # Find declarations that have a PDF url but (likely) just JSON in parsed_content or are empty
        # We'll assume if it starts with '{', it's raw metadata, not OCR text. 
        # Or just check length/content.
        # For safety, let's target rows where parsed_content IS NULL or starts with '{' (JSON)
        
        sql = text("""
            SELECT id, pdf_url FROM asset_declarations 
            WHERE pdf_url IS NOT NULL 
            AND (parsed_content IS NULL OR CAST(parsed_content AS TEXT) LIKE '{%')
            LIMIT :limit
        """)
        
        rows = session.execute(sql, {"limit": limit}).fetchall()
        print(f"Found {len(rows)} declarations to OCR.")
        
        for row in rows:
            decl_id = row[0]
            pdf_url = row[1]
            
            print(f"Processing ID {decl_id}: {pdf_url}")
            
            try:
                # Rotate UA to avoid 403
                headers = {
                    "User-Agent": random.choice([
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
                    ])
                }
                r = requests.get(pdf_url, headers=headers, timeout=30)
                if r.status_code == 200:
                    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tf:
                        tf.write(r.content)
                        temp_path = tf.name
                        
                    try:
                        # pdftotext -layout input output
                        res = subprocess.run(['pdftotext', '-layout', temp_path, '-'], capture_output=True, text=True)
                        extracted_text = res.stdout
                        
                        if len(extracted_text) > 100:
                            cleaned = clean_text(extracted_text)
                            # Update DB
                            session.execute(
                                text("UPDATE asset_declarations SET parsed_content = :c WHERE id = :id"),
                                {"c": cleaned, "id": decl_id}
                            )
                            session.commit()
                            print(f"   ✅ OCR Success ({len(cleaned)} chars)")
                        else:
                            print("   ⚠️ Content too short (Scanned image?)")
                            
                    finally:
                        if os.path.exists(temp_path): os.remove(temp_path)
                        
                else:
                    print(f"   ❌ Network error: {r.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Error: {e}")
                
            time.sleep(1)
            
    finally:
        session.close()

if __name__ == "__main__":
    import sys
    limit = 50
    if len(sys.argv) > 1:
        limit = int(sys.argv[1])
    run_ocr(limit)
