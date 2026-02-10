import psycopg2

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def check_schema():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'sejm_gov_prints'")
    print("Columns in sejm_gov_prints:")
    print([c[0] for c in cur.fetchall()])
    
    conn.close()

if __name__ == "__main__":
    check_schema()
