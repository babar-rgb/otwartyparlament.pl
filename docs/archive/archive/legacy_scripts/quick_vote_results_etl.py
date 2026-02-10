#!/usr/bin/env python3
"""
Quick ETL to fetch vote_results for Term 10 from Sejm API
Connects directly to local PostgreSQL (not via Supabase)
"""
import requests
import psycopg2
import time

# Config
DB_NAME = "otwarty_parlament"
DB_USER = "kajtek"
TERM = 10
API_BASE = "https://api.sejm.gov.pl/sejm"

# Connect
conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER)
conn.autocommit = True
cur = conn.cursor()

def map_vote(api_value):
    mapping = {1: 'YES', 2: 'NO', 3: 'ABSTAIN', 4: 'ABSENT'}
    if isinstance(api_value, int):
        return mapping.get(api_value, 'PRESENT')
    return str(api_value).upper() if api_value else 'PRESENT'

def fetch_sittings():
    resp = requests.get(f"{API_BASE}/term{TERM}/proceedings")
    if resp.status_code != 200:
        print(f"Failed to fetch proceedings: {resp.status_code}")
        return []
    return sorted([item['number'] for item in resp.json()])

def process_sitting(sitting_num):
    print(f"Processing sitting {sitting_num}...")
    
    # Get votes for this sitting
    resp = requests.get(f"{API_BASE}/term{TERM}/votings/{sitting_num}")
    if resp.status_code != 200:
        print(f"  Failed: {resp.status_code}")
        return 0
    
    votes = resp.json()
    total_results = 0
    
    for vote in votes:
        vote_num = vote['votingNumber']
        vote_id = sitting_num * 10000 + vote_num  # Term 10 ID format
        
        # Check if we already have results for this vote
        cur.execute("SELECT COUNT(*) FROM vote_results WHERE vote_id = %s", (vote_id,))
        existing = cur.fetchone()[0]
        
        if existing > 0:
            # print(f"  Vote {vote_id} already has {existing} results, skipping")
            continue
        
        # Fetch individual results
        detail_resp = requests.get(f"{API_BASE}/term{TERM}/votings/{sitting_num}/{vote_num}")
        if detail_resp.status_code != 200:
            print(f"  Failed to get details for vote {vote_num}")
            continue
        
        mp_votes = detail_resp.json().get('votes', [])
        if not mp_votes:
            continue
        
        # Insert results
        for v in mp_votes:
            mp_id = v.get('MP')
            if not mp_id:
                continue
            
            vote_value = map_vote(v.get('vote'))
            
            try:
                cur.execute("""
                    INSERT INTO vote_results (vote_id, mp_id, vote, rebel)
                    VALUES (%s, %s, %s, false)
                    ON CONFLICT (vote_id, mp_id) DO NOTHING
                """, (vote_id, mp_id, vote_value))
                total_results += 1
            except Exception as e:
                print(f"  Error inserting: {e}")
        
        # Small delay to be polite to API
        time.sleep(0.1)
    
    print(f"  Inserted {total_results} vote results")
    return total_results

# Main
print(f"Fetching vote_results for Term {TERM}...")
sittings = fetch_sittings()
print(f"Found {len(sittings)} sittings")

total = 0
for sitting in sittings:
    total += process_sitting(sitting)

print(f"\nDone! Total new vote_results: {total}")
cur.close()
conn.close()
