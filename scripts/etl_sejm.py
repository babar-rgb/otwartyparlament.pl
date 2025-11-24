import os
import requests
import re
import time
from supabase import create_client, Client
from datetime import datetime

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

# --- UTILS ---

def clean_title(raw_title):
    if not raw_title: return ""
    clean = raw_title
    clean = re.sub(r'^(Pkt\.|Punkt)\s*\d+\.?\s*', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\s*\(druki?\s*nr.*?\)$', '', clean, flags=re.IGNORECASE)
    if re.match(r'^1\.\s*posiedzenie', clean, flags=re.IGNORECASE):
        return "Sprawy Regulaminowe / Posiedzenie Sejmu"
    return clean.strip()

def categorize_vote(title):
    title_lower = title.lower()
    keywords = {
        'ZDROWIE': ['zdrowie', 'szpital', 'lekarz', 'pacjent', 'leków', 'medyc', 'in vitro'],
        'GOSPODARKA': ['podatek', 'vat', 'budżet', 'finans', 'bank', 'pieniądz', 'akcyz', 'dochod'],
        'ROLNICTWO': ['roln', 'wieś', 'pasz', 'zboż', 'hodowla', 'zwierząt', 'koł gospodyń'],
        'EDUKACJA': ['szkoł', 'edukacj', 'naucz', 'oświat', 'uczelni', 'student'],
        'OBRONNOŚĆ': ['wojsk', 'obron', 'armi', 'żołnierz', 'granica'],
        'SPRAWIEDLIWOŚĆ': ['sąd', 'praw', 'karn', 'kodeks', 'ustaw', 'trybunał', 'więzien'],
        'INFRASTRUKTURA': ['drog', 'kolej', 'mieszkan', 'budow', 'transport'],
        'ENERGETYKA': ['energi', 'prąd', 'węgiel', 'gaz', 'elektrown', 'oze'],
        'TECHNOLOGIA': ['cyfryzacj', 'internet', 'komputer', 'technolog'],
        'POLITYKA SPOŁECZNA': ['rodzin', 'dziec', 'senior', 'emeryt', 'socjal', 'pomoc'],
        'SPRAWY ZAGRANICZNE': ['zagranic', 'uni', 'europej', 'ukrain', 'nato'],
        'KULTURA': ['kultur', 'sztuk', 'muzeum', 'artyst', 'dziedzictw']
    }
    
    for category, keys in keywords.items():
        if any(k in title_lower for k in keys):
            return category
    return 'INNE'

def map_vote_value(api_value):
    mapping = {
        1: 'YES',
        2: 'NO',
        3: 'ABSTAIN',
        4: 'ABSENT'
    }
    if isinstance(api_value, int):
        return mapping.get(api_value, 'PRESENT')
    
    val_str = str(api_value).upper()
    if val_str == 'YES': return 'YES'
    if val_str == 'NO': return 'NO'
    if val_str == 'ABSTAIN': return 'ABSTAIN'
    if val_str == 'ABSENT': return 'ABSENT'
    return 'PRESENT'

# --- ETL FUNCTIONS ---

def fetch_all_sittings():
    print("Fetching all sittings from /proceedings...")
    try:
        response = requests.get(f"{SEJM_API_URL}/proceedings")
        if response.status_code != 200:
            print(f"Error fetching proceedings: {response.status_code}")
            return []
        data = response.json()
        sittings = sorted([item['number'] for item in data])
        print(f"Found {len(sittings)} sittings: {sittings}")
        return sittings
    except Exception as e:
        print(f"Exception fetching proceedings: {e}")
        return []

def sync_mps():
    print("Fetching MPs...")
    try:
        response = requests.get(f"{SEJM_API_URL}/MP")
        mps_data = response.json()
        print(f"Found {len(mps_data)} MPs. Syncing to DB...")
        
        mps_to_upsert = []
        for mp in mps_data:
            mp_record = {
                "id": mp['id'],
                "name": f"{mp['firstName']} {mp['lastName']}",
                "party": mp.get('club', 'Niezrzeszony'),
                "district": f"Okręg {mp.get('districtNum', 0)}",
                "photo_url": f"https://api.sejm.gov.pl/sejm/term10/MP/{mp['id']}/photo",
                "active": mp.get('active', True),
                "stats_attendance": 0, 
                "stats_rebellion": 0
            }
            mps_to_upsert.append(mp_record)
            
        supabase.table('mps').upsert(mps_to_upsert).execute()
        print(f"Upserted {len(mps_to_upsert)} MPs.")
    except Exception as e:
        print(f"Error syncing MPs: {e}")

def process_sitting(sitting_num):
    print(f"\n--- Processing Sitting {sitting_num} ---")
    
    try:
        response = requests.get(f"{SEJM_API_URL}/votings/{sitting_num}")
        if response.status_code != 200:
            print(f"Failed to fetch votes for sitting {sitting_num}: {response.status_code}")
            return

        votes_data = response.json()
        print(f"Found {len(votes_data)} votes in sitting {sitting_num}.")
        
        results_buffer = []
        BUFFER_SIZE = 2000
        
        for i, vote in enumerate(votes_data):
            try:
                time.sleep(0.05) 
                
                title_raw = vote['title']
                title_clean = clean_title(title_raw)
                category = categorize_vote(title_clean)
                verdict = "PRZYJĘTO" if vote['yes'] > vote['no'] else "ODRZUCONO"
                vote_id = sitting_num * 10000 + vote['votingNumber']
                
                vote_record = {
                    "id": vote_id,
                    "sitting": sitting_num,
                    "voting_number": vote['votingNumber'],
                    "date": vote['date'],
                    "title_raw": title_raw,
                    "title_clean": title_clean,
                    "category": category,
                    "verdict": verdict,
                    "details_json": {
                        "kind": vote.get('kind', ''), 
                        "topic": vote.get('topic', ''),
                        "yes": vote.get('yes', 0),
                        "no": vote.get('no', 0),
                        "abstain": vote.get('abstain', 0)
                    }
                }
                
                supabase.table('votes').upsert(vote_record).execute()
                
                # Fetch Individual Results with Retry Logic
                mp_votes = []
                retries = 3
                while retries > 0:
                    details_resp = requests.get(f"{SEJM_API_URL}/votings/{sitting_num}/{vote['votingNumber']}")
                    if details_resp.status_code == 200:
                        details = details_resp.json()
                        mp_votes = details.get('votes', [])
                        if len(mp_votes) > 0:
                            break # Success
                        else:
                            print(f"  WARNING: Vote {vote['votingNumber']} returned 0 votes. Retrying ({retries} left)...")
                    else:
                        print(f"  API Error {details_resp.status_code} for vote {vote['votingNumber']}. Retrying ({retries} left)...")
                    
                    retries -= 1
                    time.sleep(1)
                
                # Validation
                if len(mp_votes) < 450:
                    print(f"  WARNING: Sitting {sitting_num}, Vote {vote['votingNumber']}: Only {len(mp_votes)} individual decisions fetched (Potential Data Loss).")
                
                if len(mp_votes) == 0:
                     print(f"  ERROR: Sitting {sitting_num}, Vote {vote['votingNumber']}: FAILED to fetch individual decisions after retries. Skipping results.")
                     continue

                # Process Results
                for v in mp_votes:
                    mp_id = v.get('MP')
                    if not mp_id: continue
                    
                    raw_vote = v.get('vote')
                    mapped_vote = map_vote_value(raw_vote)
                    
                    result_record = {
                        "vote_id": vote_id,
                        "mp_id": mp_id,
                        "vote": mapped_vote,
                        "rebel": False # Simplified for mass ingest speed, can recalculate later
                    }
                    results_buffer.append(result_record)
                    
                    if len(results_buffer) >= BUFFER_SIZE:
                        print(f"  Sitting {sitting_num}, Vote {vote['votingNumber']}: Buffer full ({len(results_buffer)}). Bulk inserting...")
                        supabase.table('vote_results').upsert(results_buffer, on_conflict='vote_id, mp_id').execute()
                        results_buffer = []

                print(f"  Sitting {sitting_num}, Vote {vote['votingNumber']}: Fetched {len(mp_votes)} individual decisions. Saved to DB.")

            except Exception as e:
                print(f"  ERROR processing vote {vote.get('votingNumber', '?')}: {e}")
                continue

        if results_buffer:
            print(f"  Flushing remaining {len(results_buffer)} records...")
            supabase.table('vote_results').upsert(results_buffer, on_conflict='vote_id, mp_id').execute()
            
        print(f"Sitting {sitting_num} complete.")

    except Exception as e:
        print(f"CRITICAL ERROR processing sitting {sitting_num}: {e}")

# --- MAIN ---
if __name__ == "__main__":
    print("Starting Operation DEEP ARCHIVE (Granular Ingest)...")
    sync_mps()
    sittings = fetch_all_sittings()
    for sitting in sittings:
        process_sitting(sitting)
    print("\nMISSION COMPLETE. All data ingested.")
