from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

# Match exact logic of "working" script
if not os.environ.get("VITE_SUPABASE_URL"):
    try:
        with open('.env') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    k, v = line.strip().split('=', 1)
                    os.environ[k] = v.strip().strip('"').strip("'")
    except: pass

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("No credentials")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🔍 Verifying Delete Access...")

# 1. Count Before
res = supabase.table('euro_votes')\
    .select('id', count='exact')\
    .eq('votes_for', 0)\
    .eq('votes_against', 0)\
    .eq('votes_abstain', 0)\
    .execute()
    
count_before = res.count
print(f"📉 Bad Votes Before: {count_before}")

if count_before == 0:
    print("Zero bad votes found. Cannot verify delete.")
    # Try inserting a test row?
    print("Attempting INSERT test...")
    try:
         supabase.table('euro_votes').insert({
            "id": "DELETE_TEST_123",
            "title": "DELETE_TEST",
            "date": "2025-01-01",
            "votes_for": 0, "votes_against": 0, "votes_abstain": 0,
            "term": 10
         }).execute()
         print("✅ INSERT SUCCESS!")
         # Delete it
         supabase.table('euro_votes').delete().eq('id', 'DELETE_TEST_123').execute()
         print("✅ TEARDOWN SUCCESS!")
    except Exception as e:
         print(f"❌ INSERT FAILED: {e}")
    exit(0)

# 2. Delete (First 10)
ids_to_del = [x['id'] for x in res.data[:10]]
print(f"🗑️ Attempting to delete {len(ids_to_del)} rows...")

try:
    r = supabase.table('euro_votes').delete().in_('id', ids_to_del).execute()
    print("Delete call finished.")
    # Supabase-py v2 returns data in r.data If deleted.
    if r.data:
        print(f"Recieved {len(r.data)} deleted rows in response.")
    else:
        print("Received EMPTY data in response (Silent Failure?).")
        
except Exception as e:
    print(f"❌ DELETE FAILED with Error: {e}")

# 3. Count After
res2 = supabase.table('euro_votes')\
    .select('id', count='exact')\
    .eq('votes_for', 0)\
    .eq('votes_against', 0)\
    .eq('votes_abstain', 0)\
    .execute()
    
count_after = res2.count
print(f"📉 Bad Votes After: {count_after}")

if count_after < count_before:
    print("✅ CONFIRMED: Rows were deleted.")
else:
    print("❌ FAILED: Row count unchanged.")
