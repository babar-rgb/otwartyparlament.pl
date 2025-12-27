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
        
        # 3. Fix 'last_modified' and 'raw_data' in interpellations
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

        # 4. Fix missing 'interpellation_authors' table
        try:
            cur.execute("SELECT 1 FROM interpellation_authors LIMIT 1")
        except Exception:
            cur.connection.rollback()
            logger.warning("⚠️ Missing 'interpellation_authors' table. Creating...")
            try:
                sql = """
                    CREATE TABLE IF NOT EXISTS interpellation_authors (
                        interpellation_id INTEGER REFERENCES interpellations(id),
                        mp_id INTEGER REFERENCES mps(id),
                        PRIMARY KEY (interpellation_id, mp_id)
                    );
                """
                cur.execute(sql)
                logger.info("✅ Created 'interpellation_authors' table.")
            except Exception as e:
                logger.error(f"❌ Failed to create 'interpellation_authors': {e}")
        
        # 5. Fix remaining tables (Committees, Declarations, Europarl)
        missing_tables = {
            "committees": """
                CREATE TABLE IF NOT EXISTS committees (
                    code VARCHAR PRIMARY KEY,
                    name VARCHAR,
                    name_genitive VARCHAR,
                    committee_type VARCHAR,
                    phone VARCHAR,
                    term INTEGER,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """,
            "committee_members": """
                CREATE TABLE IF NOT EXISTS committee_members (
                    id SERIAL PRIMARY KEY,
                    committee_code VARCHAR REFERENCES committees(code),
                    mp_id INTEGER REFERENCES mps(id),
                    function VARCHAR,
                    from_date DATE,
                    to_date DATE,
                    term INTEGER
                );
            """,
            "asset_declarations": """
                CREATE TABLE IF NOT EXISTS asset_declarations (
                    id SERIAL PRIMARY KEY,
                    mp_id INTEGER REFERENCES mps(id),
                    year VARCHAR,
                    type VARCHAR,
                    pdf_url VARCHAR,
                    raw_data JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """,
            "euro_meps": """
                CREATE TABLE IF NOT EXISTS euro_meps (
                    id SERIAL PRIMARY KEY,
                    api_id INTEGER UNIQUE,
                    name VARCHAR,
                    party VARCHAR
                );
            """,
            "euro_votes": """
                CREATE TABLE IF NOT EXISTS euro_votes (
                    id VARCHAR PRIMARY KEY,
                    title TEXT,
                    date DATE,
                    votes_for INTEGER,
                    votes_against INTEGER,
                    votes_abstain INTEGER,
                    importance_score INTEGER,
                    is_key_vote BOOLEAN,
                    term INTEGER,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """,
            "euro_vote_results": """
                CREATE TABLE IF NOT EXISTS euro_vote_results (
                    id SERIAL PRIMARY KEY,
                    vote_id VARCHAR REFERENCES euro_votes(id),
                    mep_id INTEGER,
                    vote VARCHAR
                );
            """
        }

        for tbl, sql in missing_tables.items():
            try:
                cur.execute(f"SELECT 1 FROM {tbl} LIMIT 1")
            except Exception:
                cur.connection.rollback()
                logger.warning(f"⚠️ Missing '{tbl}' table. Creating...")
                try:
                    cur.execute(sql)
                    logger.info(f"✅ Created '{tbl}' table.")
                except Exception as e:
                    logger.error(f"❌ Failed to create '{tbl}': {e}")

    logger.info("🔧 Schema check complete.")
