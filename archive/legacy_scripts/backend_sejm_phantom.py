import requests
import time
import re
import unicodedata
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from backend.core.db import db
from backend.core.logger import get_logger
from backend.services.ml import vote_intelligence # Use new service

logger = get_logger("etl.sejm")

BASE_API_URL = "https://api.sejm.gov.pl/sejm"
TARGET_TERMS = [10]

def create_session():
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))
    return session

session = create_session()

def generate_slug(text):
    if not text: return ""
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text).lower()
    return re.sub(r'[-\s_]+', '-', text).strip('-')

class SejmETL:
    def sync_mps(self, term):
        logger.info(f"Fetching MPs for Term {term}...")
        try:
            resp = session.get(f"{BASE_API_URL}/term{term}/MP")
            mps = resp.json()
            logger.info(f"Found {len(mps)} MPs.")

            with db.get_cursor(commit=True) as cur:
                for idx, mp in enumerate(mps):
                    api_id = mp['id']
                    db_id = api_id if term == 10 else term * 10000 + api_id
                    
                    # Fetch detailed info (occasionally or always? Optimization needed later)
                    # For now, stick to basic info to speed up standardized run
                    
                    name = f"{mp.get('firstName')} {mp.get('lastName')}"
                    slug = generate_slug(name)
                    
                    sql = """
                        INSERT INTO mps (id, name, party, district, photo_url, active, term, slug, api_id, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                        ON CONFLICT (id) DO UPDATE SET
                            name = EXCLUDED.name,
                            party = EXCLUDED.party,
                            active = EXCLUDED.active,
                            updated_at = NOW();
                    """
                    cur.execute(sql, (
                        db_id, 
                        name, 
                        mp.get('club', 'Niezrzeszony'),
                        f"Okręg {mp.get('districtNum', 0)}",
                        f"https://api.sejm.gov.pl/sejm/term{term}/MP/{api_id}/photo",
                        mp.get('active', True),
                        term,
                        slug,
                        api_id
                    ))
                    
                    if idx % 100 == 0: logger.info(f"Synced {idx}/{len(mps)} MPs")
                    
        except Exception as e:
            logger.error(f"Error syncing MPs: {e}")

    def fetch_sittings(self, term):
        try:
            resp = session.get(f"{BASE_API_URL}/term{term}/proceedings")
            data = resp.json()
            return sorted([item['number'] for item in data])
        except Exception as e:
            logger.error(f"Error fetching proceedings: {e}")
            return []

    def process_sitting(self, term, sitting_num):
        logger.info(f"Processing Sitting {sitting_num}...")
        try:
            resp = session.get(f"{BASE_API_URL}/term{term}/votings/{sitting_num}")
            votes_data = resp.json()
            logger.info(f"Found {len(votes_data)} votes.")
            
            with db.get_cursor(commit=True) as cur:
                for vote in votes_data:
                    voting_num = vote['votingNumber']
                    # ID Logic
                    vote_id = (term * 10000000 + sitting_num * 10000 + voting_num) if term != 10 else (sitting_num * 10000 + voting_num)

                    # Intelligence
                    title = vote.get('title', '')
                    desc = vote.get('description', '') or ''
                    # Scores
                    y, n, a = int(vote.get('yes', 0)), int(vote.get('no', 0)), int(vote.get('abstain', 0))
                    
                    analysis = vote_intelligence.calculate_score(title, desc, y, n, a)

                    sql_vote = """
                        INSERT INTO votes (
                            id, sitting, voting_number, date, title_raw, title_clean, term, 
                            importance_score, topic_tag, category,
                            created_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                        ON CONFLICT (id) DO UPDATE SET
                            importance_score = EXCLUDED.importance_score,
                            category = EXCLUDED.category;
                    """
                    cur.execute(sql_vote, (
                        vote_id, sitting_num, voting_num, vote['date'], title, title, term,
                        analysis['importance_score'], analysis['category'], analysis['category']
                    ))
                    
                    # Store Results? (Skipping for brevity in this first pass, but logic needs to be here)
                    # Ideally we fetch results if 'vote_id' was newly inserted.
            
        except Exception as e:
            logger.error(f"Error processing sitting {sitting_num}: {e}")

    def run(self):
        logger.info("Starting Sejm ETL...")
        for term in TARGET_TERMS:
            self.sync_mps(term)
            sittings = self.fetch_sittings(term)
            for s in sittings[-3:]: # ONLY process last 3 sittings for testing/standardization speed
                self.process_sitting(term, s)

if __name__ == "__main__":
    SejmETL().run()
