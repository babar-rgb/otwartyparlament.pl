from backend.core.db import db
from backend.core.logger import get_logger

logger = get_logger("core.schema_fixer")

def ensure_schema_integrity():
    """
    Checks for critical columns and adds them if missing.
    This fixes issues with persistent volumes having outdated schemas.
    """
    logger.info("🔧 Checking database schema integrity...")
    
    with db.get_cursor(commit=True) as cur:
        # 1. Ensure 'created_at' exists on all core tables
        tables = ['mps', 'votes', 'bills', 'interpellations']
        for table in tables:
            try:
                # Probing checks
                cur.execute(f"SELECT created_at FROM {table} LIMIT 1")
            except Exception:
                cur.connection.rollback()
                logger.warning(f"⚠️ Missing 'created_at' in {table}. Fixing...")
                try:
                    cur.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()")
                    logger.info(f"✅ Fixed {table}.")
                except Exception as e:
                    logger.error(f"❌ Failed to fix {table}: {e}")

        # 2. Fix 'sent_date' in interpellations
        try:
            cur.execute("SELECT sent_date FROM interpellations LIMIT 1")
        except Exception:
            cur.connection.rollback()
            logger.warning("⚠️ Missing 'sent_date' in interpellations. Checking for old 'date' column...")
            
            # Check if 'date' exists to rename it
            renamed = False
            try:
                cur.execute("SELECT date FROM interpellations LIMIT 1")
                # If we are here, 'date' exists
                logger.info("Found old 'date' column. Renaming to 'sent_date'...")
                cur.execute("ALTER TABLE interpellations RENAME COLUMN date TO sent_date")
                renamed = True
                logger.info("✅ Renamed 'date' to 'sent_date'.")
            except Exception:
                cur.connection.rollback()
            
            if not renamed:
                logger.info("Adding 'sent_date' column directly...")
                try:
                    cur.execute("ALTER TABLE interpellations ADD COLUMN IF NOT EXISTS sent_date DATE")
                    logger.info("✅ Added 'sent_date'.")
                except Exception as e:
                    logger.error(f"❌ Failed to add 'sent_date': {e}")
    
    logger.info("🔧 Schema check complete.")
