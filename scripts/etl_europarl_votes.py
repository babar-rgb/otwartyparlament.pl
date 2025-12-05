import requests
import json
import os
import time
from datetime import datetime
from supabase import create_client, Client

# Configuration
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

# Constants
YEAR = 2024
LIMIT_SESSIONS = 1000 # Fetch ALL sessions
SESSIONS_API = f"https://data.europarl.europa.eu/api/v1/meetings?year={YEAR}&format=application%2Fld%2Bjson&limit={LIMIT_SESSIONS}"

def get_polish_mep_ids():
    """Fetches all active Polish MEP api_ids from our DB to filter votes."""
    print("Fetching Polish MEPs from DB...")
    response = supabase.table('euro_meps').select('api_id').execute()
    ids = set()
    for row in response.data:
        ids.add(row['api_id'])
    print(f"Loaded {len(ids)} Polish MEP IDs.")
    return ids

POLISH_MEP_IDS = set()

def fetch_details(url):
    """Helper to fetch JSON-LD with retries."""
    for i in range(3):
        try:
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                return r.json()
            elif r.status_code == 404:
                return None
        except Exception as e:
            print(f"Request error {url}: {e}")
            time.sleep(1)
    return None

def process_vote_result(vote_id, vote_uri):
    """Fetches details of a single vote and saves to DB."""
    # Resolve ELI URI
    # format: https://data.europarl.europa.eu/eli/dl/event/{ID}?format=application%2Fld%2Bjson
    # URL is often: https://data.europarl.europa.eu/eli/dl/event/MTG-PL-2024-01-15-DEC-163200?format=application%2Fld%2Bjson
    
    # Check if exists to skip? (Optional, but good for speed)
    # res = supabase.table('euro_votes').select('id').eq('id', vote_id).execute()
    # if res.data:
    #     print(f"Vote {vote_id} already exists. Skipping.")
    #     return
    
    url = f"https://data.europarl.europa.eu/eli/dl/event/{vote_id}?format=application%2Fld%2Bjson"
    data_env = fetch_details(url)
    
    if not data_env or 'data' not in data_env:
        print(f"Failed to fetch details for {vote_id}")
        return

    # Data is usually a list under 'data'
    items = data_env['data']
    if not items: 
        return
        
    vote_data = items[0]
    
    # 1. Extract Metadata
    # Title logic: try 'label' (dict) or 'referenceText' (dict) -> 'pl' then 'en'
    title = "Głosowanie bez tytułu"
    
    ref_text = vote_data.get('referenceText', {})
    if isinstance(ref_text, dict):
        title = ref_text.get('pl') or ref_text.get('en') or title
    
    # If title is still generic, try label
    if title == "Głosowanie bez tytułu":
        label = vote_data.get('label', {})
        if isinstance(label, dict):
            title = label.get('pl') or label.get('en') or title
            
    # Date
    date_str = vote_data.get('activity_date') # e.g. "2024-01-15"
    if not date_str:
        # try ID parsing
        # MTG-PL-2024-01-15...
        parts = vote_id.split('-')
        if len(parts) >= 5:
            date_str = f"{parts[2]}-{parts[3]}-{parts[4]}"
            
    # Counts
    votes_for = vote_data.get('number_of_votes_favor', 0)
    votes_against = vote_data.get('number_of_votes_against', 0)
    votes_abstain = vote_data.get('number_of_votes_abstention', 0)

    # 2. Upsert Vote Metadata
    vote_record = {
        "id": vote_id,
        "title": title,
        "date": date_str,
        "votes_for": votes_for,
        "votes_against": votes_against,
        "votes_abstain": votes_abstain
    }
    
    try:
        supabase.table('euro_votes').upsert(vote_record).execute()
        print(f"Saved Vote: {title[:50]}...")
    except Exception as e:
        print(f"Error saving vote meta {vote_id}: {e}")
        return

    # 3. Process Individual Records (Roll Call)
    # had_voter_favor: ["person/123", "person/456", ...]
    results_to_insert = []
    
    def extract_id(person_str):
        if not person_str: return None
        return int(person_str.replace("person/", ""))

    for p_str in vote_data.get('had_voter_favor', []):
        pid = extract_id(p_str)
        if pid in POLISH_MEP_IDS:
            results_to_insert.append({"vote_id": vote_id, "mep_id": pid, "vote": "For"})
            
    for p_str in vote_data.get('had_voter_against', []):
        pid = extract_id(p_str)
        if pid in POLISH_MEP_IDS:
            results_to_insert.append({"vote_id": vote_id, "mep_id": pid, "vote": "Against"})
            
    for p_str in vote_data.get('had_voter_abstain', []):
        pid = extract_id(p_str)
        if pid in POLISH_MEP_IDS:
            results_to_insert.append({"vote_id": vote_id, "mep_id": pid, "vote": "Abstain"})
            
    # Also handle excused/absent if available?
    # 'had_excused_person'? 
    # For now simplicity: For/Against/Abstain.
    
    if results_to_insert:
        try:
            # Delete existing first to avoid dupes? Or use upsert with conflict?
            # euro_vote_results has ID PK, so upsert needs PK. 
            # We can delete by vote_id + mep_id manual check or just delete all for this vote first.
            supabase.table('euro_vote_results').delete().eq('vote_id', vote_id).execute()
            
            supabase.table('euro_vote_results').insert(results_to_insert).execute()
            print(f" -> Saved {len(results_to_insert)} Polish MEP results.")
        except Exception as e:
            print(f"Error saving results for {vote_id}: {e}")

