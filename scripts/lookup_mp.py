import os
import sys
from supabase import create_client, Client

# Manually load .env
try:
    env_paths = ['.env', '../.env']
    for path in env_paths:
        if os.path.exists(path):
            with open(path) as f:
                for line in f:
                    if '=' in line and not line.startswith('#'):
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value
            break
except Exception:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Credentials required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def lookup_mp(mp_id):
    try:
        res = supabase.table('mps').select('*').eq('id', mp_id).execute()
        if res.data:
            print(f"MP {mp_id}: {res.data[0]}")
        else:
            print(f"MP {mp_id}: Not found")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        lookup_mp(sys.argv[1])
    else:
        print("Usage: python3 lookup_mp.py <mp_id>")
