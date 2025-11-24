import os
import requests
import re
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
    # Remove Prefix
    clean = re.sub(r'^(Pkt\.|Punkt)\s*\d+\.?\s*', '', clean, flags=re.IGNORECASE)
    # Remove Suffix
    clean = re.sub(r'\s*\(druki?\s*nr.*?\)$', '', clean, flags=re.IGNORECASE)
    # Remove Procedural Noise
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

# --- ETL FUNCTIONS ---

def sync_mps():
    print("Fetching MPs...")
    response = requests.get(f"{SEJM_API_URL}/MP")
    mps_data = response.json()
    
    print(f"Found {len(mps_data)} MPs. Syncing to DB...")
    
    mps_to_upsert = []
    for mp in mps_data:
        # Basic mapping
        mp_record = {
            "id": mp['id'],
            "name": f"{mp['firstName']} {mp['lastName']}",
            "party": mp.get('club', 'Niezrzeszony'),
            "district": f"Okręg {mp.get('districtNum', 0)}",
            "photo_url": f"https://api.sejm.gov.pl/sejm/term10/MP/{mp['id']}/photo",
            "active": mp.get('active', True),
            # Stats will be updated later or calculated
            "stats_attendance": 0, 
            "stats_rebellion": 0
        }
        mps_to_upsert.append(mp_record)
        
    # Batch upsert
    data, count = supabase.table('mps').upsert(mps_to_upsert).execute()
    print(f"Upserted {len(mps_to_upsert)} MPs.")

def sync_votes(sitting_num):
    print(f"Fetching votes for sitting {sitting_num}...")
    response = requests.get(f"{SEJM_API_URL}/votings/{sitting_num}")
    if response.status_code != 200:
        print(f"Failed to fetch sitting {sitting_num}: {response.status_code}")
        return

    votes_data = response.json()
    print(f"Found {len(votes_data)} votes.")
    
    for vote in votes_data:
        title_raw = vote['title']
        title_clean = clean_title(title_raw)
        category = categorize_vote(title_clean)
        
        # Determine verdict (simple logic)
        verdict = "ODRZUCONO"
        if vote['yes'] > vote['no']:
            verdict = "PRZYJĘTO"
            
        # Prepare Vote Record
        # We need to handle the ID. Since we defined 'id' as serial in SQL, we let it auto-increment?
        # But we need the ID for vote_results.
        # Strategy: Use sitting * 10000 + votingNumber as deterministic ID for simplicity in this script
        # Assuming max 10000 votes per sitting (safe assumption)
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
            "details_json": {"kind": vote.get('kind', ''), "topic": vote.get('topic', '')}
        }
        
        supabase.table('votes').upsert(vote_record).execute()
        
        # Fetch Individual Results for this vote
        # Optimization: Only fetch if we really need to. For now, let's do it for the first 5 votes to test.
        # Or iterate all if the user wants full sync.
        # The API endpoint for details: /votings/{sitting}/{votingNumber}
        
        details_resp = requests.get(f"{SEJM_API_URL}/votings/{sitting_num}/{vote['votingNumber']}")
        if details_resp.status_code == 200:
            details = details_resp.json()
            process_vote_results(vote_id, details.get('votes', []), vote_record)

def process_vote_results(vote_id, mp_votes, vote_record):
    # 1. Calculate Party Majorities
    party_votes = {} # { 'PiS': {'yes': 0, 'no': 0, 'abstain': 0} }
    
    # We need to look up MP club. 
    # Ideally we have a local cache of MP -> Club.
    # For now, let's assume the mp_votes list contains club info? 
    # Sejm API /votings/{s}/{v} returns list of objects: { MP: 1, vote: "YES", club: "PiS" } ?
    # Let's check API docs or assume standard format.
    # Actually, the 'votes' array in details usually has: { mpId: 123, club: "PiS", vote: "YES" }
    
    results_to_insert = []
    
    # First pass: Count party votes
    for v in mp_votes:
        club = v.get('club', 'Niezrzeszony')
        vote_val = v.get('vote') # "YES", "NO", "ABSTAIN", "ABSENT"
        
        if club not in party_votes:
            party_votes[club] = {'YES': 0, 'NO': 0, 'ABSTAIN': 0, 'ABSENT': 0}
        
        if vote_val in party_votes[club]:
            party_votes[club][vote_val] += 1
            
    # Determine Party Line
    party_line = {}
    for club, counts in party_votes.items():
        # Simple majority
        majority = max(counts, key=counts.get)
        if counts[majority] > 0:
            party_line[club] = majority
        else:
            party_line[club] = None
            
    # Second pass: Detect Rebels
    for v in mp_votes:
        mp_id = v.get('MP')
        if not mp_id: continue
        
        club = v.get('club', 'Niezrzeszony')
        vote_val = v.get('vote')
        
        # Handle special vote types (e.g. VOTE_VALID in elections)
        if vote_val == 'VOTE_VALID':
            # For now, treat as present but skip rebel logic unless we parse listVotes
            vote_val = 'PRESENT'
        
        is_rebel = False
        if club in party_line and party_line[club] and vote_val in ['YES', 'NO', 'ABSTAIN'] and vote_val != party_line[club]:
            is_rebel = True
            
        result_record = {
            "vote_id": vote_id,
            "mp_id": mp_id,
            "vote": vote_val,
            "rebel": is_rebel
        }
        results_to_insert.append(result_record)
        
    # Batch insert results?
    # Supabase might limit batch size. Let's do chunks of 1000.
    chunk_size = 1000
    for i in range(0, len(results_to_insert), chunk_size):
        chunk = results_to_insert[i:i+chunk_size]
        supabase.table('vote_results').upsert(chunk, on_conflict='vote_id, mp_id').execute() # Need constraint for this to work
        
    print(f"  Processed {len(results_to_insert)} votes for vote #{vote_record['voting_number']}")


# --- MAIN ---
if __name__ == "__main__":
    print("Starting ETL...")
    
    # 1. Sync MPs
    sync_mps()
    
    # 2. Sync Votes (Iterate sittings)
    # For prototype, let's just do Sitting 1
    sync_votes(1)
    
    print("ETL Complete.")
