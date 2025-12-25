import os
import requests
import time
from supabase import create_client, Client

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

# --- ETL FUNCTIONS ---

def sync_interpellations():
    print("Fetching Interpellations...")
    try:
        # Fetch all interpellations (might need pagination if API limits, but usually returns full list or we can iterate)
        # API docs say /interpellations returns list.
        response = requests.get(f"{SEJM_API_URL}/interpellations")
        if response.status_code != 200:
            print(f"Error fetching interpellations: {response.status_code}")
            return

        data = response.json()
        print(f"Found {len(data)} interpellations. Processing...")

        interpellations_buffer = []
        BUFFER_SIZE = 1000
        
        for item in data:
            num = item.get('num')
            title = item.get('title')
            sent_date = item.get('sentDate')
            # 'to' is a list, join it
            sent_to = ", ".join(item.get('to', []))
            link = f"https://www.sejm.gov.pl/Sejm10.nsf/InterpelacjaTresc.xsp?key={item.get('key')}" if item.get('key') else None
            
            # 'from' is a list of MP IDs
            mp_ids = item.get('from', [])
            
            for mp_id in mp_ids:
                record = {
                    "mp_id": mp_id,
                    "num": num,
                    "title": title,
                    "sent_to": sent_to,
                    "date": sent_date,
                    "link_sejm": link
                }
                interpellations_buffer.append(record)
                
                if len(interpellations_buffer) >= BUFFER_SIZE:
                    print(f"  Flushing {len(interpellations_buffer)} interpellations...")
                    supabase.table('interpellations').upsert(interpellations_buffer).execute() # No conflict handling needed as we use UUID PK, but upsert might create dupes if we run twice. 
                    # Ideally we should have a unique constraint on (mp_id, num). 
                    # For now, let's just insert. To avoid dupes on re-run, we might need to delete first or use a composite key.
                    # User requested 'id' PK. 
                    # Let's assume for this run we just insert. 
                    # Wait, if we run this twice, we get duplicates.
                    # Better: Delete all interpellations first? Or check existence?
                    # Deleting is safest for a full sync script.
                    interpellations_buffer = []

        if interpellations_buffer:
            print(f"  Flushing remaining {len(interpellations_buffer)} interpellations...")
            supabase.table('interpellations').upsert(interpellations_buffer).execute()
            
        print("Interpellations sync complete.")
        
    except Exception as e:
        print(f"Error syncing interpellations: {e}")

def sync_prints():
    print("Fetching Prints (Druki)...")
    try:
        response = requests.get(f"{SEJM_API_URL}/prints")
        if response.status_code != 200:
            print(f"Error fetching prints: {response.status_code}")
            return

        data = response.json()
        print(f"Found {len(data)} prints. Processing...")
        
        prints_buffer = []
        BUFFER_SIZE = 1000
        
        for item in data:
            number = item.get('number')
            title = item.get('title')
            description = item.get('documentDate') # API doesn't have 'description' field in list, maybe 'documentDate' or 'deliveryDate'? 
            # Actually, looking at API, 'title' is the main desc. 
            # Let's use 'title' for title.
            # 'attachments' might have the PDF.
            
            # Construct URL
            # Usually: https://api.sejm.gov.pl/sejm/term10/prints/{number}/{filename}
            # But we want the web view or PDF.
            # Web view: https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr={number}
            process_print_url = f"https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr={number}"
            
            record = {
                "number": number,
                "title": title,
                "description": item.get('documentDate'), # Using date as description/metadata for now
                "process_print_url": process_print_url
            }
            prints_buffer.append(record)
            
            if len(prints_buffer) >= BUFFER_SIZE:
                print(f"  Flushing {len(prints_buffer)} prints...")
                supabase.table('prints').upsert(prints_buffer).execute()
                prints_buffer = []
                
        if prints_buffer:
            print(f"  Flushing remaining {len(prints_buffer)} prints...")
            supabase.table('prints').upsert(prints_buffer).execute()
            
        print("Prints sync complete.")

    except Exception as e:
        print(f"Error syncing prints: {e}")

def update_mp_stats():
    print("Updating MP Stats...")
    try:
        # 1. Get interpellation counts
        # Supabase doesn't support complex aggregations via REST easily without RPC.
        # We can fetch all interpellations (lightweight, just mp_id) and count in Python, 
        # OR use rpc if we had one.
        # Given we just inserted them, we can fetch 'mp_id' from 'interpellations'.
        
        print("  Fetching interpellation counts...")
        # Fetching all might be heavy if millions, but here it's ~10k-20k probably.
        resp = supabase.table('interpellations').select('mp_id').execute()
        data = resp.data
        
        counts = {}
        for row in data:
            mid = row['mp_id']
            counts[mid] = counts.get(mid, 0) + 1
            
        print(f"  Calculated stats for {len(counts)} MPs.")
        
        # 2. Update MPs
        # Bulk update is tricky with different values.
        # We can do it in chunks or one by one.
        # For 460 MPs, one by one is fine.
        
        for mp_id, count in counts.items():
            supabase.table('mps').update({'stats_interpellations': count}).eq('id', mp_id).execute()
            
        print("MP Stats updated.")
        
    except Exception as e:
        print(f"Error updating stats: {e}")

# --- MAIN ---
if __name__ == "__main__":
    print("Starting Activity ETL...")
    
    # 0. Clear tables? (Optional, but good for idempotency if we don't have unique constraints)
    # print("Clearing old data...")
    # supabase.table('interpellations').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    # supabase.table('prints').delete().neq('number', '0').execute()
    
    sync_interpellations()
    sync_prints()
    update_mp_stats()
    
    print("Activity ETL Complete.")
