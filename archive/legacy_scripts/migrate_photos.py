import os
import requests
import time

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.")
    exit(1)

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"
BUCKET_NAME = "mp-photos"

# Supabase REST API endpoints
STORAGE_API = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}"
DB_API = f"{SUPABASE_URL}/rest/v1/mps"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
}

# --- MIGRATION LOGIC ---

def ensure_bucket_exists():
    """Create the mp-photos bucket if it doesn't exist using REST API"""
    print(f"Checking if bucket '{BUCKET_NAME}' exists...")
    try:
        # List buckets
        response = requests.get(
            f"{SUPABASE_URL}/storage/v1/bucket",
            headers=HEADERS
        )
        
        if response.status_code == 200:
            buckets = response.json()
            bucket_exists = any(b['name'] == BUCKET_NAME for b in buckets)
            
            if not bucket_exists:
                print(f"Creating bucket '{BUCKET_NAME}'...")
                create_response = requests.post(
                    f"{SUPABASE_URL}/storage/v1/bucket",
                    headers={**HEADERS, "Content-Type": "application/json"},
                    json={"name": BUCKET_NAME, "public": True}
                )
                if create_response.status_code in [200, 201]:
                    print(f"Bucket '{BUCKET_NAME}' created successfully.")
                else:
                    print(f"Warning: Bucket creation returned {create_response.status_code}")
            else:
                print(f"Bucket '{BUCKET_NAME}' already exists.")
        else:
            print(f"Warning: Could not list buckets (status {response.status_code})")
            print("Continuing anyway...")
            
    except Exception as e:
        print(f"Error with bucket: {e}")
        print("Attempting to continue anyway...")

def migrate_photos():
    """Download photos from Sejm API and upload to Supabase Storage using REST API"""
    print("\nFetching MP list from database...")
    
    try:
        # Fetch all MPs using REST API
        response = requests.get(
            DB_API,
            headers={**HEADERS, "Content-Type": "application/json"},
            params={"select": "id,name"}
        )
        
        if response.status_code != 200:
            print(f"Error fetching MPs: {response.status_code} - {response.text}")
            return
            
        mps = response.json()
        print(f"Found {len(mps)} MPs to process.\n")
        
        success_count = 0
        failure_count = 0
        skipped_count = 0
        
        for i, mp in enumerate(mps):
            mp_id = mp['id']
            mp_name = mp['name']
            
            try:
                # Rate limiting
                time.sleep(0.1)
                
                storage_path = f"mps/{mp_id}.jpg"
                
                # Check if photo already exists
                check_response = requests.get(
                    f"{STORAGE_API}/{storage_path}",
                    headers=HEADERS
                )
                
                if check_response.status_code == 200:
                    print(f"[{i+1}/{len(mps)}] {mp_name} (ID: {mp_id}): Photo already exists, skipping...")
                    skipped_count += 1
                    continue
                
                # Download from Sejm API
                sejm_url = f"{SEJM_API_URL}/MP/{mp_id}/photo"
                print(f"[{i+1}/{len(mps)}] {mp_name} (ID: {mp_id}): Downloading from Sejm API...")
                
                photo_response = requests.get(sejm_url, timeout=10)
                
                if photo_response.status_code == 404:
                    print(f"  ⚠️  No photo available on Sejm API (404)")
                    failure_count += 1
                    continue
                    
                if photo_response.status_code != 200:
                    print(f"  ❌ Download failed: HTTP {photo_response.status_code}")
                    failure_count += 1
                    continue
                
                # Upload to Supabase Storage using REST API
                print(f"  ⬆️  Uploading to Supabase Storage...")
                upload_response = requests.post(
                    f"{STORAGE_API}/{storage_path}",
                    headers={
                        **HEADERS,
                        "Content-Type": "image/jpeg",
                        "x-upsert": "true"  # Overwrite if exists
                    },
                    data=photo_response.content
                )
                
                if upload_response.status_code not in [200, 201]:
                    print(f"  ❌ Upload failed: {upload_response.status_code} - {upload_response.text[:100]}")
                    failure_count += 1
                    continue
                
                # Construct public URL
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{storage_path}"
                
                # Update database using REST API
                print(f"  💾 Updating database with new URL...")
                update_response = requests.patch(
                    f"{DB_API}?id=eq.{mp_id}",
                    headers={**HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"},
                    json={"photo_url": public_url}
                )
                
                if update_response.status_code not in [200, 204]:
                    print(f"  ⚠️  Database update warning: {update_response.status_code}")
                
                print(f"  ✅ Success! New URL: {public_url}")
                success_count += 1
                
            except Exception as e:
                print(f"  ❌ Error processing MP {mp_id}: {e}")
                failure_count += 1
                continue
        
        # Final report
        print("\n" + "="*60)
        print("MIGRATION COMPLETE")
        print("="*60)
        print(f"✅ Successfully migrated: {success_count} photos")
        print(f"⏭️  Skipped (already exists): {skipped_count} photos")
        print(f"❌ Failed: {failure_count} photos")
        print(f"📊 Total processed: {len(mps)} MPs")
        print("="*60)
        
    except Exception as e:
        print(f"Critical error during migration: {e}")

# --- MAIN ---
if __name__ == "__main__":
    print("Starting Photo Migration to Supabase Storage (REST API)...")
    print("="*60)
    
    ensure_bucket_exists()
    migrate_photos()
    
    print("\nPhoto migration script complete.")
