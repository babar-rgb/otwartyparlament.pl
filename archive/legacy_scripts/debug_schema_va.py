import psycopg2

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def check_va():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vote_analyses'")
    print("Columns in vote_analyses:")
    for c in cur.fetchall():
        print(f"{c[0]} ({c[1]})")
    
    conn.close()

if __name__ == "__main__":
    check_va()
