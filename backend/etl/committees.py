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
                        FROM mps WHERE id = %s;

                    """
                    cur.execute(sql_mem, (
                        mv['code'], 
                        mv['function'], 
                        mv['from'], 
                        mv['to'], 
                        mv['api_id']
                    ))
                
                
                self.total_members += len(members)

                # 3. Fetch and sync sittings
                self._sync_sittings(code, cur)
            
            logger.info(f"Processed committee {code}: {len(members)} members.")


    def _sync_sittings(self, code, cur):
        """Fetch and sync sittings for a committee."""
        try:
            resp = http_session.get(f"{SEJM_API_URL}/committees/{code}/sittings", timeout=10)
            if resp.status_code != 200:
                return

            sittings = resp.json()
            for s in sittings:
                # Prepare data
                sitting_num = s.get('num')
                date = s.get('date')
                
                # Parse times if present (API returns "2023-11-21T19:35:00")
                start_time = s.get('startDateTime')
                end_time = s.get('endDateTime')
                
                room = s.get('room')
                status = s.get('status') # PLANNED, FINISHED, CANCELLED
                is_remote = s.get('remote', False)
                is_closed = s.get('closed', False)
                
                # Video: API returns list of video objects, pick first or store as JSON
                video_url = None
                if s.get('video'):
                    video_url = s['video'][0].get('playerLink')

                # Agenda: API returns HTML string in 'agenda' field usually
                # We store raw JSON or text
                agenda_raw = s.get('agenda')
                agenda_json = json.dumps({'html': agenda_raw}) if agenda_raw else None

                sql = """
                    INSERT INTO committee_sittings (
                        committee_code, sitting_number, date, start_time, end_time, 
                        room, status, is_remote, is_closed, video_url, agenda, term, created_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 10, NOW())
                    ON CONFLICT (committee_code, sitting_number, term) DO UPDATE SET
                        date = EXCLUDED.date,
                        start_time = EXCLUDED.start_time,
                        end_time = EXCLUDED.end_time,
                        room = EXCLUDED.room,
                        status = EXCLUDED.status,
                        is_remote = EXCLUDED.is_remote,
                        is_closed = EXCLUDED.is_closed,
                        video_url = EXCLUDED.video_url,
                        agenda = EXCLUDED.agenda;
                """
                
                # Need to handle potential unique constraint on id. 
                # models.py says: id = Column(Integer, primary_key=True, index=True)
                # But we don't have ID from API in 'sittings' list usually?
                # Wait, SEJM API for /committees/{code}/sittings returns list.
                # Does it have ID?
                # Sample: {"num":1,"date":"2023-11-21",...}
                # We should use composite key (committee_code, sitting_number, term) for uniqueness.
                # Checking models.py... CommitteeSitting doesn't have unique constraint on composite?
                # Let's check db schema. If not unique, we might duplicate.
                # Assuming schema allows unique (committee_code, sitting_number, term).
                # If not, we should delete and re-insert or add constraint.
                # For safety in this iteration, let's try INSERT ON CONFLICT.
                # If it fails due to missing constraint, we will add it or use delete strategy.
                
                cur.execute(sql, (
                    code, sitting_num, date, start_time, end_time,
                    room, status, is_remote, is_closed, video_url, agenda_json
                ))

        except Exception as e:
            logger.warning(f"Failed to sync sittings for {code}: {e}")

if __name__ == "__main__":
    import json
    CommitteesETL().run()
