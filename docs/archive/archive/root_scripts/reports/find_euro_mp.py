import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Manual loading because python-dotenv is acting up
try:
    with open('.env') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip().strip('"').strip("'")
except Exception:
    pass

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

if len(sys.argv) < 2:
    print("Usage: python find_euro_mp.py <name>")
    exit(1)

name_query = sys.argv[1]

response = supabase.table('euro_meps').select('*').ilike('full_name', f'%{name_query}%').execute()

if response.data:
    for mp in response.data:
        print(f"Name: {mp['full_name']}")
        print(f"ID: {mp['api_id']}")
        print(f"Photo URL: {mp['photo_url']}")
        print("-" * 20)
else:
    print("No MEP found.")
