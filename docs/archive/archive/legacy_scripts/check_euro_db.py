import os
from supabase import create_client

# Local .env loader
try:
    with open('.env') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip()
except Exception:
    pass

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase = create_client(url, key)

res_votes = supabase.table('euro_votes').select('*', count='exact', head=True).execute()
res_results = supabase.table('euro_vote_results').select('*', count='exact', head=True).execute()
res_sample = supabase.table('euro_vote_results').select('*').limit(1).execute()

print(f"Euro Votes Count: {res_votes.count}")
print(f"Euro Vote Results Count: {res_results.count}")

# Show sample
if res_sample.data:
    sample = res_sample.data[0]
    print("\nSAMPLE RECORD (Co zapisujemy):")
    print(f"MEP ID: {sample['mep_id']}")
    print(f"Vote (Jak zagłosował): {sample['vote']}")
    print(f"Vote ID: {sample['vote_id']}")
