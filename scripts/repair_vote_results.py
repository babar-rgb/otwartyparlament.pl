import psycopg2
import requests
import time
import sys
from psycopg2.extras import execute_values

# DB Config
DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

def map_vote_value(api_value):
    mapping = {1: 'YES', 2: 'NO', 3: 'ABSTAIN', 4: 'ABSENT'}
    if isinstance(api_value, int): return mapping.get(api_value, 'PRESENT')
    val_str = str(api_value).upper()
    if val_str == 'YES': return 'YES'
    if val_str == 'NO': return 'NO'
    if val_str == 'ABSTAIN': return 'ABSTAIN'
    if val_str == 'ABSENT': return 'ABSENT'
    return 'PRESENT'

def repair_missing_votes():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("🔍 Scanning for votes with NO individual results...")
        
        # 1. Identify missing votes
        query = """
        SELECT v.id, v.sitting, v.voting_number, v.title_clean
        FROM votes v
        LEFT JOIN vote_results vr ON v.id = vr.vote_id
        GROUP BY v.id
        HAVING COUNT(vr.id) = 0
        ORDER BY v.date DESC;
        """
        cur.execute(query)
        missing_votes = cur.fetchall()
        
        print(f"⚠️  Found {len(missing_votes)} votes to repair.")
        
        success_count = 0
        
        for idx, row in enumerate(missing_votes):
            vote_id, sitting, voting_num, title = row
            
            print(f"[{idx+1}/{len(missing_votes)}] Repairing Vote {vote_id} (Sitting {sitting}, #{voting_num})...")
            
            # 2. Fetch from API
            url = f"{SEJM_API_URL}/votings/{sitting}/{voting_num}"
            try:
                # Add delay to be nice to API
                time.sleep(0.1)
                
                resp = requests.get(url, timeout=10)
                if resp.status_code != 200:
                    print(f"  ❌ API Error {resp.status_code}: {url}")
                    continue
                    
                data = resp.json()
                mp_votes = data.get('votes', [])
                
                if not mp_votes:
                    print("  ❌ API returned no votes")
                    continue
                    
                # 3. Prepare data for insert
                results_buffer = []
                for v in mp_votes:
                    mp_id = v.get('MP')
                    if not mp_id: continue
                    
                    results_buffer.append((
                        vote_id,
                        mp_id,
                        map_vote_value(v.get('vote')),
                        False # Default 'rebel' to false, can be recalculated later
                    ))
                
                if not results_buffer:
                     print("  ⚠️  No valid MP records found in API response")
                     continue

                # 4. Insert into DB (Batch)
                insert_query = """
                INSERT INTO vote_results (vote_id, mp_id, vote, rebel)
                VALUES %s
                ON CONFLICT (vote_id, mp_id) DO NOTHING
                """
                
                execute_values(cur, insert_query, results_buffer)
                conn.commit()
                print(f"  ✅ Inserted {len(results_buffer)} records.")
                success_count += 1
                
            except Exception as e:
                print(f"  ❌ Failed to process: {e}")
                conn.rollback()
                
        print("\n✅ REPAIR COMPLETE")
        print(f"Successfully repaired {success_count} out of {len(missing_votes)} votes.")
        
        conn.close()
        
    except Exception as e:
        print(f"Critical Error: {e}")

if __name__ == "__main__":
    repair_missing_votes()
