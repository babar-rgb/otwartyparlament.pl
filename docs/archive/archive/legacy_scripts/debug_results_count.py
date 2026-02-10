import psycopg2

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def check_counts():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM euro_vote_results")
    print(f"Total Results: {cur.fetchone()[0]}")
    
    cur.execute("SELECT mep_id FROM euro_vote_results LIMIT 5")
    print("Sample MEP IDs in Results:")
    for r in cur.fetchall():
        print(r[0])
        
    cur.execute("SELECT id, api_id FROM euro_meps LIMIT 5")
    print("Sample MEPs (ID, API_ID):")
    for r in cur.fetchall():
        print(f"ID={r[0]}, API={r[1]}")
        
    conn.close()

if __name__ == "__main__":
    check_counts()
