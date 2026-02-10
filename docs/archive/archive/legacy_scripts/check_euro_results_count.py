import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Manual loading fallback
try:
    with open('.env') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ[k] = v.strip().strip('"').strip("'")
except: pass

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("CRITICAL: Missing credentials even after manual load.")
    exit(1)
    
supabase: Client = create_client(url, key)

response = supabase.table('euro_votes').select('*', count='exact', head=True).execute()
print(f"Euro Votes (Metadata): {response.count}")

response_res = supabase.table('euro_vote_results').select('*', count='exact', head=True).execute()
print(f"Euro Vote Results (Individual Votes): {response_res.count}")
