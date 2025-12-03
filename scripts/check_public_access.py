import os
from supabase import create_client, Client

# Frontend Config (from src/lib/supabase.ts)
SUPABASE_URL = 'https://xmlsuhshmmrfwhdammcv.supabase.co'
# This is the ANON KEY, not the Service Role Key
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbHN1aHNobW1yZndoZGFtbWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTg4MzIsImV4cCI6MjA3OTQ3NDgzMn0.0FYzencUg_1Oq8Pygk5ewCNzS5he1-vOBj5bVdEa4Eo'

def check_access():
    print("--- CHECKING PUBLIC ACCESS (ANON KEY) ---")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        
        # Try to fetch votes EXACTLY like the frontend
        print("Executing frontend-like query...")
        response = supabase.table('votes') \
            .select('*') \
            .order('date', desc=True) \
            .range(0, 19) \
            .execute()
            
        data = response.data
        print(f"Returned rows: {len(data)}")
        if len(data) > 0:
            print("Sample vote:", data[0]['title_clean'])
        else:
            print("❌ Frontend query returned 0 rows!")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    check_access()
