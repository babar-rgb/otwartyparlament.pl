import os
import requests
import time
from supabase import create_client, Client

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_processes():
    print("Fetching legislative processes (bills)...")
    all_processes = []
    offset = 0
    limit = 50
    
    while True:
        try:
            url = f"{SEJM_API_URL}/processes?limit={limit}&offset={offset}"
            print(f"Fetching: {url}")
            response = requests.get(url)
            
            if response.status_code != 200:
                print(f"Error fetching processes: {response.status_code}")
                break
                
            data = response.json()
            if not data:
                break
                
            all_processes.extend(data)
            
            if len(data) < limit:
                break
                
            offset += limit
            time.sleep(0.2) # Gentle rate limiting
            
        except Exception as e:
            print(f"Exception fetching processes: {e}")
            break
            
    print(f"Total processes fetched: {len(all_processes)}")
    return all_processes

def save_processes(processes):
    print("Saving processes to database...")
    
    buffer = []
    BUFFER_SIZE = 100
    
    for p in processes:
        # Map API response to DB schema
        # API returns 'number' as the ID, but we want to store it as 'id'
        # API returns 'documentType' which might be useful
        
        # Sanitize UE field
        ue_val = p.get('UE')
        is_ue = False
        if isinstance(ue_val, bool):
            is_ue = ue_val
        elif isinstance(ue_val, str):
            is_ue = ue_val.upper() in ['YES', 'TRUE', '1']
            
        record = {
            "id": str(p.get('number')),
            "ue": is_ue,
            "title": p.get('title', ''),
            "description": p.get('description', ''),
            "print_number": p.get('documentId', ''), # This is crucial for linking!
            "process_start_date": p.get('processStartDate'),
            "change_date": p.get('changeDate'),
            "status": "processing", # Default, logic to determine status can be added
            "stages_json": p.get('stages', [])
        }
        
        # Determine status based on stages if possible
        if p.get('closureDate'):
             record['status'] = 'closed'
        
        buffer.append(record)
        
        if len(buffer) >= BUFFER_SIZE:
            try:
                supabase.table('processes').upsert(buffer).execute()
                print(f"Saved {len(buffer)} processes...")
                buffer = []
            except Exception as e:
                print(f"Error saving batch: {e}")
                
    if buffer:
        try:
            supabase.table('processes').upsert(buffer).execute()
            print(f"Saved remaining {len(buffer)} processes.")
        except Exception as e:
            print(f"Error saving final batch: {e}")

if __name__ == "__main__":
    print("--- IMPORT BILLS (PROCESY) ---")
    processes = fetch_processes()
    if processes:
        save_processes(processes)
    print("--- DONE ---")
