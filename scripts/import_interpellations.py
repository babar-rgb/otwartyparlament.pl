import os
import requests
from supabase import create_client, Client
import time

# Manually load .env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
except Exception:
    pass

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) are required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def import_interpellations():
    print("Starting Interpellations Import...")
    
    offset = 0
    limit = 50
    total_imported = 0
    
    while True:
        url = f"{SEJM_API_URL}/interpellations?limit={limit}&offset={offset}"
        print(f"Fetching: {url}")
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            if not data:
                break
                
            interpellations_batch = []
            authors_batch = []
            
            for item in data:
                # Prepare Interpellation Record
                interpellation = {
                    "id": item['num'],
                    "title": item['title'],
                    "sent_date": item.get('sentDate'),
                    "last_modified": item.get('lastModified'),
                    "raw_data": item # Store full JSON just in case
                }
                interpellations_batch.append(interpellation)
                
                # Prepare Authors Records
                # 'from' is a list of MP IDs (strings)
                if 'from' in item:
                    for mp_id in item['from']:
                        try:
                            authors_batch.append({
                                "interpellation_id": item['num'],
                                "mp_id": int(mp_id)
                            })
                        except ValueError:
                            print(f"Warning: Invalid MP ID {mp_id} in interpellation {item['num']}")

            # Upsert Interpellations
            if interpellations_batch:
                data, count = supabase.table('interpellations').upsert(interpellations_batch).execute()
                
            # Upsert Authors
            if authors_batch:
                # We use ignore_duplicates=True effectively by upserting. 
                # However, standard upsert might fail if duplicates exist in the batch itself? 
                # No, batch upsert handles it usually.
                data, count = supabase.table('interpellation_authors').upsert(authors_batch, on_conflict='interpellation_id, mp_id').execute()
                
            total_imported += len(data) if data else 0 # data is tuple (data, count) in newer supabase-py? 
            # Actually supabase-py returns `APIResponse` object usually or `data` directly depending on version.
            # Let's assume it works like previous scripts.
            
            print(f"Imported batch {offset}-{offset+len(data) if data else 0}")
            
            offset += limit
            time.sleep(0.2) # Be nice to API
            
        except Exception as e:
            print(f"Error fetching/saving batch at offset {offset}: {e}")
            break
            
    print(f"Finished. Total imported: {total_imported} (approx)")

if __name__ == "__main__":
    import_interpellations()
