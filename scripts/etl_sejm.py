import os
import requests
import re
import time
from supabase import create_client, Client
from datetime import datetime

# --- CONFIGURATION ---
# Manually load .env
try:
    with open('.env') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'): continue
            if '=' in line:
                key, value = line.split('=', 1)
                if not os.environ.get(key):
                    os.environ[key] = value.strip("'").strip('"')
except Exception:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Multi-Term Config
TARGET_TERMS = [10]
BASE_API_URL = "https://api.sejm.gov.pl/sejm"

# --- UTILS ---

from keyword_map import CATEGORY_KEYWORDS

def clean_title(raw_title):
    if not raw_title: return ""
    clean = raw_title
    clean = re.sub(r'^(Pkt\.|Punkt)\s*\d+\.?\s*', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\s*\(druki?\s*nr.*?\)$', '', clean, flags=re.IGNORECASE)
    if re.match(r'^1\.\s*posiedzenie', clean, flags=re.IGNORECASE):
        return "Sprawy Regulaminowe / Posiedzenie Sejmu"
    return clean.strip()

def classify_vote(title):
    """
    Advanced NLP classifier for Sejm bills based on titles.
    Uses scoring algorithm with stemming check and procedural filters.
    """
    if not title:
        return 'INNE'
        
    title_lower = title.lower()
    
    # Procedural Filter
    if any(title_lower.startswith(prefix) for prefix in ["wybór", "powołanie", "odwołanie", "zmiany w składach"]):
        return "PERSONALNE/PROCEDURALNE"
        
    if any(keyword in title_lower for keyword in ["upamiętnienia", "dnia", "rocznicy"]):
        return "SYMBOLICZNE"
    
    # Scoring Algorithm
    scores = {category: 0 for category in CATEGORY_KEYWORDS.keys()}
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in title_lower:
                scores[category] += 1
                # Bonus for "zmiana ustawy o [keyword]"
                if f"zmiana ustawy o {keyword}" in title_lower:
                    scores[category] += 2
                    
    # Find category with highest score
    best_category = max(scores, key=scores.get)
    
    if scores[best_category] > 0:
        return best_category
        
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

def calculate_importance(title, yes_count, no_count):
    """
    Calculate importance score (0-100) for a vote based on:
    1. Keyword analysis (impact factor)
    2. Controversy analysis (fight factor)
    """
    score = 0
    title_lower = title.lower()
    
    # HIGH IMPACT keywords (+50 points each)
    HIGH_IMPACT = ['podatek', 'vat', 'budżet', 'aborcja', 'konstytucja', 
                   'trybunał', 'sąd najwyższy', 'obronność', 'pieniądz', 
                   'składk', 'zus', 'in vitro', 'ustawa budżetowa']
    
    # LOW IMPACT keywords (-20 points each)
    LOW_IMPACT = ['upamiętnienie', 'patron', 'dzień', 'zmiana nazwy', 
                  'regulamin', 'sprawozdanie']
    
    # Keyword scoring
    for keyword in HIGH_IMPACT:
        if keyword in title_lower:
            score += 50
            break  # Only count once
    
    for keyword in LOW_IMPACT:
        if keyword in title_lower:
            score -= 20
            break
    
    # Controversy scoring (based on vote split)
    total_votes = yes_count + no_count
    if total_votes > 0:
        diff = abs(yes_count - no_count)
        
        if diff < 10:  # Extremely close (within 10 votes)
            score += 40
        elif diff < 30:  # Very close (within 30 votes)
            score += 20
        elif diff > 400:  # Unanimous (boring)
            score -= 10
    
    # Normalize to 0-100
    score = max(0, min(100, score))
    
    return score

# --- ETL FUNCTIONS ---

def fetch_all_sittings(term):
    print(f"Fetching sittings for Term {term}...")
    try:
        response = requests.get(f"{BASE_API_URL}/term{term}/proceedings")
        if response.status_code != 200:
            print(f"Error fetching proceedings for term {term}: {response.status_code}")
            return []
        data = response.json()
        sittings = sorted([item['number'] for item in data])
        print(f"Found {len(sittings)} sittings in Term {term}: {sittings}")
        return sittings
    except Exception as e:
        print(f"Exception fetching proceedings: {e}")
        return []

def sync_mps(term):
    print(f"Fetching MPs for Term {term}...")
    try:
        response = requests.get(f"{BASE_API_URL}/term{term}/MP")
        # List endpoint might not have numberOfSeat, let's verification fetch
        mps_list = response.json()
        print(f"Found {len(mps_list)} MPs in Term {term}. Syncing to DB...")
        
        mps_to_upsert = []
        for i, mp_summary in enumerate(mps_list):
            api_id = mp_summary['id']
            
            # Fetch details for numberOfSeat
            try:
                # Polite fetching
                # time.sleep(0.05) 
                details_resp = requests.get(f"{BASE_API_URL}/term{term}/MP/{api_id}")
                if details_resp.status_code == 200:
                    mp_details = details_resp.json()
                    seat_num = mp_details.get('numberOfSeat')
                else:
                    print(f"  [Warn] Failed to fetch details for MP {api_id}")
                    seat_num = None
            except Exception as e:
                print(f"  [Error] fetching MP details {api_id}: {e}")
                seat_num = None

            if i % 50 == 0:
                print(f"  Processed {i}/{len(mps_list)} MPs...")

            # ID Logic: Term 10 stays original (Backwards Compat), Term 9 gets prefix
            if term == 10:
                db_id = api_id
            else:
                db_id = term * 10000 + api_id

            # Use details if available, else fallback to summary
            mp_source = mp_details if 'mp_details' in locals() and mp_details else mp_summary

            mp_record = {
                "id": db_id,
                "name": f"{mp_source['firstName']} {mp_source['lastName']}",
                "party": mp_source.get('club', 'Niezrzeszony'),
                "district": f"Okręg {mp_source.get('districtNum', 0)}",
                "photo_url": f"https://api.sejm.gov.pl/sejm/term{term}/MP/{api_id}/photo",
                "active": mp_source.get('active', True),
                "stats_attendance": 0, 
                "stats_rebellion": 0,
                "term": term,
                "api_id": api_id,
                "seat_number": seat_num
            }
            mps_to_upsert.append(mp_record)
            
        try:
            # Upsert on 'id' (Primary Key)
            # Make sure 'seat_number' is in the schema!
            supabase.table('mps').upsert(mps_to_upsert).execute()
            print(f"Upserted {len(mps_to_upsert)} MPs for Term {term}.")
        except Exception as e:
            print(f"Upsert failed (maybe schema mismatch?): {e}")

    except Exception as e:
        print(f"Error syncing MPs: {e}")

def process_sitting(term, sitting_num):
    print(f"\n--- Processing Term {term}, Sitting {sitting_num} ---")
    
    try:
        response = requests.get(f"{BASE_API_URL}/term{term}/votings/{sitting_num}")
        if response.status_code != 200:
            print(f"Failed to fetch votes for sitting {sitting_num}: {response.status_code}")
            return

        votes_data = response.json()
        print(f"Found {len(votes_data)} votes in Term {term} sitting {sitting_num}.")
        
        results_buffer = []
        BUFFER_SIZE = 2000
        
        for i, vote in enumerate(votes_data):
            try:
                # time.sleep(0.05) 
                
                title_raw = vote['title']
                title_clean = clean_title(title_raw)
                category = classify_vote(title_clean)
                verdict = "PRZYJĘTO" if vote['yes'] > vote['no'] else "ODRZUCONO"
                
                # ID Logic: Term 10 stays original (Sitting * 10000 + Vote), Term 9 gets prefix
                if term == 10:
                    vote_id = sitting_num * 10000 + vote['votingNumber']
                else:
                    vote_id = term * 10000000 + sitting_num * 10000 + vote['votingNumber']
                
                # Calculate importance score
                importance_score = calculate_importance(
                    title_clean, 
                    vote.get('yes', 0), 
                    vote.get('no', 0)
                )
                is_key_vote = importance_score > 60
                
                vote_record = {
                    "id": vote_id,
                    "sitting": sitting_num,
                    "voting_number": vote['votingNumber'],
                    "date": vote['date'],
                    "title_raw": title_raw,
                    "title_clean": title_clean,
                    "category": category,
                    "verdict": verdict,
                    "importance_score": importance_score,
                    "is_key_vote": is_key_vote,
                    "term": term,
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
                    details_resp = requests.get(f"{BASE_API_URL}/term{term}/votings/{sitting_num}/{vote['votingNumber']}")
                    if details_resp.status_code == 200:
                        details = details_resp.json()
                        mp_votes = details.get('votes', [])
                        if len(mp_votes) > 0:
                            break # Success
                        else:
                            # print(f"  WARNING: Vote {vote['votingNumber']} returned 0 votes. Retrying ({retries} left)...")
                            pass
                    
                    retries -= 1
                    time.sleep(1)
                
                # Validation
                if len(mp_votes) < 400: # Lower threshold for past terms
                     pass
                     # print(f"  [Warn] Low vote count: {len(mp_votes)}")

                # Process Results
                for v in mp_votes:
                    mp_api_id = v.get('MP')
                    if not mp_api_id: continue
                    
                    raw_vote = v.get('vote')
                    mapped_vote = map_vote_value(raw_vote)
                    
                    # Map MP ID consistent with sync_mps
                    if term == 10:
                        db_mp_id = mp_api_id
                    else:
                        db_mp_id = term * 10000 + mp_api_id
                    
                    result_record = {
                        "vote_id": vote_id,
                        "mp_id": db_mp_id, # This refers to API ID.
                        "vote": mapped_vote,
                        "rebel": False
                    }
                    results_buffer.append(result_record)
                    
                    if len(results_buffer) >= BUFFER_SIZE:
                        # print(f"  Sitting {sitting_num}, Vote {vote['votingNumber']}: Bulk inserting...")
                        supabase.table('vote_results').upsert(results_buffer, on_conflict='vote_id, mp_id').execute()
                        results_buffer = []

                # print(f"  Vote {vote_id} processed.")

            except Exception as e:
                print(f"  ERROR processing vote {vote.get('votingNumber', '?')}: {e}")
                continue

        if results_buffer:
            supabase.table('vote_results').upsert(results_buffer, on_conflict='vote_id, mp_id').execute()
            
        print(f"Sitting {sitting_num} complete.")

    except Exception as e:
        print(f"CRITICAL ERROR processing sitting {sitting_num}: {e}")

def update_existing_categories():
    print("Updating categories for existing votes in DB...")
    try:
        # Fetch all votes (pagination might be needed for large datasets, but start simple)
        response = supabase.table('votes').select('*').execute()
        votes = response.data
        print(f"Found {len(votes)} votes in DB.")
        
        updated_count = 0
        for vote in votes:
            title_raw = vote.get('title_raw') or vote.get('title')
            if not title_raw:
                continue
                
            title_clean = clean_title(title_raw)
            new_category = classify_vote(title_clean)
            
            # Update if category is different or missing
            if vote.get('category') != new_category:
                print(f"Updating Vote {vote['id']}: {new_category}")
                supabase.table('votes').update({'category': new_category}).eq('id', vote['id']).execute()
                updated_count += 1
                
        print(f"Done. Updated {updated_count} votes.")
        
    except Exception as e:
        print(f"Error updating categories: {e}")

# --- MAIN ---
if __name__ == "__main__":
    import sys
    
    print("Starting Multi-Term Data Ingest...")
    
    if len(sys.argv) > 1 and sys.argv[1] == "--update-categories":
        update_existing_categories()
    else:
        for term in TARGET_TERMS:
            print(f"\\n=== Processing Term {term} ===")
            sync_mps(term)
            sittings = fetch_all_sittings(term)
            for sitting in sittings:
                process_sitting(term, sitting)
                
        print("\\nMISSION COMPLETE. All terms ingested.")
