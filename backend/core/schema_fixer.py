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

    # 1. Surgical Table Creation
    with db.get_cursor(commit=True) as cur:
        # Get list of existing tables in public schema via raw SQL (more reliable than inspector)
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        existing_tables = set(row['table_name'] for row in cur.fetchall())
        logger.info(f"Existing tables (SQL check): {existing_tables}")

        for table_name in Base.metadata.tables:
            if table_name not in existing_tables:
                logger.info(f"Table '{table_name}' is missing. Attempting creation...")
                try:
                    # We create tables one by one. Base.metadata.create_all is too "all or nothing"
                    # and its internal checks are clearly failing in this environment.
                    table_obj = Base.metadata.tables[table_name]
                    table_obj.create(bind=engine, checkfirst=True)
                    logger.info(f"✅ Created table '{table_name}'.")
                    # Add to set so we don't try to migrate logic below if it was JUST created (redundant)
                    existing_tables.add(table_name)
                except Exception as e:
                    logger.error(f"❌ Failed to create table '{table_name}': {e}")

    # 2. Migration Checks (Column Updates on Existing Tables)
    with db.get_cursor(commit=True) as cur:
        # A. MP Table Migrations (name -> first_name, last_name; party -> club)
        if 'mps' in existing_tables:
            try:
                cur.execute("SELECT first_name FROM mps LIMIT 1")
            except Exception:
                cur.connection.rollback()
                logger.warning("⚠️ Missing 'first_name' in mps. Checking for old 'name' column...")
                try:
                    cur.execute("SELECT name FROM mps LIMIT 1")
                    logger.info("Renaming 'name' to 'first_name'...")
                    cur.execute("ALTER TABLE mps RENAME COLUMN name TO first_name")
                    cur.execute("ALTER TABLE mps ALTER COLUMN first_name DROP NOT NULL")
                    logger.info("✅ Renamed 'name' to 'first_name'.")
                except Exception:
                    cur.connection.rollback()
                    logger.info("Adding 'first_name' column...")
                    cur.execute("ALTER TABLE mps ADD COLUMN IF NOT EXISTS first_name VARCHAR")

            # Ensure last_name exists
            try:
                cur.execute("SELECT last_name FROM mps LIMIT 1")
            except Exception:
                cur.connection.rollback()
                logger.info("Adding 'last_name' column to mps...")
                cur.execute("ALTER TABLE mps ADD COLUMN IF NOT EXISTS last_name VARCHAR")

            # club migration
            try:
                cur.execute("SELECT club FROM mps LIMIT 1")
            except Exception:
                cur.connection.rollback()
                logger.warning("⚠️ Missing 'club' in mps. Checking for old 'party' column...")
                try:
                    cur.execute("SELECT party FROM mps LIMIT 1")
                    logger.info("Renaming 'party' to 'club'...")
                    cur.execute("ALTER TABLE mps RENAME COLUMN party TO club")
                    logger.info("✅ Renamed 'party' to 'club'.")
                except Exception:
                    cur.connection.rollback()
                    logger.info("Adding 'club' column...")
                    cur.execute("ALTER TABLE mps ADD COLUMN IF NOT EXISTS club VARCHAR")

        # B. Ensure 'created_at' exists on all core tables
        tables_to_fix = ['mps', 'votes', 'bills', 'interpellations', 'committees', 'asset_declarations', 'euro_votes']
        for table in tables_to_fix:
            if table not in existing_tables: continue
            try:
                cur.execute(f"SELECT created_at FROM {table} LIMIT 1")
            except Exception:
                cur.connection.rollback()
                logger.warning(f"⚠️ Missing 'created_at' in {table}. Fixing...")
                try:
                    cur.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()")
                    logger.info(f"✅ Fixed {table}.")
                except Exception as e:
                    logger.error(f"❌ Failed to fix {table}: {e}")

        # C. Ensure 'voting_number' exists in votes
        if 'votes' in existing_tables:
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

            # D. Ensure 'title_raw', 'title_clean', 'verdict', 'details_json' in votes
            try:
                cur.execute("SELECT title_raw FROM votes LIMIT 1")
            except Exception:
                cur.connection.rollback()
                logger.warning("⚠️ Missing 'title_raw' in votes. Checking for 'title'...")
                try:
                    cur.execute("SELECT title FROM votes LIMIT 1")
                    logger.info("Found old 'title' column. Renaming to 'title_raw'...")
                    cur.execute("ALTER TABLE votes RENAME COLUMN title TO title_raw")
                    logger.info("✅ Renamed 'title' to 'title_raw'.")
                except Exception:
                    cur.connection.rollback()
                    try:
                        cur.execute("ALTER TABLE votes ADD COLUMN IF NOT EXISTS title_raw VARCHAR")
                        logger.info("✅ Added 'title_raw'.")
                    except Exception as e:
                        logger.error(f"❌ Failed to create 'title_raw': {e}")

            # Now check the others for votes
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

        # E. Fix 'sent_date' in interpellations
        if 'interpellations' in existing_tables:
            try:
                cur.execute("SELECT sent_date FROM interpellations LIMIT 1")
            except Exception:
                cur.connection.rollback()
                logger.warning("⚠️ Missing 'sent_date' in interpellations. Checking for old 'date' column...")
                try:
                    cur.execute("SELECT date FROM interpellations LIMIT 1")
                    logger.info("Found old 'date' column. Renaming to 'sent_date'...")
                    cur.execute("ALTER TABLE interpellations RENAME COLUMN date TO sent_date")
                    logger.info("✅ Renamed 'date' to 'sent_date'.")
                except Exception:
                    cur.connection.rollback()
                    try:
                        cur.execute("ALTER TABLE interpellations ADD COLUMN IF NOT EXISTS sent_date DATE")
                        logger.info("✅ Added 'sent_date'.")
                    except Exception as e:
                        logger.error(f"❌ Failed to add 'sent_date': {e}")
            
            # F. Ensure 'last_modified' and 'raw_data' in interpellations
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
