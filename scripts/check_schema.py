import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
print(f"Using Key: {key[:10]}...")

supabase = create_client(url, key)

def check_structure():
    # Try to insert a dummy row to get a clear error or listing columns
    # Actually, supabase-py doesn't have a 'describe table' method easily accessible via Postgrest
    # But we can try to Select one row.
    res = supabase.table('euro_votes').select('*').limit(1).execute()
    if res.data:
        print("Existing Row Keys:", res.data[0].keys())
    else:
        print("Table Access OK but valid row not found (or table empty)")
        
    print("\nAttempting dummy Insert to find constraints...")
    try:
        supabase.table('euro_votes').insert({
            "id": "test_id",
            "title": "test",
            "date": "2025-01-01",
            "votes_for": 0,
            "votes_against": 0,
            "votes_abstain": 0,
            "importance_score": 0,
            "is_key_vote": False,
            "term": 10
        }).execute()
        print("Insert Success (Deleting now...)")
        supabase.table('euro_votes').delete().eq('id', 'test_id').execute()
    except Exception as e:
        print("Insert Failed:", e)

if __name__ == "__main__":
    check_structure()
