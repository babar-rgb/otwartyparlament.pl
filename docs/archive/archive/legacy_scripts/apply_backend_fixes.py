import psycopg2
import os

# DB Config (copied from existing scripts)
DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def apply_migration():
    print("🔌 Connecting to database...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cur = conn.cursor()
        
        migration_file = 'supabase/migration_backend_fixes.sql'
        print(f"📄 Reading migration file: {migration_file}")
        
        with open(migration_file, 'r') as f:
            sql = f.read()
            
        print("🚀 Executing SQL migration...")
        cur.execute(sql)
        
        print("✅ Migration applied successfully!")
        
        # Verify indexes
        cur.execute("SELECT indexname FROM pg_indexes WHERE tablename = 'vote_results'")
        indexes = [row[0] for row in cur.fetchall()]
        print(f"📊 Indexes on vote_results: {indexes}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error applying migration: {e}")

if __name__ == "__main__":
    apply_migration()
