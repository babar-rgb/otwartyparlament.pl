import os
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

# Check for Tomasz Lewandowski
data = supabase.table('mps').select('*').ilike('name', '%Tomasz Lewandowski%').execute().data
print(f"Found MPs matching 'Tomasz Lewandowski': {len(data)}")
if data:
    print(data[0])

# Check for Jurand Drop
data2 = supabase.table('mps').select('*').ilike('name', '%Jurand Drop%').execute().data
print(f"Found MPs matching 'Jurand Drop': {len(data2)}")
if data2:
    print(data2[0])
