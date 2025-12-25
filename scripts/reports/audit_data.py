import os
from supabase import create_client, Client
from datetime import datetime

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

def get_count(table):
    try:
        return supabase.table(table).select('*', count='exact', head=True).execute().count
    except Exception as e:
        return f"Error: {e}"

def get_latest_date(table, date_col):
    try:
        # Fix: use desc=True instead of ascending=False if that was the issue, 
        # but actually supabase-py postgrest-py uses order('col', desc=True)
        data = supabase.table(table).select(date_col).order(date_col, desc=True).limit(1).execute().data
        if data:
            return data[0][date_col]
        return "None"
    except Exception as e:
        return f"Error: {e}"

print("--- Data Audit Report ---")
print(f"MPs: {get_count('mps')} (Target: ~460)")
print(f"Votes: {get_count('votes')} (Latest: {get_latest_date('votes', 'date')})")
# Check bills (stored as 'processes')
print(f"Bills (Processes): {get_count('processes')}")
print(f"Speeches: {get_count('speeches')} (Latest: {get_latest_date('speeches', 'date')})")
print(f"Interpellations: {get_count('interpellations')} (Latest: {get_latest_date('interpellations', 'sent_date')})")
print(f"Asset Declarations: {get_count('asset_declarations')}")
print("-------------------------")
