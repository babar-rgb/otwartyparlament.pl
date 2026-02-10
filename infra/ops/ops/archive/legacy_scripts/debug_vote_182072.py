import psycopg2

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def check_vote(vid):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT id, title, importance_score, is_key_vote FROM euro_votes WHERE id = %s", (vid,))
    row = cur.fetchone()
    print(f"Vote {vid}:")
    print(f"Title: '{row[1]}'")
    print(f"Score: {row[2]}")
    print(f"IsKey: {row[3]}")
    
    # Test logic
    title_lower = row[1].lower()
    technical_terms = ["am ", "amendment", "§", "recital", "after", "before", "part"]
    found = [t for t in technical_terms if t in title_lower]
    print(f"Matches Filter: {found}")
    
    conn.close()

if __name__ == "__main__":
    check_vote("182072")
