"""
Incremental ETL for otwartyparlament.pl
Standardized version using backend.core modules.
"""
import json
import os
import sys
from datetime import datetime

# Hack to allow running this script directly from /app/etl/ inside Docker
# Adds /app/ (parent directory) to sys.path so 'core' and 'utils' can be imported.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Adjusted imports for Docker environment (where 'backend' package name might be missing)
try:
    from backend.core.db import db
    from backend.core.logger import get_logger
    from backend.core.config import config
    from backend.utils.http import http_session
except ImportError:
    # Fallback for Docker /app structure
    from core.db import db
    from core.logger import get_logger
    from core.config import config
    from utils.http import http_session

logger = get_logger("etl.incremental")

BASE_API = "https://api.sejm.gov.pl/sejm"
# Ensure state file is in the same directory as this script
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".etl_state.json")


def load_state():
    """Load last sync state from file."""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return {"last_sync": {}, "last_run": None}


def save_state(state):
    """Save sync state to file."""
    state["last_run"] = datetime.now().isoformat()
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)


def get_latest_sitting_in_db(term: int) -> int:
    """Get the latest sitting number we have in DB for a term."""
    try:
        with db.get_cursor() as cur:
            cur.execute("SELECT MAX(sitting) FROM votes WHERE term = %s", (term,))
            result = cur.fetchone()
            if result and result['max']:
                return int(result['max'])
    except Exception as e:
        logger.error(f"Error checking latest sitting: {e}")
    return 0


def get_all_sittings_from_api(term: int) -> list:
    """Fetch all sitting numbers from API."""
    try:
        resp = http_session.get(f"{BASE_API}/term{term}/proceedings", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return sorted([item['number'] for item in data])
    except Exception as e:
        logger.error(f"Error fetching sittings: {e}")
    return []


def sync_sitting_votes(term: int, sitting_num: int) -> int:
    """Sync votes for a specific sitting."""
    logger.info(f"Syncing sitting {sitting_num}...")
    
    try:
        resp = http_session.get(f"{BASE_API}/term{term}/votings/{sitting_num}", timeout=30)
        if resp.status_code != 200:
            logger.error(f"API error {resp.status_code} for sitting {sitting_num}")
            return 0
        
        votes_data = resp.json()
        inserted = 0
        
        with db.get_cursor(commit=True) as cur:
            for vote in votes_data:
                vote_num = vote.get('votingNumber', vote.get('no'))
                title = vote.get('title', '')
                date = vote.get('date', '')
                yes = vote.get('yes', 0)
                no = vote.get('no', 0)
                abstain = vote.get('abstain', 0)
                verdict = 'PRZYJĘTO' if yes > no else 'ODRZUCONO'
                
                # Calculate ID
                vote_id = sitting_num * 10000 + vote_num if term == 10 else term * 10000000 + sitting_num * 10000 + vote_num
                
                sql = """
                    INSERT INTO votes (id, sitting, voting_number, date, title_raw, title_clean, 
                                       verdict, term, details_json, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (id) DO UPDATE SET
                        title_clean = EXCLUDED.title_clean,
                        verdict = EXCLUDED.verdict,
                        details_json = EXCLUDED.details_json;
                """
                details = json.dumps({"yes": yes, "no": no, "abstain": abstain})
                cur.execute(sql, (vote_id, sitting_num, vote_num, date, title, title, verdict, term, details))
                inserted += 1
        
        logger.info(f"Sitting {sitting_num}: {inserted} votes synced")
        return inserted
        
    except Exception as e:
        logger.error(f"Error syncing sitting {sitting_num}: {e}")
        return 0


def sync_new_mps(term: int):
    """Sync any new MPs (quick check)."""
    logger.info("Checking for new MPs...")
    
    try:
        resp = http_session.get(f"{BASE_API}/term{term}/MP", timeout=10)
        if resp.status_code != 200:
            return
            
        mps = resp.json()
        
        with db.get_cursor(commit=True) as cur:
            # Get existing IDs
            cur.execute("SELECT id FROM mps WHERE term = %s", (term,))
            existing_ids = set(row['id'] for row in cur.fetchall())
            
            new_count = 0
            for mp in mps:
                if mp['id'] not in existing_ids:
                    name = f"{mp.get('firstName', '')} {mp.get('lastName', '')}"
                    party = mp.get('club', 'Niezrzeszony')
                    
                    sql = """
                        INSERT INTO mps (id, name, party, term, active, created_at)
                        VALUES (%s, %s, %s, %s, true, NOW())
                        ON CONFLICT (id) DO NOTHING;
                    """
                    cur.execute(sql, (mp['id'], name, party, term))
                    new_count += 1
            
            if new_count > 0:
                logger.info(f"Added {new_count} new MPs")
                
    except Exception as e:
        logger.error(f"MP sync error: {e}")


class IncrementalETL:
    def __init__(self, term: int = 10):
        self.term = term
        self.state = load_state()

    def run(self):
        """Run incremental update."""
        logger.info("=" * 60)
        logger.info(f"INCREMENTAL UPDATE - Term {self.term}")
        logger.info(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 60)
        
        db_latest = get_latest_sitting_in_db(self.term)
        api_sittings = get_all_sittings_from_api(self.term)
        
        if not api_sittings:
            logger.warning("No sittings found in API")
            return
        
        api_latest = max(api_sittings)
        
        logger.info(f"DB Latest Sitting: {db_latest}")
        logger.info(f"API Latest Sitting: {api_latest}")
        
        new_sittings = [s for s in api_sittings if s > db_latest]
        
        if not new_sittings:
            logger.info("Already up to date! No new sittings.")
            save_state(self.state)
            return
        
        logger.info(f"New sittings to sync: {new_sittings}")
        
        # Sync MPs first
        sync_new_mps(self.term)
        
        # Sync new sittings
        total_votes = 0
        for sitting in new_sittings:
            votes = sync_sitting_votes(self.term, sitting)
            total_votes += votes
            # Sleep a bit to be nice to API?
        
        # Update state
        self.state["last_sync"][str(self.term)] = api_latest
        save_state(self.state)
        
        logger.info("=" * 60)
        logger.info("SYNC COMPLETE")
        logger.info(f"New sittings: {len(new_sittings)}, New votes: {total_votes}")
        logger.info("=" * 60)

    def status(self):
        """Show current sync status."""
        logger.info(f"Last run: {self.state.get('last_run', 'Never')}")
        logger.info(f"Sync state: {self.state.get('last_sync', {})}")
        db_latest = get_latest_sitting_in_db(self.term)
        logger.info(f"DB latest sitting (term {self.term}): {db_latest}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Incremental ETL')
    parser.add_argument('--term', type=int, default=10, help='Term to sync')
    parser.add_argument('--status', action='store_true', help='Show status')
    args = parser.parse_args()
    
    etl = IncrementalETL(term=args.term)
    if args.status:
        etl.status()
    else:
        etl.run()
