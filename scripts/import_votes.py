import os
import requests
import re
import time
from supabase import create_client, Client
from keyword_map import CATEGORY_KEYWORDS

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- UTILS ---

def clean_title(raw_title):
    if not raw_title: return ""
    clean = raw_title
    clean = re.sub(r'^(Pkt\.|Punkt)\s*\d+\.?\s*', '', clean, flags=re.IGNORECASE)
    # We keep the print number info in clean title for context, or remove it?
    # Let's keep it in clean title but maybe normalize it.
    # The original script removed it: clean = re.sub(r'\s*\(druki?\s*nr.*?\)$', '', clean, flags=re.IGNORECASE)
    # Let's keep it for now as it's useful context for the user.
    return clean.strip()

def extract_print_number(title):
    """
    Extracts the print number (numer druku) from the vote title.
    Returns the first found number or None.
    Example: "Głosowanie nad ... (druk nr 55)" -> "55"
    """
    if not title: return None
    
    # Regex to find "druk nr X" or "druki nr X"
    # We prioritize the first one if multiple are present
    match = re.search(r'druki?\s*nr\s*(\d+[a-zA-Z]*)', title, re.IGNORECASE)
    if match:
        return match.group(1)
    return None

def classify_vote(title):
    if not title: return 'INNE'
    title_lower = title.lower()
    
    if any(title_lower.startswith(prefix) for prefix in ["wybór", "powołanie", "odwołanie", "zmiany w składach"]):
        return "PERSONALNE/PROCEDURALNE"
    if any(keyword in title_lower for keyword in ["upamiętnienia", "dnia", "rocznicy"]):
        return "SYMBOLICZNE"
    
    scores = {category: 0 for category in CATEGORY_KEYWORDS.keys()}
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in title_lower:
                scores[category] += 1
                if f"zmiana ustawy o {keyword}" in title_lower:
                    scores[category] += 2
    
    best_category = max(scores, key=scores.get)
    return best_category if scores[best_category] > 0 else 'INNE'

def calculate_importance(title, yes_count, no_count):
    score = 0
    title_lower = title.lower()
    
    HIGH_IMPACT = ['podatek', 'vat', 'budżet', 'aborcja', 'konstytucja', 'trybunał', 'sąd najwyższy', 'obronność', 'pieniądz', 'składk', 'zus', 'in vitro', 'ustawa budżetowa']
    LOW_IMPACT = ['upamiętnienie', 'patron', 'dzień', 'zmiana nazwy', 'regulamin', 'sprawozdanie']
    
    for keyword in HIGH_IMPACT:
        if keyword in title_lower:
            score += 50
            break
    for keyword in LOW_IMPACT:
        if keyword in title_lower:
            score -= 20
            break
            
    total_votes = yes_count + no_count
    if total_votes > 0:
        diff = abs(yes_count - no_count)
        if diff < 10: score += 40
        elif diff < 30: score += 20
        elif diff > 400: score -= 10
        
    return max(0, min(100, score))

def map_vote_value(api_value):
    mapping = {1: 'YES', 2: 'NO', 3: 'ABSTAIN', 4: 'ABSENT'}
    if isinstance(api_value, int): return mapping.get(api_value, 'PRESENT')
    val_str = str(api_value).upper()
    if val_str == 'YES': return 'YES'
    if val_str == 'NO': return 'NO'
    if val_str == 'ABSTAIN': return 'ABSTAIN'
    if val_str == 'ABSENT': return 'ABSENT'
    return 'PRESENT'

# --- ETL ---

def fetch_all_sittings():
    try:
        response = requests.get(f"{SEJM_API_URL}/proceedings")
        if response.status_code != 200: return []
        data = response.json()
        return sorted([item['number'] for item in data])
    except Exception as e:
        print(f"Error fetching proceedings: {e}")
        return []

def process_sitting(sitting_num):
    print(f"\n--- Processing Sitting {sitting_num} ---")
    try:
        response = requests.get(f"{SEJM_API_URL}/votings/{sitting_num}")
        if response.status_code != 200:
            print(f"Failed to fetch votes for sitting {sitting_num}")
            return

        votes_data = response.json()
        print(f"Found {len(votes_data)} votes.")
        
        results_buffer = []
        BUFFER_SIZE = 2000
        
        for vote in votes_data:
            try:
                time.sleep(0.05)
                title_raw = vote['title']
                title_clean = clean_title(title_raw)
                category = classify_vote(title_clean)
                print_number = extract_print_number(title_raw) # EXTRACT LINK HERE
                
                verdict = "PRZYJĘTO" if vote['yes'] > vote['no'] else "ODRZUCONO"
                vote_id = sitting_num * 10000 + vote['votingNumber']
                
                importance_score = calculate_importance(title_clean, vote.get('yes', 0), vote.get('no', 0))
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
                    "print_number": print_number, # SAVE LINK
                    "details_json": {
                        "kind": vote.get('kind', ''), 
                        "topic": vote.get('topic', ''),
                        "yes": vote.get('yes', 0),
                        "no": vote.get('no', 0),
                        "abstain": vote.get('abstain', 0)
                    }
                }
                
                supabase.table('votes').upsert(vote_record).execute()
                
                # Fetch Individual Results
                # Fetch Individual Results (PERSISTENT MODE)
                mp_votes = []
                retry_delay = 1
                
                while True:
                    try:
                        details_resp = requests.get(f"{SEJM_API_URL}/votings/{sitting_num}/{vote['votingNumber']}", timeout=10)
                        if details_resp.status_code == 200:
                            details = details_resp.json()
                            mp_votes = details.get('votes', [])
                            if len(mp_votes) > 0: 
                                break # Success!
                        else:
                            print(f"  ⚠️  API Error {details_resp.status_code}. Retrying in {retry_delay}s...")
                    except Exception as e:
                         print(f"  ⚠️  Connection Error: {e}. Retrying in {retry_delay}s...")
                    
                    # Exponential Backoff (max 60s)
                    time.sleep(retry_delay)
                    retry_delay = min(retry_delay * 2, 60)
                
                # Check for empty results after success (shouldn't happen often if API is good, but good to be safe)
                if not mp_votes:
                    print(f"  ❌ Critical: API returned empty votes list after success. Skipping to avoid bad data.")
                    continue

                for v in mp_votes:
                    mp_id = v.get('MP')
                    if not mp_id: continue
                    result_record = {
                        "vote_id": vote_id,
                        "mp_id": mp_id,
                        "vote": map_vote_value(v.get('vote')),
                        "rebel": False
                    }
                    results_buffer.append(result_record)
                    
                    if len(results_buffer) >= BUFFER_SIZE:
                        supabase.table('vote_results').upsert(results_buffer, on_conflict='vote_id, mp_id').execute()
                        results_buffer = []

                print(f"  Vote {vote['votingNumber']}: Processed (Print: {print_number})")

            except Exception as e:
                print(f"  Error processing vote {vote.get('votingNumber')}: {e}")
                continue

        if results_buffer:
            supabase.table('vote_results').upsert(results_buffer, on_conflict='vote_id, mp_id').execute()

    except Exception as e:
        print(f"Error processing sitting {sitting_num}: {e}")

if __name__ == "__main__":
    print("--- IMPORT VOTES (GŁOSOWANIA) ---")
    sittings = fetch_all_sittings()
    print(f"Sittings to process: {sittings}")
    for sitting in sittings:
        process_sitting(sitting)
    print("--- DONE ---")
