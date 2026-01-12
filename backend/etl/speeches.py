"""
Speeches ETL for otwartyparlament.pl
Fetches detailed transcripts (stenograms) for sittings.
"""
import time
from backend.core.db import db
from backend.core.logger import get_logger
from backend.utils.http import http_session

logger = get_logger("etl.speeches")

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

class SpeechesETL:
    def __init__(self, term=10):
        self.term = term
        self.total_processed = 0

    def run(self, sittings=None):
        """
        Run Speeches ETL.
        :param sittings: Optional list of sitting numbers to process (e.g. [1, 2, 3]).
                         If None, processes ALL sittings.
        """
        logger.info(f"Starting Speeches ETL for Term {self.term}...")
        self.process_sittings(sittings)

    def process_sittings(self, sittings_list=None):
        """Process specific sittings."""
        if sittings_list is None:
            # 1. Get all proceedings (sittings)
            sittings_data = self._get_sittings()
            logger.info(f"Found {len(sittings_data)} sittings.")
        else:
            # Fetch metadata only for requested sittings
            # Optimization: could fetch only specific sittings if API supported it, 
            # but getting list is fast.
            all_sittings = self._get_sittings()
            sittings_data = [s for s in all_sittings if s['number'] in sittings_list]
            logger.info(f"Processing {len(sittings_data)} requested sittings: {sittings_list}")
        
        for sitting in sittings_data:
            logger.info(f"Processing sitting {sitting['number']}...")
            self._process_sitting(sitting)
            
        logger.info(f"Finished Speeches ETL. Total: {self.total_processed}")

    def _get_sittings(self):
        """Fetch list of sittings (with dates) for the term."""
        url = f"{SEJM_API_URL}/proceedings"
        resp = http_session.get(url)
        if resp.status_code != 200:
            logger.error(f"Failed to fetch proceedings: {resp.status_code}")
            return []
        
        # Extract sitting numbers sand dates
        sittings = []
        for p in resp.json():
            if 'number' in p and 'dates' in p:
                sittings.append({
                    'number': p['number'],
                    'dates': p['dates']
                })
        # Sort by number
        return sorted(sittings, key=lambda x: x['number'])

    def _process_sitting(self, sitting_data):
        """Fetch transcript for a sitting (iterating over dates)."""
        sitting_num = sitting_data['number']
        dates = sitting_data['dates']
        
        for day_date in dates:
            url = f"{SEJM_API_URL}/proceedings/{sitting_num}/{day_date}/transcripts"
            resp = http_session.get(url)
            if resp.status_code != 200:
                logger.warning(f"No transcript for sitting {sitting_num} on {day_date} (Status {resp.status_code})")
                continue

            data = resp.json()
            transcripts = data.get('statements', [])
            logger.info(f"Sitting {sitting_num} ({day_date}): Found {len(transcripts)} statements.")
            
            for statement in transcripts:
                # Ensure date is set correctly (API usually provides it but good to be sure)
                if 'date' not in statement:
                    statement['date'] = day_date
                self._upsert_statement(sitting_num, statement)
                self.total_processed += 1

    def _upsert_statement(self, sitting_num, data):
        """Save statement to DB."""
        # data keys: date, num, statement, speaker (member_id, name, ...), unvoiced, text
        
        # We only care about VOICED statements by MPs (usually have member_id)
        if data.get('unvoiced'):
            return 

        mp_id = None
        speaker_name = "Unknown"
        
        if 'memberID' in data:
            mp_id = data['memberID']
        
        if 'name' in data:
            speaker_name = data['name']
            
        statement_num = data.get('num')
        content = data.get('text')
        date_str = data.get('date') # ISO timestamp?

        # Skip if no content
        if not content:
            return

        # link_sejm construction
        # Format: https://sejm.gov.pl/Sejm10.nsf/wypowiedz.xsp?posiedzenie={sitting}&dni=1&wyp={statement_num}
        # Note: 'dni' (day) is tricky if sitting spans multiple days, but usually DAY 1 is safe default or we need to find day num.
        # API transcript doesn't explicitly give "Day of Sitting", but 'date' does.
        # Simple link: https://www.sejm.gov.pl/Sejm10.nsf/wypowiedz.xsp?posiedzenie={sitting}&wyp={statement_num} (might work?)
        # Let's verify link format later. For now, we skip storing link on individual speech unless logic is clear.
        # We can just store content.
        
        try:
            with db.get_cursor(commit=True) as cur:
                # Check if exists
                cur.execute("""
                    SELECT id FROM speeches 
                    WHERE sitting = %s AND statement_num = %s AND term = %s
                """, (sitting_num, statement_num, self.term))
                existing = cur.fetchone()
                
                if existing:
                    # Update content if missing
                    sid = existing['id']
                    cur.execute("""
                        UPDATE speeches 
                        SET content = %s, speaker_name = %s
                        WHERE id = %s
                    """, (content, speaker_name, sid))
                else:
                    # Insert
                    cur.execute("""
                        INSERT INTO speeches (mp_id, sitting, date, speaker_name, content, statement_num, term, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                    """, (mp_id, sitting_num, date_str, speaker_name, content, statement_num, self.term))
                    
        except Exception as e:
            logger.error(f"Error saving speech {sitting_num}/{statement_num}: {e}")

if __name__ == "__main__":
    etl = SpeechesETL()
    etl.run()
