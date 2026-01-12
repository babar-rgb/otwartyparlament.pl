from sqlalchemy import text
from backend.core.orm_db import SessionLocal

def check():
    db = SessionLocal()
    query = text("""
        SELECT count(*)
        FROM interpellations 
        WHERE raw_data::text LIKE '%attachments%' 
        AND (reply_content IS NULL OR length(reply_content) < 500)
    """)
    count = db.execute(query).scalar()
    print(f"Query finds: {count} pending items.")
    db.close()

if __name__ == "__main__":
    check()
