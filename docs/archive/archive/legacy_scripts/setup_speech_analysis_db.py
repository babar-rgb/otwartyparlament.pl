import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "host": "localhost",
    "port": 5432
}

def setup_db():
    print("Connecting to DB to add 'ai_analysis' column...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cur = conn.cursor()
        
        # Check if column exists
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='speeches' AND column_name='ai_analysis';")
        if cur.fetchone():
            print("Column 'ai_analysis' already exists.")
        else:
            print("Adding 'ai_analysis' column...")
            cur.execute("ALTER TABLE speeches ADD COLUMN ai_analysis JSONB;")
            print("Column added successfully.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    setup_db()
