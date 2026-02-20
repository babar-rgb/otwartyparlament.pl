"""
Incremental ETL for otwartyparlament.pl
Standardized version using backend.core modules.
"""
import json
import os
import sys
from datetime import datetime
import time

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

# Standard imports from current package
try:
    from backend.etl.bills import BillsETL
    from backend.etl.committees import CommitteesETL
    from backend.etl.declarations import DeclarationsETL
    from backend.etl.interpellations import InterpellationsETL
    from backend.etl.europarl import EuroparlETL
    from backend.etl.speeches import SpeechesETL
    from backend.etl.pdf_extractor import PDFReplyExtractor
    from backend.etl.bills_linker import BillVoteLinker
    from backend.etl.summarize_sitting import SittingSummarizer
    from backend.etl.socials import SocialsETL
    from backend.etl.stats import calculate_stats
    from backend.etl.vote_grouping import VoteGroupingETL
    from backend.etl.ai_enrichment import AIEnrichmentETL
except ImportError:
    # Fallback for direct execution or docker paths
    try:
        from bills import BillsETL
        from committees import CommitteesETL
        from declarations import DeclarationsETL
        from interpellations import InterpellationsETL
        from europarl import EuroparlETL
        from speeches import SpeechesETL
        from pdf_extractor import PDFReplyExtractor
        from bills_linker import BillVoteLinker
        from summarize_sitting import SittingSummarizer
        from socials import SocialsETL
        from stats import calculate_stats
        from vote_grouping import VoteGroupingETL
        from ai_enrichment import AIEnrichmentETL
    except ImportError as e:
        # If we still fail, we will define dummies or re-raise
        print(f"⚠️ Critical Import Warning in incremental.py: {e}")
        # Define dummies to avoid NameError during runtime if some modules are missing
        class DummyETL: 
            def __init__(self, *args, **kwargs): pass
            def run(self, *args, **kwargs): pass
        
        BillsETL = CommitteesETL = DeclarationsETL = InterpellationsETL = DummyETL
        EuroparlETL = SpeechesETL = PDFReplyExtractor = BillVoteLinker = DummyETL
        SittingSummarizer = SocialsETL = VoteGroupingETL = AIEnrichmentETL = DummyETL
        def calculate_stats(): pass


logger = get_logger("etl.incremental")

BASE_API = "https://api.sejm.gov.pl/sejm"
# Ensure state file is in the same directory as this script
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".etl_state.json")


def load_state():
    """
    Load last sync state from JSON file.
    
    Returns:
        dict: State dictionary containing 'last_sync' (map of term->sitting) and 'last_run' timestamp.
    """
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
    """
    Get the latest sitting number stored in the local database for a given term.
    
    Args:
        term (int): Sejm term number (e.g. 10).
        
    Returns:
        int: The highest sitting number found, or 0 if no data exists.
    """
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
    """
    Fetches and synchronizes all votes for a specific sitting from the Sejm API.
    
    1. Fetches votes metadata from /term{term}/votings/{sitting_num}.
    2. Inserts basic vote data (title, date, verdict, counts) into 'votes' table.
    3. Triggers 'ResultsETL' to fetch individual MP votes (who voted how).
    
    Args:
        term (int): Sejm term number.
        sitting_num (int): Sitting number.
        
    Returns:
        int: Number of new/updated votes inserted.
    """
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
                
                link_sejm = f"https://www.sejm.gov.pl/Sejm10.nsf/agent.xsp?symbol=glosowania&NrKadencji={term}&NrPosiedzenia={sitting_num}&NrGlosowania={vote_num}"
                
                sql = """
                    INSERT INTO votes (id, sitting, voting_number, date, title_raw, title_clean, 
                                       verdict, term, details_json, created_at, link_sejm)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s)
                    ON CONFLICT (id) DO UPDATE SET
                        title_clean = EXCLUDED.title_clean,
                        verdict = EXCLUDED.verdict,
                        details_json = EXCLUDED.details_json,
                        link_sejm = EXCLUDED.link_sejm;
                """
                # Store full API details for better grouping/analysis
                details = json.dumps(vote)
                cur.execute(sql, (vote_id, sitting_num, vote_num, date, title, title, verdict, term, details, link_sejm))
                inserted += 1
        
        logger.info(f"Sitting {sitting_num}: {inserted} votes synced")
        
        # Sync detailed results
        try:
            from backend.etl.vote_results import ResultsETL
            ResultsETL().run(limit=1000, force_sitting=sitting_num)
        except Exception as e:
            logger.error(f"Error syncing results for sitting {sitting_num}: {e}")

        return inserted
        
    except Exception as e:
        logger.error(f"Error syncing sitting {sitting_num}: {e}")
        return 0


