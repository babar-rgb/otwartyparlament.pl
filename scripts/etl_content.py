import os
import requests
import time
from supabase import create_client

# Config
SUPABASE_URL = "http://localhost:5173"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoid2ViX2Fub24ifQ.33U98-wreuo0Qic9lsznlb9mL58v3yHJX_2vf2rcKGk"
API_URL = "https://api.sejm.gov.pl/sejm"
TARGET_TERMS = [9, 10]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_processes(term):
    print(f"Fetching processes for Term {term}...")
    # Fetching more items now, e.g. 500
    url = f"{API_URL}/term{term}/processes?limit=500" 
    try:
        resp = requests.get(url, timeout=30)
        if resp.status_code == 200:
            return resp.json()
        else:
            print(f"Error fetching term {term}: {resp.status_code}")
            return []
    except Exception as e:
        print(f"Exception fetching term {term}: {e}")
        return []

def fetch_sittings(term):
    url = f"{API_URL}/term{term}/proceedings"
    try:
        resp = requests.get(url, timeout=30)
        if resp.status_code == 200:
            return resp.json()
    except:
        pass
    return []

# We need to map MP name to MP ID to link speeches.
# Cache MPs
mp_cache = {}

def get_mp_id(name, term):
    key = f"{name}_{term}"
    if key in mp_cache:
        return mp_cache[key]
    # Fallback / lookup
    # Need to load MPs first
    return None

def load_mps_cache():
    print("Loading MPs cache...")
    try:
        # Fetch all MPs
        res = supabase.table('mps').select('id, name, term').execute()
        for mp in res.data:
            key = f"{mp['name']}_{mp['term']}"
            mp_cache[key] = mp['id']
            
            # Also try flexible matching (First Last vs Last First if needed, but Sejm API usually consistent)
    except Exception as e:
        print(f"Error loading MP cache: {e}")

def ingest_bills():
    print("\n=== Ingesting Bills ===")
    for term in TARGET_TERMS:
        processes = fetch_processes(term)
        print(f"Found {len(processes)} bills for Term {term}.")
        
        batch_size = 100
        total = len(processes)
        
        for i in range(0, total, batch_size):
            batch = processes[i:i+batch_size]
            upsert_data = []
            
            for item in batch:
                print_num = item.get("number")
                if not print_num:
                    continue 

                record = {
                    "id": print_num, 
                    "term": term, # Added Term
                    "ue": item.get("UE") == 'YES',
                    "title": item.get("title"),
                    "description": item.get("description", ""),
                    "print_number": print_num,
                    "process_start_date": item.get("processStartDate"),
                    "change_date": item.get("changeDate"),
                    # "status": item.get("status"), 
                }
                upsert_data.append(record)
            
            if upsert_data:
                try:
                    supabase.table('processes').upsert(upsert_data).execute()
                    print(f"  Upserted batch {i}-{i+len(batch)} for Term {term}")
                except Exception as e:
                    print(f"  Error upserting bills batch: {e}")

def ingest_speeches():
    print("\n=== Ingesting Speeches ===")
    load_mps_cache()
    
    # Only latest term for speeches to save time, or last few sittings
    term = 10
    sittings = fetch_sittings(term)
    # Sort sittings descending
    sittings.sort(key=lambda x: x.get('number'), reverse=True)
    
    # Process last 5 sittings
    target_sittings = sittings[:5] 
    
    for sitting in target_sittings:
        sitting_num = sitting.get('number')
        dates = sitting.get('dates', [])
        print(f"Processing Sitting {sitting_num} ({dates})...")
        
        for date_str in dates:
            # Fetch transcript for this day
            # Endpoint: /term{term}/proceedings/{num}/{date}/transcripts
            url = f"{API_URL}/term{term}/proceedings/{sitting_num}/{date_str}/transcripts"
            try:
                resp = requests.get(url, timeout=30)
                if resp.status_code != 200:
                    continue
                
                transcript_text = resp.text
                # Wait, does the API return JSON or HTML for transcripts?
                # Documentation says /transcripts returns list of statements?
                # Actually usually it returns JSON list of statements.
                data = resp.json()
                statements = data.get('statements', [])
                
                speech_batch = []
                for stmt in statements:
                    # Filter for MP statements (not marshal etc if possible, usually has mpId? or name)
                    # Use 'name' to link
                    speaker = stmt.get('name')
                    if not speaker: continue
                    
                    # Try resolve MP ID using cache
                    mp_id = get_mp_id(speaker, term)
                    if not mp_id:
                        # Try to find partial match
                        # Skipping unlinked for now or inserting with null mp_id
                        pass

                    # Clean content (API usually returns raw text or HTML)
                    content = stmt.get('text', '')
                    
                    # Statement Number
                    num = stmt.get('num')
                    
                    record = {
                        "term": term,
                        "sitting": sitting_num,
                        "date": date_str,
                        "statement_num": num,
                        "mp_id": mp_id,
                        "speaker_name": speaker,
                        "content": content,
                        "topic": "Debata", # Placeholder
                    }
                    speech_batch.append(record)
                
                if speech_batch:
                    # Batch upsert
                    try:
                        # Batches of 50
                        for k in range(0, len(speech_batch), 50):
                             sub_batch = speech_batch[k:k+50]
                             supabase.table('speeches').upsert(sub_batch, on_conflict='mp_id,sitting,date,statement_num').execute()
                        print(f"  Ingested {len(speech_batch)} speeches for {date_str}")
                    except Exception as e:
                        print(f"  Error inserting speeches: {e}")
                        
            except Exception as e:
                print(f"  Error fetching transcript {sitting_num}/{date_str}: {e}")

def main():
    ingest_bills()
    ingest_speeches()
    print("--- ETL CONTENT COMPLETE ---")

if __name__ == "__main__":
    main()
