import os
from supabase import create_client, Client

# Manually load .env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip()
except Exception:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def debug_vote():
    print("Debugging Vote 26/48...")
    
    # 1. Find the vote ID
    response = supabase.table('votes')\
        .select('id, title_clean, title_raw, date')\
        .eq('sitting', 26)\
        .eq('voting_number', 48)\
        .execute()
        
    if not response.data:
        print("Vote not found in DB!")
        return
        
    vote = response.data[0]
    print(f"Vote Found: {vote}")
    
    # Check keywords match
    text_content = (vote.get('title_clean') or '') + " " + (vote.get('title_raw') or '')
    text_content = text_content.lower()
    keywords = ['zdrow', 'szpital', 'medy', 'lekar', 'pielęgniar', 'pacjen', 'leków', 'refundac']
    
    matched = [k for k in keywords if k in text_content]
    print(f"Keywords matched: {matched}")
    
    # 2. Check Analysis
    analysis_response = supabase.table('vote_analyses')\
        .select('*')\
        .eq('vote_id', vote['id'])\
        .execute()
        
    if analysis_response.data:
        print("Analysis FOUND in DB:")
        print(analysis_response.data[0])
    else:
        print("Analysis NOT found in DB.")

if __name__ == "__main__":
    debug_vote()
