import os
from supabase import create_client, Client

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def run_migration(file_path):
    print(f"Running migration: {file_path}...")
    try:
        with open(file_path, 'r') as f:
            sql = f.read()
            # Supabase-py doesn't have a direct 'query' method for raw SQL in the free tier usually, 
            # but we can try rpc if we had a function, or use the postgres connection directly.
            # However, for simplicity in this environment, we might assume the user has a way to run SQL 
            # or we use the 'rpc' trick if a 'exec_sql' function exists.
            
            # FALLBACK: Since we can't easily run raw SQL via the JS/Python client without a helper function in DB,
            # we will print instructions if this fails, or assume the user runs it in Supabase Dashboard.
            
            # BUT, since I am an agent, I should try to make it work. 
            # Often projects have a 'exec_sql' RPC function for this.
            
            # Let's try to use the REST API to call a hypothetical 'exec_sql' or just print the SQL for the user.
            # Actually, for this specific user, I will just print the SQL and ask them to run it, 
            # OR I can try to use the `psycopg2` if available, but I don't have DB credentials (host/pass), only API URL/Key.
            
            print(f"\n[IMPORTANT] Please run the following SQL in your Supabase SQL Editor:\n")
            print(sql)
            print("\n" + "-"*40 + "\n")
            
    except Exception as e:
        print(f"Error reading migration file: {e}")

if __name__ == "__main__":
    print("Setting up Database Schema...")
    
    # List of migration files to apply
    migrations = [
        "supabase/schema.sql",
        "supabase/migration_processes.sql",
        "supabase/migration_votes_link.sql"
    ]
    
    for migration in migrations:
        run_migration(migration)
        
    print("Schema setup instructions complete.")
