import requests
import psycopg2
import os
import json
from slugify import slugify

# Database connection details
DB_NAME = "otwarty_parlament"
DB_USER = "kajtek"
DB_HOST = "localhost"
DB_PORT = "5432"

def get_db_connection():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        host=DB_HOST,
        port=DB_PORT
    )

def fetch_mps_term9():
    url = "https://api.sejm.gov.pl/sejm/term9/MP"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to fetch MPs: {response.status_code}")
        return []

def get_existing_slugs(cursor):
    cursor.execute("SELECT slug FROM mps")
    return {row[0] for row in cursor.fetchall()}

def generate_unique_slug(name, existing_slugs, term):
    base_slug = slugify(name)
    
    # For term 9, we prefer base_slug if available, otherwise append -term9
    # BUT wait, term 10 MPs might already have base_slug. 
    # If the same person is in term 10, they have base_slug.
    # We should probably use a suffix for term 9 to allow easily distinguishing them in URLs,
    # OR if we want nice URLs, we might use the same slug if they are NOT in term 10?
    # Simple approach: Check collision. If collision, try appending -9.
    
    candidate = base_slug
    if candidate in existing_slugs:
        candidate = f"{base_slug}-9"
        
    if candidate in existing_slugs:
        # Fallback if even -9 exists (unlikely unless two people same name in term 9)
        candidate = f"{base_slug}-term9"
        
    return candidate

def import_mps():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("Fetching MPs from Term 9...")
    mps_data = fetch_mps_term9()
    print(f"Fetched {len(mps_data)} MPs.")
    
    existing_slugs = get_existing_slugs(cursor)
    
    added_count = 0
    skipped_count = 0
    
    for mp in mps_data:
        api_id = mp['id']
        name = f"{mp['firstName']} {mp['lastName']}"
        term = 9
        club = mp.get('club', '')
        district = mp.get('districtName', '')
        active = mp.get('active', False)
        
        # Build photo URL
        photo_url = f"https://api.sejm.gov.pl/sejm/term9/MP/{api_id}/photo"
        
        # Check if already exists (api_id + term)
        cursor.execute("SELECT id FROM mps WHERE api_id = %s AND term = %s", (api_id, term))
        if cursor.fetchone():
            skipped_count += 1
            # print(f"Skipping {name} (already exists)")
            continue
            
        # Generate slug
        slug = generate_unique_slug(name, existing_slugs, term)
        existing_slugs.add(slug)
        
        # Insert
        try:
            cursor.execute("""
                INSERT INTO mps (
                    name, party, district, photo_url, active, 
                    term, api_id, slug, stats_attendance, stats_rebellion
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 0, 0)
            """, (name, club, district, photo_url, active, term, api_id, slug))
            added_count += 1
        except Exception as e:
            print(f"Error inserting {name}: {e}")
            conn.rollback()
            continue
            
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"Import complete.")
    print(f"Added: {added_count}")
    print(f"Skipped: {skipped_count}")

if __name__ == "__main__":
    import_mps()
