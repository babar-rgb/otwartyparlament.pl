
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

keywords = ["budżet", "podatki", "aborcja"]

print("--- Searching for 'łańcuch' or 'zwierząt' ---")
try:
    keywords = ["łańcuch", "zwierząt", "zwierzęta"]
    for kw in keywords:
        print(f"\nSearching for '{kw}':")
        response = supabase.table("votes").select("id, title_clean, date").ilike("title_clean", f"%{kw}%").execute()
        if response.data:
            for item in response.data:
                print(f"  - [{item['date']}] {item['title_clean']}")
        else:
            print("  No results.")

    print("\n--- Checking Total Vote Count ---")
    count = supabase.table("votes").select("id", count="exact").execute()
    print(f"Total votes in DB: {count.count}")

except Exception as e:
    print(f"Error: {e}")

print("\n--- Checking Speeches ---")
for keyword in keywords:
    print(f"\nSearching Speeches for '{keyword}':")
    try:
        response = supabase.table("speeches").select("id, content, date").ilike("content", f"%{keyword}%").limit(5).execute()
        if response.data:
            for item in response.data:
                snippet = item['content'][:100].replace('\n', ' ')
                print(f"  - [{item['date']}] {snippet}...")
        else:
            print("  No results found.")
    except Exception as e:
        print(f"  Error: {e}")
