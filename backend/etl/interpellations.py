"""
Interpellations ETL for otwartyparlament.pl
Standardized version using backend.core modules.
"""
import time
from backend.core.db import db
from backend.core.logger import get_logger
from backend.utils.http import http_session

logger = get_logger("etl.interpellations")

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"


class InterpellationsETL:
    def __init__(self):
        self.total_imported = 0

    def run(self):
        """Import interpellations from Sejm API."""
        logger.info("Starting Interpellations Import...")
        
        offset = 0
        limit = 50
        
        while True:
            url = f"{SEJM_API_URL}/interpellations?limit={limit}&offset={offset}"
            logger.info(f"Fetching: offset={offset}")
            
            try:
                response = http_session.get(url, timeout=30)
                if response.status_code != 200:
                    logger.error(f"API error: {response.status_code}")
                    break
                    
                data = response.json()
                
                if not data:
                    logger.info("No more data to fetch")
                    break
                
                self._process_batch(data)
                
                offset += limit
                time.sleep(0.2)  # Be nice to API
                
            except Exception as e:
                logger.error(f"Error fetching batch at offset {offset}: {e}")
                break
        
        logger.info(f"Finished. Total imported: {self.total_imported}")

    def _process_batch(self, items):
        """Process a batch of interpellations."""
        for item in items:
            try:
                with db.get_cursor(commit=True) as cur:
                    # Upsert interpellation
                    sql = """
                        INSERT INTO interpellations (id, title, sent_date, last_modified, raw_data, created_at)
                        VALUES (%s, %s, %s, %s, %s, NOW())
                        ON CONFLICT (id) DO UPDATE SET
                            title = EXCLUDED.title,
                            last_modified = EXCLUDED.last_modified,
                            raw_data = EXCLUDED.raw_data;
                    """
                    import json
                    cur.execute(sql, (
                        item['num'],
                        item.get('title', ''),
                        item.get('sentDate'),
                        item.get('lastModified'),
                        json.dumps(item)
                    ))
                    
                    # Upsert authors
                    if 'from' in item:
                        for mp_id in item['from']:
                            try:
                                mp_id_int = int(mp_id)
                                # Verify MP exists to prevent FK violation
                                cur.execute("SELECT 1 FROM mps WHERE id = %s", (mp_id_int,))
                                if not cur.fetchone():
                                    logger.warning(f"⚠️ Skipping author {mp_id_int} for interpellation {item['num']}: MP not found in database")
                                    continue
                                
                                sql_author = """
                                    INSERT INTO interpellation_authors (interpellation_id, mp_id)
                                    VALUES (%s, %s)
                                    ON CONFLICT (interpellation_id, mp_id) DO NOTHING;
                                """
                                cur.execute(sql_author, (item['num'], mp_id_int))
                            except ValueError:
                                pass
                
                self.total_imported += 1
                
            except Exception as e:
                logger.error(f"Error processing interpellation {item.get('num')}: {e}")


if __name__ == "__main__":
    etl = InterpellationsETL()
    etl.run()