def run_etl():
    print("Starting Europarl Votes ETL...")
    global POLISH_MEP_IDS
    POLISH_MEP_IDS = get_polish_mep_ids()
    
    # 1. Fetch Sessions
    print(f"Fetching last {LIMIT_SESSIONS} sessions...")
    try:
        r = requests.get(SESSIONS_API)
        data = r.json()
    except Exception as e:
        print(f"API Error: {e}")
        return
        
    sessions = data.get('data', [])
    print(f"Found {len(sessions)} sessions.")
    
import concurrent.futures

# ... existing imports ...

# ... existing functions ...

def process_session(session):
    sid = session.get('id')
    print(f"Processing Session: {sid}")
    
    # Strategy Change: List view might not have 'consists_of'. 
    # We probably need to fetch details for each session if 'consists_of' is missing.
    activities = session.get('consists_of') or session.get('consistsOf') or session.get('hasPart')
    
    if not activities:
            clean_id = sid.split('/')[-1] # MTG-PL-2024-01-15
            detail_url = f"https://data.europarl.europa.eu/api/v1/meetings/{clean_id}?format=application%2Fld%2Bjson"
            
            s_data = fetch_details(detail_url)
            if s_data and 'data' in s_data and s_data['data']:
                activities = s_data['data'][0].get('consists_of') or []
            else:
                activities = []
    
    activities = activities or []
    
    for act in activities:
        atype = act.get('had_activity_type')
        label = act.get('label', {}).get('pl') or act.get('activity_label', {}).get('pl') or ""
        
        is_voting_time = 'VOTE' in str(atype) or 'VOTING' in str(atype) or 'Głosowanie' in label
        
        if is_voting_time:
                sub_items = act.get('consists_of') or act.get('consistsOf') or []
                print(f"[{sid}] Found Voting Time with {len(sub_items)} votes.")
                
                for vote_uri in sub_items:
                    parts = vote_uri.split('/')
                    vid = parts[-1]
                    process_vote_result(vid, vote_uri)

def run_etl():
    print("Starting Europarl Votes ETL (Multi-threaded)...")
    global POLISH_MEP_IDS
    POLISH_MEP_IDS = get_polish_mep_ids()
    
    # 1. Fetch Sessions
    print(f"Fetching last {LIMIT_SESSIONS} sessions...")
    try:
        r = requests.get(SESSIONS_API)
        data = r.json()
    except Exception as e:
        print(f"API Error: {e}")
        return
        
    sessions = data.get('data', [])
    print(f"Found {len(sessions)} sessions. Starting parallel processing...")
    
    # Use ThreadPool to process sessions in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        executor.map(process_session, sessions)

    print("ETL Finished.")

if __name__ == "__main__":
    run_etl()
