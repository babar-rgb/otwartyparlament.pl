
import os
from supabase import create_client, Client

url = "https://katzscelzhrvvxoobwul.supabase.co"
key = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not key:
    print("VITE_SUPABASE_ANON_KEY not found")
    exit(1)

supabase: Client = create_client(url, key)

print("Checking vote_results table...")

# Test query to see if table exists and has data
try:
    response = supabase.table("vote_results").select("*").limit(5).execute()
    print(f"Data found: {len(response.data)}")
    if len(response.data) > 0:
        print("Sample row:", response.data[0])
    else:
        print("Table appears empty or accessible but no rows returned.")
except Exception as e:
    print(f"Error querying vote_results: {e}")

# Check individual votes for a specific MP if possible (need an MP ID)
# Let's try to get an MP ID first
try:
    mp_res = supabase.table("mps").select("id, name").eq("slug", "adam-krzeminski").single().execute()
    if mp_res.data:
        mp_id = mp_res.data['id']
        print(f"Checking votes for MP: {mp_res.data['name']} (ID: {mp_id})")
        
        votes_res = supabase.table("vote_results").select("*").eq("mp_id", mp_id).limit(5).execute()
        print(f"Votes for MP found: {len(votes_res.data)}")
        if len(votes_res.data) > 0:
            print("Sample vote row:", votes_res.data[0])
    else:
        print("MP adam-krzeminski not found")
except Exception as e:
    print(f"Error checking MP votes: {e}")
