import psycopg2

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def check_stats():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # 1. Sejm Prints
    cur.execute("SELECT COUNT(*) FROM sejm_prints")
    c_prints = cur.fetchone()[0]
    
    # 2. Mind Maps
    cur.execute("SELECT COUNT(*) FROM vote_analyses WHERE mind_map IS NOT NULL")
    c_mm = cur.fetchone()[0]
    
    # 3. Euro Desc
    cur.execute("SELECT COUNT(*) FROM euro_votes WHERE description IS NOT NULL")
    c_euro = cur.fetchone()[0]
    
    # 4. Euro Total
    cur.execute("SELECT COUNT(*) FROM euro_votes")
    c_euro_total = cur.fetchone()[0]
    
    print(f"Sejm Prints: {c_prints}")
    print(f"Mind Maps: {c_mm}")
    print(f"Euro Descriptions: {c_euro} / {c_euro_total}")
    
    conn.close()

if __name__ == "__main__":
    check_stats()
