import logging
logging.basicConfig(level=logging.INFO)
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.db import db
from backend.core.logger import get_logger

logger = get_logger("scripts.migrate")

def run_migration():
    migration_file = os.path.join(os.path.dirname(__file__), "../database/migrations/004_activity_metrics.sql")
    
    with open(migration_file, 'r') as f:
        sql = f.read()
        
    logger.info("Applying migration 004_activity_metrics...")
    try:
        with db.get_cursor(commit=True) as cur:
            cur.execute(sql)
        logger.info("Migration successful.")
    except Exception as e:
        logger.error(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
