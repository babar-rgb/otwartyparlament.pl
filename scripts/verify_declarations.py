import os
from supabase import create_client, Client
import json

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

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def verify_declarations():
    print("Verifying declarations for MP ID 1...")
    response = supabase.table('mps').select('declarations').eq('id', 1).single().execute()
    
    if response.data:
        decls = response.data.get('declarations', [])
        print(f"Found {len(decls)} declarations.")
        print(json.dumps(decls[:5], indent=2, ensure_ascii=False)) # Print first 5
        
        # Check for duplicates
        urls = [d['url'] for d in decls]
        unique_urls = set(urls)
        print(f"Unique URLs: {len(unique_urls)}")
    else:
        print("No data found.")

if __name__ == "__main__":
    verify_declarations()
