"""
Bills ETL for otwartyparlament.pl
Fetches legislative processes (Projekty Ustaw) from Sejm API.
"""
from backend.core.db import db
from backend.core.logger import get_logger
from backend.utils.http import http_session
import json

logger = get_logger("etl.bills")

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

class BillsETL:
    def __init__(self):
        self.total_processed = 0

    def run(self):
        """Run Bills ETL."""
        logger.info("Starting Bills ETL...")
        
        try:
            # Fetch 'processes' (Legislation)
            # This endpoint returns a list of processes
            resp = http_session.get(f"{SEJM_API_URL}/processes", timeout=30)
            if resp.status_code != 200:
                logger.error(f"Failed to fetch processes: {resp.status_code}")
                return
                
            processes = resp.json()
            logger.info(f"Found {len(processes)} processes. Processing...")
            
            inserted = 0
            
            with db.get_cursor(commit=True) as cur:
                for proc in processes:
                    p_id = proc.get('id') or proc.get('number')
                    if not p_id: p_id = f"PROC-{inserted}" 
                    title = proc.get('title')
                    description = proc.get('description')
                    date = proc.get('date')
                    status = proc.get('status', 'W toku')
                    
                    # Determine type
                    p_type = 'Inne'
                    if 'UECP' in str(p_id): p_type = 'Unijny'
                    elif 'RPL' in str(p_id): p_type = 'Rządowy'
                    elif 'RPS' in str(p_id): p_type = 'Specjalny'
                    elif 'P' in str(p_id) and not 'R' in str(p_id): p_type = 'Poselski'
                    
                    prints_list = proc.get('prints', [])
                    print_num = prints_list[0] if prints_list else None
                    if isinstance(print_num, dict):
                        print_num = print_num.get('number')
                    
                    url = None
                    if print_num:
                        url = f"https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr={print_num}"

                    sql = """
                        INSERT INTO bills (process_id, number, title, description, date, status, type, url, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                        ON CONFLICT (process_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            description = EXCLUDED.description,
                            status = EXCLUDED.status,
                            url = EXCLUDED.url;
                    """
                    cur.execute(sql, (p_id, print_num, title, description, date, status, p_type, url))
                    inserted += 1

            # Fetch 'prints' (Druki)
            logger.info("Fetching Prints (Dokumenty)...")
            resp_prints = http_session.get(f"{SEJM_API_URL}/prints", timeout=30)
            if resp_prints.status_code == 200:
                prints_data = resp_prints.json()
                logger.info(f"Found {len(prints_data)} prints. Processing...")
                
                for pr in prints_data:
                    # pr: { number, title, documentDate, deliveryDate, ... }
                    number = pr.get('number')
                    # Generate fake process_id to satisfy unique constraint
                    # We use PRINT-{number}
                    proc_id = f"PRINT-{number}"
                    
                    title = pr.get('title')
                    date = pr.get('documentDate')
                    
                    # Try to deduce type from title or number
                    p_type = 'Druk'
                    if 'rządowy' in title.lower(): p_type = 'Rządowy'
                    elif 'komisji' in title.lower(): p_type = 'Komisyjny'
                    
                    url = f"https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr={number}"
                    
                    # We upsert. Note: logic above might have already inserted this print via Process.
                    # Collision risk?
                    # Processes used true Process ID (RPS-1). This uses PRINT-1.
                    # Duplication in UI? Possible.
                    # Better to check if 'number' exists?
                    # But 'bills' table constraint is on 'process_id'.
                    # We might have 2 rows: 1 for Process, 1 for Print.
                    # Ideally we merge. But for now 'More Data' is better.
                    
                    sql = """
                        INSERT INTO bills (process_id, number, title, description, date, status, type, url, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                        ON CONFLICT (process_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            date = EXCLUDED.date;
                    """
                    cur.execute(sql, (proc_id, number, title, None, date, 'Opublikowany', p_type, url))
                    inserted += 1

                    
            logger.info(f"Bills ETL Complete. Upserted {inserted} bills.")
            
        except Exception as e:
            logger.error(f"Bills ETL failed: {e}")

if __name__ == "__main__":
    BillsETL().run()
