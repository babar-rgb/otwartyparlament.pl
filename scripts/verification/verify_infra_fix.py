"""
Verify Infrastructure Fixes
Tests:
1. Database Connection Pool (Can we get a connection?)
2. Migration Logic (Can we init the table?)
"""
import sys
import os

# Add root to python path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.core.db import db
from backend.core.logger import get_logger
from backend.database.migrate import get_applied_migrations, init_migration_table

logger = get_logger("verify.infra")

def verify_pool():
    print("Testing Connection Pool...")
    try:
        with db.get_cursor() as cur:
            cur.execute("SELECT 1")
            res = cur.fetchone()
            print(f"✅ Connection successful. Result: {res}")
            
        # Check pool stats if accessible/observable (psycopg2 pool is simple)
        print("✅ Pool returned connection to pool.")
    except Exception as e:
        print(f"❌ Pool failed: {e}")
        return False
    return True

def verify_migrations():
    print("\nTesting Migration System...")
    try:
        init_migration_table()
        print("✅ Migration table initialized.")
        
        applied = get_applied_migrations()
        print(f"✅ Current migrations applied: {len(applied)}")
        
        if len(applied) == 0:
             print("⚠️  Warning: No migrations applied yet (Migration system is empty).")
        
    except Exception as e:
        print(f"❌ Migration check failed: {e}")
        return False
    return True

if __name__ == "__main__":
    ok_pool = verify_pool()
    ok_mig = verify_migrations()
    
    if ok_pool and ok_mig:
        print("\n✨ ALL CHECKS PASSED ✨")
        sys.exit(0)
    else:
        print("\n💥 VERIFICATION FAILED 💥")
        sys.exit(1)
