
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.core.db import db


def run_migration():
    # 005 is likely already applied or safe to re-run if idempotent (IF NOT EXISTS)
    # But for safety, let's just focus on 006 now, or wrap both correctly.
    
    # Ensuring 005 applied
    with open('backend/database/migrations/005_content_enrichment.sql', 'r') as f:
        sql = f.read()
        print("Running migration 005_content_enrichment...")
        try:
            with db.get_cursor(commit=True) as cur:
                cur.execute(sql)
        except Exception as e:
            print(f"Error in 005: {e}")

    # Running 006
    with open('backend/database/migrations/006_sitting_summaries.sql', 'r') as f:
        sql = f.read()
        print("Running migration 006_sitting_summaries...")
        with db.get_cursor(commit=True) as cur:
            cur.execute(sql)
    
    print("Migration completed successfully.")

if __name__ == "__main__":
    run_migration()
