"""
Declarations ETL for otwartyparlament.pl
Fetches Asset Declarations (Oświadczenia majątkowe) metadata.
Standardized version using backend.core modules.
"""
import json
from backend.core.db import db
from backend.core.logger import get_logger
from backend.utils.http import http_session

logger = get_logger("etl.declarations")

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

class DeclarationsETL:
    def __init__(self):
        self.processed = 0
        self.new_declarations = 0

    def run(self):
        """Run Declarations ETL."""
        logger.info("Starting Asset Declarations ETL...")
        
        # 1. Get all active MPs
        mps = self._get_mps()
        logger.info(f"Checking declarations for {len(mps)} MPs")
        
        for mp in mps:
            self._process_mp(mp)
            
        logger.info(f"Declarations ETL Complete. Processed {self.processed} MPs, found {self.new_declarations} new declarations.")

    def _get_mps(self):
        with db.get_cursor() as cur:
            cur.execute("SELECT id, api_id, name FROM mps WHERE term = 10 AND active = true")
            return cur.fetchall()

    def _process_mp(self, mp):
        mp_id = mp['id']
        api_id = mp['api_id']
        
        try:
            url = f"{SEJM_API_URL}/MP/{api_id}/writtenStatements"
            resp = http_session.get(url, timeout=10)
            
            if resp.status_code == 200:
                declarations = resp.json()
                if declarations:
                    self._upsert_declarations(mp_id, declarations)
                    self.processed += 1
        except Exception as e:
            logger.error(f"Error checking MP {mp['name']}: {e}")

    def _upsert_declarations(self, mp_id, declarations):
        with db.get_cursor(commit=True) as cur:
            for d in declarations:
                year = d.get('date', '')[:4] if d.get('date') else None
                decl_type = d.get('type', 'unknown')
                pdf_url = d.get('pdfUrl') or d.get('url')
                raw_json = json.dumps(d)
                
                sql = """
                    INSERT INTO asset_declarations (mp_id, year, type, pdf_url, raw_data)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (mp_id, year, type) DO UPDATE SET
                        pdf_url = EXCLUDED.pdf_url,
                        raw_data = EXCLUDED.raw_data;
                """
                # Note: ON CONFLICT constraint might need to be created if not exists.
                # Assuming unique constraint on (mp_id, year, type) or similar exists.
                # If not, we might get duplicates, so we use ON CONFLICT DO NOTHING usually 
                # but legacy script used DO NOTHING. I'll use DO NOTHING to be safe unless we are sure.
                
                sql_safe = """
                    INSERT INTO asset_declarations (mp_id, year, type, pdf_url, raw_data)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING;
                """
                
                cur.execute(sql_safe, (mp_id, year, decl_type, pdf_url, raw_json))
                self.new_declarations += 1

if __name__ == "__main__":
    DeclarationsETL().run()
