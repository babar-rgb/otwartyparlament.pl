import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "host": "localhost",
    "port": 5432
}

def list_speeches():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get 5 recent speeches with content length > 500
        sql = """
            SELECT id, speaker_name, date, left(content, 100) as snippet 
            FROM speeches 
            WHERE length(content) > 500 
            ORDER BY date DESC, id DESC 
            LIMIT 5;
        """
        cur.execute(sql)
        rows = cur.fetchall()
        
        print("Recent Speeches:")
        for r in rows:
            print(f"ID: {r['id']} | {r['speaker_name']} | {r['date']} | {r['snippet']}...")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_speeches()
