from backend.etl.pdf_extractor import batch_extract, extract_pdf_reply
from sqlalchemy import text
from backend.core.orm_db import SessionLocal
from backend.core.logger import get_logger

logger = get_logger("backfill_sample")

def run_sample():
    db = SessionLocal()
    # Get 5 missing ones
    query = text("""
        SELECT id 
        FROM interpellations 
        WHERE raw_data::text LIKE '%attachments%' 
        AND (reply_content IS NULL OR length(reply_content) < 10)
        LIMIT 5
    """)
    rows = db.execute(query).fetchall()
    db.close()
    
    print(f"Attempting to backfill {len(rows)} samples...")
    for r in rows:
        print(f"Processing {r.id}...")
        extract_pdf_reply(r.id)

if __name__ == "__main__":
    run_sample()
