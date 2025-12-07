#!/usr/bin/env python3
"""
Sync committees data from local PostgreSQL to Supabase Cloud
"""
import os
import subprocess
import json

# Load env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
except:
    pass

try:
    with open('.env.local') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
except:
    pass

# Get Supabase credentials
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_KEY: {SUPABASE_KEY[:20] if SUPABASE_KEY else 'None'}...")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing Supabase credentials")
    exit(1)

# Check if URL is localhost (wrong config)
if 'localhost' in SUPABASE_URL:
    print("WARNING: SUPABASE_URL points to localhost - this might be wrong!")
    print("Frontend likely connects to Supabase Cloud, not local PostgREST.")
    print()
    print("To fix this, you need to:")
    print("1. Get your real Supabase URL from supabase.com dashboard")
    print("2. Update .env.local with real VITE_SUPABASE_URL=https://xxx.supabase.co")
    print("3. Re-run ETL scripts with proper Supabase connection")
    print()
    
# Try to use Supabase client
try:
    from supabase import create_client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Test connection
    print("Testing Supabase connection...")
    result = supabase.table('committees').select('code').limit(1).execute()
    print(f"Committees in Supabase Cloud: {len(result.data)}")
    
    if result.data:
        print("Data already exists in Supabase!")
    else:
        print("No committees in Supabase - need to sync from local PostgreSQL")
        
        # Read from local PostgreSQL
        print("\nReading from local PostgreSQL...")
        pg_result = subprocess.run(
            ['/opt/homebrew/opt/postgresql@17/bin/psql', '-d', 'otwarty_parlament', '-At', '-c',
             'SELECT json_agg(row_to_json(c)) FROM committees c;'],
            capture_output=True, text=True
        )
        
        if pg_result.stdout.strip() and pg_result.stdout.strip() != 'null':
            committees = json.loads(pg_result.stdout.strip())
            print(f"Found {len(committees)} committees in local DB")
            
            # Upload to Supabase
            print("Uploading to Supabase...")
            for c in committees:
                # Clean data for upsert
                clean = {k: v for k, v in c.items() if v is not None}
                result = supabase.table('committees').upsert(clean).execute()
            
            print(f"Uploaded {len(committees)} committees")
        else:
            print("No data in local PostgreSQL")
            
except ImportError:
    print("Supabase Python client not installed. Run: pip install supabase")
except Exception as e:
    print(f"Error: {e}")
    
print("\nDone!")
