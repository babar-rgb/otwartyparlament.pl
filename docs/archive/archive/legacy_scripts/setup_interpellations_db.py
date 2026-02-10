# Manually load .env (optional, just to be safe if we needed it)
try:
    with open('.env') as f:
        pass 
except Exception:
    pass

def setup_db():
    print("Setting up Interpellations DB Schema...")
    
    migration_file = "supabase/migration_interpellations.sql"
    
    try:
        with open(migration_file, 'r') as f:
            sql = f.read()
            print(f"\n[IMPORTANT] Please run the following SQL in your Supabase SQL Editor to create the necessary tables:\n")
            print("-" * 40)
            print(sql)
            print("-" * 40 + "\n")
    except Exception as e:
        print(f"Error reading migration file: {e}")

if __name__ == "__main__":
    setup_db()
