import os
import requests
import time
from supabase import create_client

# Config
SUPABASE_URL = "http://localhost:5173"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoid2ViX2Fub24ifQ.33U98-wreuo0Qic9lsznlb9mL58v3yHJX_2vf2rcKGk"
ASSETS_DIR = "public/assets/mps"
PLACEHOLDER_URL = "https://via.placeholder.com/200x200/E2E8F0/64748B?text=MP" # We'll download this once as local placeholder

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def setup_directories():
    if not os.path.exists(ASSETS_DIR):
        print(f"Creating directory: {ASSETS_DIR}")
        os.makedirs(ASSETS_DIR, exist_ok=True)

def download_image(url, save_path):
    try:
        response = requests.get(url, stream=True, timeout=10)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return True
        else:
            print(f"  Error downloading {url}: Status {response.status_code}")
            return False
    except Exception as e:
        print(f"  Exception downloading {url}: {e}")
        return False

def main():
    setup_directories()
    
    print("Fetching MPs from local database...")
    result = supabase.table('mps').select('id, name, photo_url').execute()
    mps = result.data
    
    print(f"Found {len(mps)} MPs.")
    
    # Download Placeholder first
    placeholder_path = f"{ASSETS_DIR}/placeholder.jpg"
    if not os.path.exists(placeholder_path):
        print("Downloading placeholder...")
        download_image(PLACEHOLDER_URL, placeholder_path)
    
    count_updated = 0
    count_processed = 0
    
    for mp in mps:
        mp_id = mp['id']
        current_url = mp['photo_url']
        
        # Check if already local
        if current_url and current_url.startswith('/assets/mps/'):
            # Already local, verified?
             # print(f"  Skipping {mp['first_name']} {mp['last_name']} (Already local)")
             continue
             
        # New local path
        local_filename = f"{mp_id}.jpg"
        local_path = f"{ASSETS_DIR}/{local_filename}"
        public_url = f"/assets/mps/{local_filename}"
        
        # Determine Source URL
        source_url = current_url
        if not source_url:
             # Try to construct standard Sejm URL if missing but we assume we have api_id? 
             # For now fallback to placeholder later.
             print(f"  No photo_url for {mp_id} ({mp['name']}). Using placeholder.")
             public_url = "/assets/mps/placeholder.jpg"
        
        # Use existing 'photo_url' as source if it's external
        if source_url and source_url.startswith('http'):
            count_processed += 1
            if not os.path.exists(local_path):
                print(f"Downloading photo for {mp['name']} ({mp_id})...")
                success = download_image(source_url, local_path)
                if not success:
                    print(f"  FAILED. Using placeholder.")
                    public_url = "/assets/mps/placeholder.jpg"
            else:
                pass 
                # print(f"  File exists locally: {local_path}")
                
        else:
            # If source is missing or invalid, use placeholder
            public_url = "/assets/mps/placeholder.jpg"

        # Update DB
        if current_url != public_url:
            supabase.table('mps').update({"photo_url": public_url}).eq('id', mp_id).execute()
            count_updated += 1
            if count_updated % 10 == 0:
                print(f"  Updated {count_updated} records...")
        
    print("--- ASSET DOWNLOAD COMPLETE ---")
    print(f"Total MPs processed: {len(mps)}")
    print(f"Downloaded/Checked: {count_processed}")
    print(f"DB Records Updated: {count_updated}")

if __name__ == "__main__":
    main()
