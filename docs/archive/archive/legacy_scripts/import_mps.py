import os
import requests
from supabase import create_client, Client

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def sync_mps():
    print("Fetching MPs from Sejm API...")
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
                # Preserve existing stats if possible, or init to 0
                "stats_attendance": 0, 
                "stats_rebellion": 0
            }
            mps_to_upsert.append(mp_record)
            
        # Upsert in batches
        BATCH_SIZE = 100
        for i in range(0, len(mps_to_upsert), BATCH_SIZE):
            batch = mps_to_upsert[i:i+BATCH_SIZE]
            supabase.table('mps').upsert(batch).execute()
            print(f"Upserted batch {i}-{i+len(batch)}")
            
        print(f"Successfully synced {len(mps_to_upsert)} MPs.")
    except Exception as e:
        print(f"Error syncing MPs: {e}")

if __name__ == "__main__":
    print("--- IMPORT MPs (POSŁOWIE) ---")
    sync_mps()
    print("--- DONE ---")
