import psycopg2
import os

# Common Local Defaults
# 54322 is Supabase Local default
# 5432 is Standard Postgres
PORTS = [54322, 5432, 6432] 
PASSWORDS = ['postgres', 'password', 'supabase', '']

def test_conn():
    print("🐘 Testing Direct Postgres Connection...")
    
    for port in PORTS:
        for password in PASSWORDS:
            try:
                dsn = f"dbname='postgres' user='postgres' host='localhost' port='{port}' password='{password}'"
                # print(f"Trying Port {port}...")
                conn = psycopg2.connect(dsn)
                print(f"✅ SUCCESS! Connected to Port {port} with password '{password}'")
                
                # Check tables
                cur = conn.cursor()
                cur.execute("SELECT count(*) FROM euro_votes;")
                count = cur.fetchone()[0]
                print(f"📊 Table 'euro_votes' has {count} rows.")
                
                conn.close()
                return dsn # Return working DSN
            except Exception as e:
                # print(f"Failed {port}/{password}: {e}")
                pass
                
    print("❌ Failed to connect to any local Postgres.")
    return None

if __name__ == "__main__":
    test_conn()
