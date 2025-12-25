"""
Database Migration Manager
Tracks schema changes and ensures the DB is up to date.
"""
import os
import glob
from backend.core.db import db
from backend.core.logger import get_logger

logger = get_logger("db.migrate")

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "migrations")

def init_migration_table():
    """Create the migrations tracking table if not exists."""
    with db.get_cursor(commit=True) as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version TEXT PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT NOW()
            );
        """)

def get_applied_migrations():
    """Get list of already applied versions."""
    with db.get_cursor() as cur:
        cur.execute("SELECT version FROM schema_migrations")
        return {row['version'] for row in cur.fetchall()}

def run_migrations():
    """Run all pending migrations."""
    logger.info("Checking for pending migrations...")
    init_migration_table()
    
    applied = get_applied_migrations()
    
    # Get all .sql files in migrations dir
    files = glob.glob(os.path.join(MIGRATIONS_DIR, "*.sql"))
    files.sort() # Ensure we run 001, then 002...
    
    pending = 0
    for f_path in files:
        version = os.path.basename(f_path)
        if version not in applied:
            logger.info(f"Applying migration: {version}")
            try:
                apply_migration(f_path, version)
                pending += 1
            except Exception as e:
                logger.error(f"Failed to apply {version}: {e}")
                # Stop on error!
                return
    
    if pending == 0:
        logger.info("Database is up to date.")
    else:
        logger.info(f"Successfully applied {pending} migrations.")

def apply_migration(f_path, version):
    with open(f_path, 'r') as f:
        sql = f.read()
    
    with db.get_cursor(commit=True) as cur:
        cur.execute(sql)
        cur.execute("INSERT INTO schema_migrations (version) VALUES (%s)", (version,))

if __name__ == "__main__":
    run_migrations()
