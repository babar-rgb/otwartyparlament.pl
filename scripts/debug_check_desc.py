import psycopg2

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def check_desc():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    # Check 5 most recent votes
    cur.execute("SELECT id, title, description FROM euro_votes ORDER BY date DESC LIMIT 5")
    rows = cur.fetchall()
    
    print("Checking Top 5 Votes:")
    for r in rows:
        print(f"ID: {r[0]}")
        print(f"Title: '{r[1]}'")
        print(f"Desc: '{r[2]}'")
        print("-" * 20)
    conn.close()

if __name__ == "__main__":
    check_desc()
