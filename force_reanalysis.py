
import sys
import os
from pathlib import Path
from sqlalchemy import text

# Add project root to path
sys.path.append(str(Path(__file__).resolve().parent))

from backend.core.orm_db import SessionLocal

def clear_analyses():
    session = SessionLocal()
    try:
        print("Clearing recent analyses to force re-generation with new 'Cynical' prompts...")
        # Delete analyses for last 100 bills to be safe
        sql = text("""
            DELETE FROM bill_analyses 
            WHERE bill_id IN (
                SELECT id FROM bills ORDER BY date DESC LIMIT 100
            );
        """)
        session.execute(sql)
        
        # Also reset the 'topic' on bills so they are picked up by ETL
        sql2 = text("""
            UPDATE bills 
            SET topic = NULL 
            WHERE id IN (
                SELECT id FROM bills ORDER BY date DESC LIMIT 100
            );
        """)
        session.execute(sql2)
        
        session.commit()
        print("✅ Successfully cleared recent analyses. Run the ETL now to re-process.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    clear_analyses()
