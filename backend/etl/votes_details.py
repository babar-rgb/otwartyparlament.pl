"""
Vote Details ETL for otwartyparlament.pl
Fetches detailed individual voting results (who voted how) for every vote.
DEEP FETCH - High volume of requests.
"""
from backend.core.db import db
from backend.core.logger import get_logger
from backend.utils.http import http_session
import time

logger = get_logger("etl.votes_details")

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

def run_votes_details_etl():
    logger.info("Starting Vote Details ETL (Deep Fetch)...")
    
    # 1. Get all votes that need processing
    # We could check which ones are missing from vote_results
    # But for safety/simplicity let's iterate all votes in DB and check if results exist
    
    with db.get_cursor() as cur:
        cur.execute("SELECT sitting, voting_number, date FROM votes ORDER BY date DESC, sitting DESC, voting_number DESC")
        all_votes = cur.fetchall()
        
    logger.info(f"Found {len(all_votes)} votes to check.")
    
    processed = 0
    skipped = 0
    errors = 0
    
    # Pre-check existence to skip processed ones efficiently
    # Fetch all (sitting, votingNumber) tuples from vote_results logic?
    # Better: check count per vote.
    # Actually, simpler loop:
    
    for vote in all_votes:
        sitting, voting_num, date_iso = vote
        
        try:
            # Check if we have results for this vote
            # We need vote_id.
            # Wait, `vote_results` needs `vote_id`.
            # We need to SELECT id FROM votes WHERE sitting=... AND votingNumber=...
            # The query above didn't get ID.
            # Let's optimize loop.
            
            with db.get_cursor() as cur:
                cur.execute("SELECT id FROM votes WHERE sitting=%s AND voting_number=%s", (sitting, voting_num))
                vote_db_id = cur.fetchone()[0]
                
                # Check if results exist
                cur.execute("SELECT 1 FROM vote_results WHERE vote_id = %s LIMIT 1", (vote_db_id,))
                if cur.fetchone():
                    # Already fetched
                    skipped += 1
                    if skipped % 100 == 0:
                        logger.info(f"Skipped {skipped} existing votes...")
                    continue

                # Fetch from API
                # URL: /term10/votings/{sitting}/{voting}
                url = f"{SEJM_API_URL}/votings/{sitting}/{voting_num}"
                resp = http_session.get(url, timeout=15)
                
                if resp.status_code != 200:
                    logger.error(f"Failed to fetch {sitting}/{voting_num}: {resp.status_code}")
                    errors += 1
                    continue
                    
                data = resp.json()
                # data = { term, sitting, votingNumber, title, votes: [ { MP: 1, vote: "Za", club: "PiS" }, ... ] }
                
                indiv_votes = data.get('votes', [])
                
                # Insert into vote_results
                # Model columns: vote_id, mp_id, result
                # API returns MP ID as 'MP'.
                # We need to map MP ID (Sejm) to Internal DB ID?
                # My mps table: id (Serial) ?? Or Sejm ID?
                # `seed_full` uses `incremental.py` which uses `id` from API as `id`.
                # So MP ID in DB matches API ID. (Hopefully).
                
                rows_to_insert = []
                for v in indiv_votes:
                    mp_api_id = v.get('MP')
                    result_text = v.get('vote') # "Za", "Przeciw", ...
                    # club = v.get('club') # redundant, in mps table
                    
                    if not mp_api_id:
                        continue # Some votes might be anonymous? Usually not.
                        
                    rows_to_insert.append((vote_db_id, mp_api_id, result_text))
                    
                if rows_to_insert:
                   args_str = ','.join(cur.mogrify("(%s,%s,%s)", x).decode('utf-8') for x in rows_to_insert)
                   cur.execute("INSERT INTO vote_results (vote_id, mp_id, result) VALUES " + args_str)
                
                # Commit every vote (safer for long run)
                db.conn.commit()
                processed += 1
                if processed % 10 == 0:
                   logger.info(f"Processed {processed} votes (Fetched {len(rows_to_insert)} results each).")
                   
        except Exception as e:
            logger.error(f"Error processing {sitting}/{voting_num}: {e}")
            errors += 1
            db.conn.rollback()
            
    logger.info(f"Deep Fetch Complete. Processed: {processed}, Skipped: {skipped}, Errors: {errors}")

if __name__ == "__main__":
    run_votes_details_etl()