def sync_new_mps(term: int):
    """
    Checks for new MPs in the Sejm API and adds them to the database.
    
    Fetches the full list of MPs for the term and compares IDs with the local 'mps' table.
    Updates biographical data (club, birth date, education) for new entries.
    
    Args:
        term (int): Sejm term number.
    """
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
                    first_name = mp.get('firstName', '')
                    last_name = mp.get('lastName', '')
                    club = mp.get('club', 'Niezrzeszony')
                    
                    active = mp.get('active', True)
                    
                    # Biography data
                    birth_date = mp.get('birthDate')
                    birth_location = mp.get('birthLocation')
                    profession = mp.get('profession')
                    education_level = mp.get('educationLevel')
                    education_history = json.dumps(mp.get('educations', []))
                    
                    link_sejm = f"https://www.sejm.gov.pl/Sejm10.nsf/posel.xsp?id={mp['id']}&term={term}"
                    photo_url = f"https://api.sejm.gov.pl/sejm/term{term}/MP/{mp['id']}/photo"

                    sql = """
                        INSERT INTO mps (id, first_name, last_name, club, term, active, 
                                         birth_date, birth_location, profession, education_level, education_history,
                                         created_at, link_sejm, photo_url)
                        VALUES (%s, %s, %s, %s, %s, true, %s, %s, %s, %s, %s, NOW(), %s, %s)
                        ON CONFLICT (id) DO UPDATE SET
                            first_name = EXCLUDED.first_name,
                            last_name = EXCLUDED.last_name,
                            club = EXCLUDED.club,
                            birth_date = EXCLUDED.birth_date,
                            birth_location = EXCLUDED.birth_location,
                            profession = EXCLUDED.profession,
                            education_level = EXCLUDED.education_level,
                            education_history = EXCLUDED.education_history,
                            link_sejm = EXCLUDED.link_sejm,
                            photo_url = EXCLUDED.photo_url;
                    """
                    cur.execute(sql, (mp['id'], first_name, last_name, club, term, 
                                      birth_date, birth_location, profession, education_level, education_history, link_sejm, photo_url))
                    new_count += 1
            
            if new_count > 0:
                logger.info(f"Added {new_count} new MPs")
                
    except Exception as e:
        logger.error(f"MP sync error: {e}")


class IncrementalETL:
    """
    Orchestrates the incremental synchronization process.
    
    Scope:
    1. Checks for new sittings since last run.
    2. Syncs Votes and MPs for new sittings.
    3. Triggers secondary sub-ETLs (Bills, Interpellations, AI Enrichment).
    """
    def __init__(self, term: int = 10):
        self.term = term
        self.term = term
        self.state = load_state()
        self.summary = []

    def run_with_retries(self, func, name, retries=2):
        """Run a function with retries."""
        for attempt in range(1, retries + 2):
            try:
                logger.info(f"[{name}] Attempt {attempt}/{retries + 1}...")
                count = func()
                logger.info(f"[{name}] Success!")
                self.summary.append(f"✅ {name}: Success ({count if isinstance(count, int) else 'OK'})")
                return True
            except Exception as e:
                logger.error(f"[{name}] Failed attempt {attempt}: {e}")
                if attempt <= retries:
                    time.sleep(5) # Wait before retry
                else:
                    self.summary.append(f"❌ {name}: Failed after {retries + 1} attempts. Error: {e}")
        return False

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
        
        # Sync MPs first (Always check for new MPs)
        sync_new_mps(self.term)

        if not new_sittings:
            logger.info("Votes up to date. Checking other data...")
        else:
            logger.info(f"New sittings to sync: {new_sittings}")
            
            # Sync new sittings
            
            # Sync new sittings
            total_votes = 0
            for sitting in new_sittings:
                votes = sync_sitting_votes(self.term, sitting)
                total_votes += votes
            
            # Sync Speeches for new sittings
            logger.info("Syncing Speeches for new sittings...")
            try:
                SpeechesETL(term=self.term).process_sittings(new_sittings)
            except Exception as e:
                logger.error(f"Error syncing speeches: {e}")

            # Group Votes for new sittings (Vote Clarity)
            logger.info("Grouping votes for new sittings...")
            try:
                # Use correct method run(sitting=...)
                grouping_etl = VoteGroupingETL(term=self.term)
                for s in new_sittings:
                    grouping_etl.run(sitting=s)
            except Exception as e:
                logger.error(f"Error grouping votes: {e}")
            
            # Update state
            self.state["last_sync"][str(self.term)] = api_latest
            save_state(self.state)
            
            logger.info("=" * 60)
            logger.info(f"New sittings: {len(new_sittings)}, New votes: {total_votes}")
        
        # Always run other ETLs
        self.run_other_etls()
        
        logger.info("=" * 60)
        logger.info("INCREMENTAL SYNC SUMMARY")
        for line in self.summary:
            logger.info(line)
        logger.info("=" * 60)

    def run_other_etls(self):
        """Run all other ETL processes sequentially."""
        logger.info("--- Starting Additional Data Sync ---")
        
        etls = [
            (BillsETL, "Bills"),
            (InterpellationsETL, "Interpellations"),
            (CommitteesETL, "Committees"),
            (DeclarationsETL, "Asset Declarations"),
            (PDFReplyExtractor, "PDF Replies"), # Auto-extract content
            (BillVoteLinker, "Linking Votes"),
            (EuroparlETL, "Europarl Votes"),
            (SittingSummarizer, "AI Sitting Summaries"), # Requires GEMINI_API_KEY
            (AIEnrichmentETL, "AI Vote Enrichment"),     # Real Gemini-powered analyses
            (SocialsETL, "MP Socials Discovery"),        # Requires GEMINI_API_KEY
            (VoteGroupingETL, "Vote Grouping (Clarity)"),
            # Run stats LAST to include all new data
            # Run stats LAST to include all new data
            (lambda: type('StatsETL', (), {'run': calculate_stats})(), "Stats Recalculation")
        ]
        
        for etl_cls, name in etls:
            def _run_wrapper():
                etl = etl_cls()
                etl.run()
                return "Done"
            
            self.run_with_retries(_run_wrapper, name)

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
