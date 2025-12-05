import requests
import json
import os
import time
import concurrent.futures
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import google.generativeai as genai

# Env Loading
load_dotenv()
# Fallback to manual if needed (legacy safeguard)
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
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("CRITICAL: Missing Supabase Credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY missing. AI scoring will be skipped.")

# Constants
TARGET_YEARS = [2024, 2023, 2022, 2021, 2020, 2019]
TERM_10_START = "2024-07-16"

# Global Set of Polish MEPs
POLISH_MEP_IDS = set()

def get_polish_mep_ids():
    print("Fetching Polish MEPs from DB...")
    # Fetch ALL (Term 9 and 10 ideally, currently likely just Term 10 in DB)
    # Ideally should fetch historic MEPs too, but for filtering we take what we have.
    response = supabase.table('euro_meps').select('api_id').execute()
    ids = set()
    for row in response.data:
        ids.add(row['api_id'])
    print(f"Loaded {len(ids)} Polish MEP IDs.")
    return ids

def fetch_details(url):
    """Fetches JSON-LD details from a given URL with retries."""
    for attempt in range(3):
        try:
            r = requests.get(url, headers={'Accept': 'application/ld+json'}, timeout=45)
            if r.status_code == 200:
                try:
                    return r.json()
                except ValueError:
                    return None
            elif r.status_code == 404:
                return None
            else:
                time.sleep(1)
        except Exception:
            time.sleep(1)
    return None

def determine_term(date_str):
    """Returns 9 or 10 based on date cutoff (2024-07-16)."""
    if not date_str: return 10 # Default
    try:
        if date_str >= TERM_10_START:
            return 10
        return 9
    except:
        return 10

def calculate_importance(title, votes_for, votes_against):
    """
    Calculates importance score (0-100) and is_key_vote status.
    """
    title_lower = title.lower()
    
    # 1. Negative Keywords (Noise Filter)
    exclude_terms = ["składu komisji", "porządku dziennego", "upamiętnienia", "patrona", "sekretarza", "sprawozdanie z działalności", "mianowania", "uchylenie immunitetu"]
    if any(term in title_lower for term in exclude_terms):
        return 0, False

    # 2. Controversy Score (Math)
    total_votes = votes_for + votes_against
    if total_votes < 10:
        return 10, False 
        
    diff = abs(votes_for - votes_against)
    ratio = diff / total_votes 
    
    # Invert so 1 = Split, 0 = Unanimous
    controversy_factor = 1.0 - ratio 
    math_score = int(controversy_factor * 100)
    
    # 3. AI Filter
    ai_score = 0
    is_hot = False
    
    if GEMINI_API_KEY and math_score > 30: 
        try:
            model = genai.GenerativeModel('gemini-pro')
            prompt = f"""
            Rate the social impact of this European Parliament vote on a scale of 0-100. Is it a 'Hot Topic' in Poland or Europe?
            Title: "{title}"
            Return JSON only: {{ "score": number, "is_hot": boolean }}
            """
            response = model.generate_content(prompt)
            text = response.text.strip()
            if text.startswith("```"): text = text.split("```")[1].replace("json", "").strip()
            
            data = json.loads(text)
            ai_score = data.get("score", 0)
            is_hot = data.get("is_hot", False)
        except Exception as e:
            pass
            
    final_score = max(math_score, ai_score)
    if is_hot: final_score = max(final_score, 85)
    is_key = final_score >= 75
    return final_score, is_key

def process_vote_result(vote_id, vote_uri):
    # 1. Fetch Details
    url = f"https://data.europarl.europa.eu/eli/dl/event/{vote_id}?format=application%2Fld%2Bjson"
    data_env = fetch_details(url)
    
    if not data_env or 'data' not in data_env or not data_env['data']:
        return

    vote_data = data_env['data'][0]
    
    # Extract Metadata
    title = "Głosowanie"
    ref_text = vote_data.get('referenceText', {})
    if isinstance(ref_text, dict):
        title = ref_text.get('pl') or ref_text.get('en') or title
    
    if title == "Głosowanie":
        label = vote_data.get('label', {})
        if isinstance(label, dict):
            title = label.get('pl') or label.get('en') or title
            
    if isinstance(title, list): title = title[0]
            
    # Date
    date_str = vote_data.get('activity_date')
    if not date_str:
        parts = vote_id.split('-')
        if len(parts) >= 5:
            try:
                date_str = f"{parts[2]}-{parts[3]}-{parts[4]}"
            except: pass
            
    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")

    # TERM Logic
    term = determine_term(date_str)

    # Counts
    votes_for = int(vote_data.get('number_of_votes_favor', 0))
    votes_against = int(vote_data.get('number_of_votes_against', 0))
    votes_abstain = int(vote_data.get('number_of_votes_abstention', 0))

    # CALCULATE IMPORTANCE
    importance_score, is_key_vote = calculate_importance(str(title), votes_for, votes_against)

    # UPSERT Vote
    vote_record = {
        "id": vote_id,
        "title": str(title)[:500],
        "date": date_str,
        "votes_for": votes_for,
        "votes_against": votes_against,
        "votes_abstain": votes_abstain,
        "importance_score": importance_score,
        "is_key_vote": is_key_vote,
        "term": term
    }
    
    try:
        supabase.table('euro_votes').upsert(vote_record).execute()
        if is_key_vote:
            print(f"  🔥 KEY VOTE Found (Term {term}): {title[:50]}... (Score: {importance_score})")
    except Exception as e:
        # Fallback (legacy schema support if partial)
        if 'column' in str(e):
             del vote_record['term']
             try: supabase.table('euro_votes').upsert(vote_record).execute()
             except: pass
        return

    # Process Individual Voters (Polish Only)
    results_to_insert = []
    
    def extract_id(person_str):
        if not person_str: return None
        try:
            return int(person_str.split('/')[-1])
        except: return None

    def get_list(obj, key):
        val = obj.get(key, [])
        if isinstance(val, list): return val
        return [val]

    for p_str in get_list(vote_data, 'had_voter_favor'):
        pid = extract_id(p_str)
        if pid in POLISH_MEP_IDS: results_to_insert.append({"vote_id": vote_id, "mep_id": pid, "vote": "For"})
            
    for p_str in get_list(vote_data, 'had_voter_against'):
        pid = extract_id(p_str)
        if pid in POLISH_MEP_IDS: results_to_insert.append({"vote_id": vote_id, "mep_id": pid, "vote": "Against"})
            
    for p_str in get_list(vote_data, 'had_voter_abstain'):
        pid = extract_id(p_str)
        if pid in POLISH_MEP_IDS: results_to_insert.append({"vote_id": vote_id, "mep_id": pid, "vote": "Abstain"})

    if results_to_insert:
        try:
            supabase.table('euro_vote_results').delete().eq('vote_id', vote_id).execute()
            supabase.table('euro_vote_results').insert(results_to_insert).execute()
        except Exception as e:
            pass

