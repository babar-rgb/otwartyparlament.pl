#!/usr/bin/env python3
"""
Incremental ETL for otwartyparlament.pl
Only syncs NEW data since last successful run.

Features:
- Delta Update: Fetches only new sittings/votes
- Last Sync Tracking: Stores last processed sitting per term
- Idempotent: Safe to run multiple times
"""

import os
import sys
import json
import subprocess
from datetime import datetime, timedelta
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Add script directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
BASE_API = "https://api.sejm.gov.pl/sejm"
STATE_FILE = os.path.join(os.path.dirname(__file__), ".etl_state.json")

# Retry session
session = requests.Session()
retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
session.mount('https://', HTTPAdapter(max_retries=retries))


def run_sql(query, return_rows=True):
    """Execute SQL using psql"""
    cmd = [PSQL, "-d", DB, "-t", "-c", query]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"SQL Error: {result.stderr[:200]}")
        return []
    if return_rows:
        return [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
    return []


def load_state():
    """Load last sync state from file"""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return {"last_sync": {}, "last_run": None}


def save_state(state):
    """Save sync state to file"""
    state["last_run"] = datetime.now().isoformat()
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)


def get_latest_sitting_in_db(term):
    """Get the latest sitting number we have in DB for a term"""
    result = run_sql(f"""
        SELECT MAX(sitting) FROM votes WHERE term = {term}
    """)
    if result and result[0] and result[0] != '':
        return int(result[0])
    return 0


def get_all_sittings_from_api(term):
    """Fetch all sitting numbers from API"""
    try:
        resp = session.get(f"{BASE_API}/term{term}/proceedings", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return sorted([item['number'] for item in data])
    except Exception as e:
        print(f"Error fetching sittings: {e}")
    return []


def sync_sitting_votes(term, sitting_num):
    """Sync votes for a specific sitting"""
    print(f"  Syncing sitting {sitting_num}...", end=" ", flush=True)
    
    try:
        resp = session.get(f"{BASE_API}/term{term}/votings/{sitting_num}", timeout=30)
        if resp.status_code != 200:
            print(f"❌ API error {resp.status_code}")
            return 0
        
        votes_data = resp.json()
        inserted = 0
        
        for vote in votes_data:
            vote_num = vote.get('votingNumber', vote.get('no'))
            title = vote.get('title', '')
            date = vote.get('date', '')
            verdict = 'PRZYJĘTO' if vote.get('yes', 0) > vote.get('no', 0) else 'ODRZUCONO'
            
            # Insert vote (ON CONFLICT DO NOTHING)
            title_escaped = title.replace("'", "''")
            run_sql(f"""
                INSERT INTO votes (sitting, voting_number, date, title_raw, title_clean, 
                                   verdict, term, details_json)
                VALUES ({sitting_num}, {vote_num}, '{date}', '{title_escaped}', '{title_escaped}',
                        '{verdict}', {term}, 
                        '{{"yes": {vote.get('yes',0)}, "no": {vote.get('no',0)}, "abstain": {vote.get('abstain',0)}}}'::jsonb)
                ON CONFLICT (sitting, voting_number, term) DO NOTHING
            """, return_rows=False)
            inserted += 1
        
        print(f"✅ {inserted} votes")
        return inserted
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 0


def sync_new_mps(term):
    """Sync any new MPs (quick check)"""
    print("  Checking for new MPs...")
    
    try:
        resp = session.get(f"{BASE_API}/term{term}/MP", timeout=10)
        if resp.status_code == 200:
            mps = resp.json()
            
            # Get existing MP IDs
            existing = run_sql(f"SELECT id FROM mps WHERE term = {term}")
            existing_ids = set(int(x) for x in existing if x)
            
            new_count = 0
            for mp in mps:
                if mp['id'] not in existing_ids:
                    name = f"{mp.get('firstName', '')} {mp.get('lastName', '')}".replace("'", "''")
                    party = mp.get('club', 'Niezrzeszony').replace("'", "''")
                    
                    run_sql(f"""
                        INSERT INTO mps (id, name, party, term, active)
                        VALUES ({mp['id']}, '{name}', '{party}', {term}, true)
                        ON CONFLICT (id) DO NOTHING
                    """, return_rows=False)
                    new_count += 1
            
            if new_count > 0:
                print(f"  Added {new_count} new MPs")
    except Exception as e:
        print(f"  MP sync error: {e}")


def run_incremental_update(term=10):
    """Run incremental update for a term"""
    print(f"\n{'='*60}")
    print(f"  INCREMENTAL UPDATE - Term {term}")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    
    state = load_state()
    
    # Get current state
    db_latest = get_latest_sitting_in_db(term)
    api_sittings = get_all_sittings_from_api(term)
    
    if not api_sittings:
        print("  No sittings found in API")
        return
    
    api_latest = max(api_sittings)
    
    print(f"\n  DB Latest Sitting: {db_latest}")
    print(f"  API Latest Sitting: {api_latest}")
    
    # Find new sittings
    new_sittings = [s for s in api_sittings if s > db_latest]
    
    if not new_sittings:
        print("\n  ✅ Already up to date! No new sittings.")
        save_state(state)
        return
    
    print(f"\n  🆕 New sittings to sync: {new_sittings}")
    
    # Sync MPs first
    sync_new_mps(term)
    
    # Sync new sittings
    total_votes = 0
    for sitting in new_sittings:
        votes = sync_sitting_votes(term, sitting)
        total_votes += votes
    
    # Update state
    state["last_sync"][str(term)] = api_latest
    save_state(state)
    
    print(f"\n{'='*60}")
    print(f"  ✅ SYNC COMPLETE")
    print(f"  New sittings: {len(new_sittings)}")
    print(f"  New votes: {total_votes}")
    print(f"{'='*60}\n")


def run_full_sync(term=10):
    """Run full sync (for initial setup or recovery)"""
    print(f"\n{'='*60}")
    print(f"  FULL SYNC - Term {term}")
    print(f"{'='*60}")
    
    api_sittings = get_all_sittings_from_api(term)
    print(f"  Total sittings to sync: {len(api_sittings)}")
    
    sync_new_mps(term)
    
    for sitting in api_sittings:
        sync_sitting_votes(term, sitting)
    
    print("\n  ✅ Full sync complete!")


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Incremental ETL for otwartyparlament.pl')
    parser.add_argument('--term', type=int, default=10, help='Term to sync (default: 10)')
    parser.add_argument('--full', action='store_true', help='Run full sync instead of incremental')
    parser.add_argument('--status', action='store_true', help='Show current sync status')
    
    args = parser.parse_args()
    
    if args.status:
        state = load_state()
        print(f"Last run: {state.get('last_run', 'Never')}")
        print(f"Sync state: {state.get('last_sync', {})}")
        db_latest = get_latest_sitting_in_db(args.term)
        print(f"DB latest sitting (term {args.term}): {db_latest}")
        return
    
    if args.full:
        run_full_sync(args.term)
    else:
        run_incremental_update(args.term)


if __name__ == "__main__":
    main()
