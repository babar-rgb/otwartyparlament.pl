"""
Verify Architecture Consistency
Checks if ORM (API) and Core DB (ETL) point to the exact same database.
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.core.config import config
from backend.core.db import db as core_db
from backend.core.orm_db import SQLALCHEMY_DATABASE_URL

def verify_consistency():
    print("=== ARCHITECTURE CONSISTENCY CHECK ===")
    
    # 1. Check Config Logic
    print(f"\n[1] Configuration Check:")
    print(f"    Core Config DB: {config.DB_NAME} at {config.DB_HOST}")
    print(f"    ORM URL: {SQLALCHEMY_DATABASE_URL}")
    
    pg_url_expected = f"postgresql://{config.DB_USER}:{config.DB_PASSWORD}@{config.DB_HOST}:{config.DB_PORT}/{config.DB_NAME}"
    
    if SQLALCHEMY_DATABASE_URL == pg_url_expected:
        print("    ✅ ORM URL matches Core Config exactly.")
    else:
        print("    ❌ ORM URL mismatch!")
        print(f"       Expected: {pg_url_expected}")
        print(f"       Actual:   {SQLALCHEMY_DATABASE_URL}")
        return False

    # 2. Check ORM Connection
    print(f"\n[2] ORM Connection Check:")
    try:
        from backend.core.orm_db import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT current_database(), inet_server_addr()"))
            row = result.fetchone()
            print(f"    ✅ ORM Connected to: DB={row[0]}, IP={row[1]}")
    except Exception as e:
        print(f"    ❌ ORM Connection Failed: {e}")
        return False

    # 3. Check Core Connection
    print(f"\n[3] ETL Connection Check:")
    try:
        with core_db.get_cursor() as cur:
            cur.execute("SELECT current_database(), inet_server_addr()")
            row = cur.fetchone()
            print(f"    ✅ ETL Connected to: DB={row['current_database']}, IP={row['inet_server_addr']}")
    except Exception as e:
        print(f"    ❌ ETL Connection Failed: {e}")
        return False
        
    return True

if __name__ == "__main__":
    if verify_consistency():
        print("\n✨ SYSTEM IS CONSISTENT ✨")
    else:
        print("\n💥 SYSTEM IS INCONSISTENT 💥")
        sys.exit(1)
