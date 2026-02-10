
import os
from supabase import create_client, Client

# Manually load .env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

url: str = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.")
    exit(1)

supabase: Client = create_client(url, key)

print("--- Checking MPs Table ---")
try:
    # Check columns
    response = supabase.table("mps").select("*").limit(1).execute()
    if response.data:
        print("Columns:", response.data[0].keys())
    else:
        print("MPs table is empty.")

    # Check for specific MPs
    print("\nSearching for 'Mentzen'...")
    response = supabase.table("mps").select("first_name, last_name, club").ilike("last_name", "%Mentzen%").execute()
    print(response.data)

    print("\nSearching for 'Tusk'...")
    response = supabase.table("mps").select("first_name, last_name, club").ilike("last_name", "%Tusk%").execute()
    print(response.data)

except Exception as e:
    print(f"Error: {e}")
