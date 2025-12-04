
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

print("--- Checking Key Votes in SPRAWIEDLIWOŚĆ ---")
try:
    response = supabase.table("votes").select("id, title_clean").eq("category", "SPRAWIEDLIWOŚĆ").eq("is_key_vote", True).execute()
    
    if response.data:
        print(f"Found {len(response.data)} key votes:")
        for item in response.data:
            print(f"  - {item['title_clean']}")
    else:
        print("No key votes found in SPRAWIEDLIWOŚĆ.")
        
        # Check total votes in category
        total = supabase.table("votes").select("id", count="exact").eq("category", "SPRAWIEDLIWOŚĆ").execute()
        print(f"Total votes in category: {total.count}")

except Exception as e:
    print(f"Error: {e}")
