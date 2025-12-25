"""
Committees ETL for otwartyparlament.pl
Fetches Committee members and metadata.
Standardized version using backend.core modules.
"""
from backend.core.db import db
from backend.core.logger import get_logger
from backend.utils.http import http_session

logger = get_logger("etl.committees")

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

class CommitteesETL:
    def __init__(self):
        self.total_committees = 0
        self.total_members = 0

    def run(self):
        """Run Committees ETL."""
        logger.info("Starting Committees ETL...")
        
        # 1. Fetch all committees
        try:
            resp = http_session.get(f"{SEJM_API_URL}/committees", timeout=20)
            if resp.status_code != 200:
                logger.error(f"Failed to fetch committees: {resp.status_code}")
                return
                
            committees = resp.json()
            self.total_committees = len(committees)
            logger.info(f"Found {self.total_committees} committees")
            
            # 2. Process each committee
            for comm in committees:
                self._process_committee(comm)
                
            logger.info(f"Committees ETL Complete. Processed {self.total_committees} committees, {self.total_members} memberships.")
            
        except Exception as e:
            logger.error(f"Committees ETL failed: {e}")

    def _process_committee(self, comm_data):
        code = comm_data.get('code')
        name = comm_data.get('name')
        
        # Fetch details (members)
        members = []
        try:
            resp = http_session.get(f"{SEJM_API_URL}/committees/{code}", timeout=10)
            if resp.status_code == 200:
                details = resp.json()
                members = details.get('members', [])
        except Exception as e:
            logger.warning(f"Failed to fetch details for {code}: {e}")

        with db.get_cursor(commit=True) as cur:
            # Upsert Committee
            sql = """
                INSERT INTO committees (code, name, name_genitive, committee_type, phone, term, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    name_genitive = EXCLUDED.name_genitive,
                    committee_type = EXCLUDED.committee_type,
                    phone = EXCLUDED.phone;
            """
            cur.execute(sql, (
                code,
                name,
                comm_data.get('nameGenitive'),
                comm_data.get('type'),
                comm_data.get('phone'),
                10
            ))
            
            # Upsert Members
            if members:
                # First delete existing members for this committee (full refresh strategy for simplicity)
                cur.execute("DELETE FROM committee_members WHERE committee_code = %s AND term = 10", (code,))
                
                member_values = []
                for m in members:
                    # We need to map API ID to our DB ID if they differ, or just use API ID if they match.
                    # Assuming mps table has api_id column.
                    # We will subquery in INSERT or fetch mapping. Let's simpler:
                    # We assume mp_id in committee_members foreign key point to mps.id.
                    # We need to find mp_id by api_id (m['id']).
                    
                    # For performance, we can do it in SQL or pre-fetch mapping.
                    # Let's do it in SQL with subquery: (SELECT id FROM mps WHERE api_id = %s)
                    
                    member_values.append({
                        'code': code,
                        'api_id': m['id'],
                        'function': m.get('function'),
                        'from': m.get('from'),
                        'to': m.get('to')
                    })

                for mv in member_values:
                    sql_mem = """
                        INSERT INTO committee_members (committee_code, mp_id, function, from_date, to_date, term)
                        SELECT %s, id, %s, %s, %s, 10
                        FROM mps WHERE id = %s
                        ON CONFLICT (committee_code, mp_id, from_date) DO NOTHING;
                    """
                    cur.execute(sql_mem, (
                        mv['code'], 
                        mv['function'], 
                        mv['from'], 
                        mv['to'], 
                        mv['api_id']
                    ))
                
                self.total_members += len(members)

if __name__ == "__main__":
    CommitteesETL().run()
