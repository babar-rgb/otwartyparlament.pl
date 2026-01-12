import sys
import os

# Add parent directory to path so we can import backend packages
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

try:
    from backend.core.db import db
    from backend.core.logger import get_logger
except ImportError:
    # Fallback for running from root
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from core.db import db
    from core.logger import get_logger

logger = get_logger("migration.biography")

def run_migration():
    logger.info("Starting migration: Add biography column to mps table")
    try:
        with db.get_cursor(commit=True) as cur:
            cur.execute("ALTER TABLE mps ADD COLUMN IF NOT EXISTS biography TEXT;")
            logger.info("Successfully added 'biography' column to 'mps' table.")
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
