import os
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    # Try loading from .env manually
    try:
        with open('.env') as f:
            for line in f:
                if '=' in line:
                    k, v = line.strip().split('=', 1)
                    if k == 'SUPABASE_URL': SUPABASE_URL = v
                    if k == 'SUPABASE_SERVICE_ROLE_KEY': SUPABASE_KEY = v
    except:
        pass

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    print("Fetching one vote to check schema...")
    response = supabase.table('votes').select('*').limit(1).execute()
    if response.data:
        print("Columns:", response.data[0].keys())
    else:
        print("No votes found.")
except Exception as e:
    print(f"Error: {e}")
