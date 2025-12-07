import os
from supabase import create_client

# Load Env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip().strip("'").strip('"')
except: pass

url = os.environ.get("SUPABASE_URL")
# Use Service Role Key for writing
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

print(f"Connecting to {url}...")
# Verify key is present
if not key:
    print("FATAL: No key found")
    exit(1)

supabase = create_client(url, key)

# Payload that mimics the ETL structure
payload = {
    "id": 90023002,
    "sitting": 23,
    "voting_number": 1,
    "date": "2020-01-01T12:00:00",
    "title_raw": "Test Vote Debug Minimal",
    "term": 9
}

print("Attempting UPSERT...")
try:
    data = supabase.table('votes').upsert(payload).execute()
    print("SUCCESS!")
    print(data)
except Exception as e:
    print("FAILURE!")
    print(e)
    # Print the raw error details if available
    try:
        print(f"Details: {e.details}")
    except: pass
