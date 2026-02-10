import os
from supabase import create_client, Client

# Manual env
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
    print("No credentials")
    exit(1)

supabase: Client = create_client(url, key)

try:
    # Try selecting the new columns
    response = supabase.table('euro_votes').select('id, importance_score, is_key_vote').limit(1).execute()
    print("Columns exist! Data sample:")
    print(response.data)
except Exception as e:
    print(f"Migration verification failed: {e}")
