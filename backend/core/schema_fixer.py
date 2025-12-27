from backend.core.db import db
from backend.core.orm_db import Base, engine
from backend.core.logger import get_logger
# Import models to ensure they are registered with Base.metadata
import backend.models  # noqa: F401

logger = get_logger("core.schema_fixer")

def ensure_schema_integrity():
    """
    Checks for critical columns and adds them if missing.
    This fixes issues with persistent volumes having outdated schemas.
    """
    logger.info("🔧 Checking database schema integrity...")

    # 1. Automatic Table Creation via SQLAlchemy
    # This uses models.py as the Source of Truth for all tables.
    try:
        logger.info("1. Running Base.metadata.create_all() to ensure all tables exist...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Tables checked/created successfully.")
    except Exception as e:
        logger.error(f"❌ Failed to run create_all: {e}")

    # 2. Migration Checks (Column Updates on Existing Tables)
    # create_all() does NOT update existing tables (e.g. adding missing columns).
    # so we keep the specific column migrations below.
    
    with db.get_cursor(commit=True) as cur:
        # A. Ensure 'created_at' exists on all core tables
        tables = ['mps', 'votes', 'bills', 'interpellations', 'committees', 'asset_declarations', 'euro_votes']
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

        # B. Ensure 'voting_number' exists in votes
        try:
            cur.execute("SELECT voting_number FROM votes LIMIT 1")
        except Exception:
            cur.connection.rollback()
            logger.warning("⚠️ Missing 'voting_number' in votes. Fixing...")
            try:
                cur.execute("ALTER TABLE votes ADD COLUMN IF NOT EXISTS voting_number INTEGER")
                logger.info("✅ Fixed votes (added voting_number).")
            except Exception as e:
                logger.error(f"❌ Failed to fix votes: {e}")

        # C. Ensure 'title_raw', 'title_clean', 'verdict', 'details_json' in votes
        # First check if we need to rename 'title' -> 'title_raw'
        try:
            cur.execute("SELECT title_raw FROM votes LIMIT 1")
        except Exception:
            cur.connection.rollback()
            logger.warning("⚠️ Missing 'title_raw' in votes. Checking for 'title'...")
            try:
                cur.execute("SELECT title FROM votes LIMIT 1")
                # If title exists, rename it
                logger.info("Found old 'title' column. Renaming to 'title_raw'...")
                cur.execute("ALTER TABLE votes RENAME COLUMN title TO title_raw")
                logger.info("✅ Renamed 'title' to 'title_raw'.")
            except Exception:
                cur.connection.rollback()
                # If title doesn't exist, create title_raw
                try:
                    cur.execute("ALTER TABLE votes ADD COLUMN IF NOT EXISTS title_raw VARCHAR")
                    logger.info("✅ Added 'title_raw'.")
                except Exception as e:
                    logger.error(f"❌ Failed to create 'title_raw': {e}")

        # Now check the others
        vote_cols = [
            ("title_clean", "VARCHAR"),
            ("verdict", "VARCHAR"),
            ("details_json", "JSONB")
        ]
        for v_col, v_type in vote_cols:
            try:
                cur.execute(f"SELECT {v_col} FROM votes LIMIT 1")
            except Exception:
                cur.connection.rollback()
                logger.warning(f"⚠️ Missing '{v_col}' in votes. Fixing...")
                try:
                    cur.execute(f"ALTER TABLE votes ADD COLUMN IF NOT EXISTS {v_col} {v_type}")
                    logger.info(f"✅ Added '{v_col}' to votes.")
                except Exception as e:
                    logger.error(f"❌ Failed to fix votes ({v_col}): {e}")

        # D. Fix 'sent_date' in interpellations
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
        
        # E. Fix 'last_modified' and 'raw_data' in interpellations
        columns = [
            ("last_modified", "TIMESTAMP"),
            ("raw_data", "JSONB")
        ]
        for col_name, col_type in columns:
            try:
                cur.execute(f"SELECT {col_name} FROM interpellations LIMIT 1")
            except Exception:
                cur.connection.rollback()
                logger.warning(f"⚠️ Missing '{col_name}' in interpellations. Adding...")
                try:
                    cur.execute(f"ALTER TABLE interpellations ADD COLUMN IF NOT EXISTS {col_name} {col_type}")
                    logger.info(f"✅ Added '{col_name}'.")
                except Exception as e:
                    logger.error(f"❌ Failed to add '{col_name}': {e}")

    logger.info("🔧 Schema check complete.")
