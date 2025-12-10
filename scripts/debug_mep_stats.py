import psycopg2

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def check_mep_stats():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT full_name, attendance_score, rebellion_rate FROM euro_meps ORDER BY attendance_score DESC LIMIT 10")
    rows = cur.fetchall()
    
    print("Top Attendance:")
    for r in rows:
        print(f"{r[0]}: Att={r[1]}, Reb={r[2]}")
    conn.close()

if __name__ == "__main__":
    check_mep_stats()
