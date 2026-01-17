from sqlalchemy import text
from backend.core.orm_db import SessionLocal

def check_fts():
    db = SessionLocal()
    try:
        print("Checking available Text Search Configurations...")
        result = db.execute(text("SELECT cfgname FROM pg_ts_config;")).fetchall()
        configs = [r[0] for r in result]
        
        print(f"Found {len(configs)} configurations.")
        if 'polish' in configs:
            print("SUCCESS: 'polish' configuration is available!")
        else:
            print("WARNING: 'polish' configuration is MISSING. Available: " + ", ".join(configs))
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_fts()
