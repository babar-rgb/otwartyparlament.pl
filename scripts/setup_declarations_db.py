def setup_db():
    print("Setting up Asset Declarations DB Schema...")
    
    migration_file = "supabase/migration_declarations.sql"
    
    try:
        with open(migration_file, 'r') as f:
            sql = f.read()
            print(f"\n[IMPORTANT] Please run the following SQL in your Supabase SQL Editor to update the mps table:\n")
            print("-" * 40)
            print(sql)
            print("-" * 40 + "\n")
    except Exception as e:
        print(f"Error reading migration file: {e}")

if __name__ == "__main__":
    setup_db()
