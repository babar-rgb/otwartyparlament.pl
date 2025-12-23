import psycopg2

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def create_table():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print("Creating table 'bill_insights'...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS bill_insights (
            print_number VARCHAR(50) PRIMARY KEY,
            justification_text TEXT,
            ai_summary TEXT,
            pdf_url TEXT,
            last_updated TIMESTAMP DEFAULT NOW()
        );
    """)
    conn.commit()
    print("✅ Table created successfully.")
    conn.close()

if __name__ == "__main__":
    create_table()
