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
                    # Fetch proper content
                    import json
                    i_id = item['num']
                    title = item.get('title', '')
                    sent_date = item.get('sentDate')
                    last_modified = item.get('lastModified')
                    raw_json = json.dumps(item)

                    try:
                        body_url = f"{SEJM_API_URL}/interpellations/{i_id}/body"
                        body_resp = http_session.get(body_url, timeout=5)
                        content = body_resp.text if body_resp.status_code == 200 else None
                    except:
                        content = None # Fallback

                    sql = """
                        INSERT INTO interpellations (id, title, sent_date, last_modified, raw_data, term, content)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE SET
                            title = EXCLUDED.title,
                            last_modified = EXCLUDED.last_modified,
                            raw_data = EXCLUDED.raw_data,
                            content = COALESCE(EXCLUDED.content, interpellations.content);
                    """
                        item.get('lastModified'),
                        json.dumps(item)
                    ))
                    
                    # Upsert authors
                    if 'from' in item:
                        for mp_id in item['from']:
                                try:
                                    mp_id_int = int(mp_id)
                                    # Verify MP exists
                                    cur.execute("SELECT 1 FROM mps WHERE id = %s", (mp_id_int,))
                                    if not cur.fetchone():
                                        # JIT Fetch: Try to get this MP from API
                                        logger.info(f"⚠️ MP {mp_id_int} missing. Attempting JIT fetch...")
                                        if self._fetch_and_insert_mp(cur, mp_id_int):
                                            logger.info(f"✅ JIT Fetch successful for MP {mp_id_int}")
                                        else:
                                            logger.warning(f"❌ Failed to find MP {mp_id_int} even via JIT. Skipping author.")
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



    def _fetch_and_insert_mp(self, cur, mp_id):
        """Fetch individual MP from API and insert into DB."""
        try:
            url = f"{SEJM_API_URL}/MP/{mp_id}"
            resp = http_session.get(url, timeout=10)
            if resp.status_code == 200:
                mp = resp.json()
                first_name = mp.get('firstName', '')
                last_name = mp.get('lastName', '')
                club = mp.get('club', 'Niezrzeszony')
                active = mp.get('active', False)
                
                birth_date = mp.get('birthDate')
                birth_location = mp.get('birthLocation')
                profession = mp.get('profession')
                education_level = mp.get('educationLevel')
                import json
                education_history = json.dumps(mp.get('educations', []))
                
                sql = """
                    INSERT INTO mps (id, first_name, last_name, club, term, active, 
                                     birth_date, birth_location, profession, education_level, education_history,
                                     created_at)
                    VALUES (%s, %s, %s, %s, 10, %s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (id) DO UPDATE SET
                        first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name,
                        active = EXCLUDED.active,
                        club = EXCLUDED.club,
                        birth_date = EXCLUDED.birth_date,
                        birth_location = EXCLUDED.birth_location,
                        profession = EXCLUDED.profession,
                        education_level = EXCLUDED.education_level,
                        education_history = EXCLUDED.education_history;
                """
                cur.execute(sql, (mp['id'], first_name, last_name, club, active,
                                  birth_date, birth_location, profession, education_level, education_history))
                return True
        except Exception as e:
            logger.error(f"JIT MP fetch error: {e}")
        return False


if __name__ == "__main__":
    etl = InterpellationsETL()
    etl.run()