def process_session(session):
    sid = session.get('id')
    clean_sid = sid.split('/')[-1]
    
    detail_url = f"https://data.europarl.europa.eu/api/v1/meetings/{clean_sid}?format=application%2Fld%2Bjson"
    s_data = fetch_details(detail_url)
    
    if not s_data or 'data' not in s_data or not s_data['data']:
        return

    session_obj = s_data['data'][0]
    
    activities = session_obj.get('consists_of') or session_obj.get('consistsOf') or session_obj.get('hasPart') or []
    if not isinstance(activities, list): activities = [activities]
    
    for act in activities:
        if isinstance(act, str): continue
        if not isinstance(act, dict): continue

        sub_items = act.get('consists_of') or act.get('consistsOf') or []
        if isinstance(sub_items, str): sub_items = [sub_items]
        
        if sub_items:
             for vote_uri in sub_items:
                 if isinstance(vote_uri, str):
                     parts = vote_uri.split('/')
                     vid = parts[-1]
                     if '-' in vid:
                         process_vote_result(vid, vote_uri)

def run_etl():
    print("=== STARTING EURO VOTE DOWNLOAD (2019-2024) ===")
    global POLISH_MEP_IDS
    POLISH_MEP_IDS = get_polish_mep_ids()
    
    for year in TARGET_YEARS:
        print(f"\nProcessing YEAR: {year}...")
        api_url = f"https://data.europarl.europa.eu/api/v1/meetings?year={year}&format=application%2Fld%2Bjson&limit=500" # Limit 500 per year
        
        try:
            r = requests.get(api_url)
            data = r.json()
            sessions = data.get('data', [])
            print(f"Found {len(sessions)} sessions in {year}. Processing...")
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
                futures = {executor.submit(process_session, s): s for s in sessions}
                for future in concurrent.futures.as_completed(futures):
                    try: future.result()
                    except: pass
                    
        except Exception as e:
            print(f"Error fetching year {year}: {e}")
                
    print("=== ETL COMPLETE ===")

if __name__ == "__main__":
    run_etl()
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
    """Fetches JSON-LD details from a given URL with retries."""
    for attempt in range(5): # Increased to 5 attempts
        try:
            r = requests.get(url, headers={'Accept': 'application/ld+json'}, timeout=30) # Increased timeout to 30s
            if r.status_code == 200:
                try:
                    return r.json()
                except ValueError:
                    print(f"JSON Decode Error for {url}")
                    return None
            elif r.status_code == 404:
                return None
            else:
                # print(f"Status {r.status_code} for {url}. Retrying...")
                time.sleep(2 * (attempt + 1)) # Backoff: 2, 4, 6, 8...
        except Exception as e:
            print(f"Request error {url}: {e} (Attempt {attempt+1}/5)")
            time.sleep(2 * (attempt + 1))
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
                
                # KEY VOTE HEURISTIC
                # Filter by title keywords to ensure we only get important legislation
                title_pl = label.lower()
                keywords = ["rozporządzenie", "dyrektywa", "decyzja", "akt", "regulation", "directive", "act"]
                is_legislative = any(k in title_pl for k in keywords)
                
                # Also ignore common technical strings if needed
                ignore_terms = ["mianowania", "uchylenie immunitetu", "wniosek o", "appointment of", "request for waiver"]
                is_ignored = any(t in title_pl for t in ignore_terms)
                
                if is_legislative and not is_ignored:
                    print(f"[{sid}] Found KEY LEGISLATIVE VOTE: {label}")
                    print(f" -> Found {len(sub_items)} sub-votes.")
                    
                    for vote_uri in sub_items:
                        parts = vote_uri.split('/')
                        vid = parts[-1]
                        process_vote_result(vid, vote_uri)
                else:
                    # print(f"Skipping non-legislative/technical vote: {label}")
                    pass

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
