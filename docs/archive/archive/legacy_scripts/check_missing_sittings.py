import os
import requests
from supabase import create_client, Client

# Manually load .env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
except Exception:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Credentials required (Supabase).")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

# 1. Get all sittings from API
print("Fetching sittings from API...")
try:
    response = requests.get(f"{SEJM_API_URL}/proceedings")
    api_sittings = sorted([item['number'] for item in response.json()])
    print(f"API reports {len(api_sittings)} sittings: {api_sittings}")
except Exception as e:
    print(f"Error fetching from API: {e}")
    exit(1)

# 2. Get all sittings from DB
print("Fetching sittings from DB...")
try:
    # We can get unique sittings from votes table
    # Using a raw SQL query via rpc would be best, but we'll fetch distinct sittings via python set
    # Fetching all votes is expensive, let's try to fetch just sitting column
    # Actually, we can just check if we have ANY vote for each sitting
    
    # Better approach: Check count of votes per sitting
    # Since we can't do complex group by easily with this client without RPC, 
    # let's just iterate and check count for each sitting.
    
    missing_sittings = []
    for sitting in api_sittings:
        count = supabase.table('votes').select('*', count='exact', head=True).eq('sitting', sitting).execute().count
        print(f"Sitting {sitting}: {count} votes")
        if count == 0:
            missing_sittings.append(sitting)
            
    print(f"Missing sittings: {missing_sittings}")
    
except Exception as e:
    print(f"Error checking DB: {e}")
