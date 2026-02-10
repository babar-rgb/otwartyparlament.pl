#!/usr/bin/env python3
"""
ETL: Committee Sittings (Posiedzenia Komisji)
Fetches all sittings for all 39 committees (~2,800 records)
"""
import requests
import subprocess
import json
from datetime import datetime

API_BASE = "https://api.sejm.gov.pl/sejm/term10"

def run_sql(sql):
    """Execute SQL via psql"""
    result = subprocess.run(
        ['/opt/homebrew/opt/postgresql@17/bin/psql', '-d', 'otwarty_parlament', '-c', sql],
        capture_output=True, text=True
    )
    return result.stdout, result.stderr

def fetch_committees():
    """Get all committees"""
    resp = requests.get(f"{API_BASE}/committees", timeout=15)
    if resp.status_code == 200:
        return resp.json()
    return []

def fetch_committee_sittings(code):
    """Get all sittings for a committee"""
    try:
        resp = requests.get(f"{API_BASE}/committees/{code}/sittings", timeout=15)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        print(f"  Error: {e}")
    return []

def main():
    print("=" * 60)
    print("ETL: COMMITTEE SITTINGS")
    print(f"Timestamp: {datetime.now()}")
    print("=" * 60)
    
    # Get committees
    committees = fetch_committees()
    print(f"\nCommittees to process: {len(committees)}")
    
    all_sittings = []
    total_fetched = 0
    
    for comm in committees:
        code = comm.get('code')
        name = comm.get('name', code)
        
        sittings = fetch_committee_sittings(code)
        
        if sittings:
            print(f"✓ {code}: {len(sittings)} sittings")
            total_fetched += len(sittings)
            
            for s in sittings:
                sitting = {
                    'committee_code': code,
                    'sitting_number': s.get('num'),
                    'date': s.get('date'),
                    'start_time': s.get('startDateTime'),
                    'end_time': s.get('endDateTime'),
                    'room': s.get('room'),
                    'status': s.get('status'),
                    'is_remote': s.get('remote', False),
                    'is_closed': s.get('closed', False),
                    'video_url': s.get('video'),
                    'agenda': json.dumps(s.get('agenda', [])),
                }
                all_sittings.append(sitting)
        else:
            print(f"- {code}: No sittings")
    
    print(f"\nTotal sittings fetched: {total_fetched}")
    
    if not all_sittings:
        print("No sittings to insert.")
        return
    
    # Clear existing and insert
    print("\nClearing old data...")
    run_sql("DELETE FROM committee_sittings WHERE term = 10;")
    
    # Batch insert
    print("Inserting sittings...")
    inserted = 0
    
    for i in range(0, len(all_sittings), 50):
        batch = all_sittings[i:i+50]
        values = []
        
        for s in batch:
            code = s['committee_code']
            num = s['sitting_number'] or 0
            date = f"'{s['date']}'" if s['date'] else 'NULL'
            start = f"'{s['start_time']}'" if s['start_time'] else 'NULL'
            end = f"'{s['end_time']}'" if s['end_time'] else 'NULL'
            room = (s['room'] or '').replace("'", "''")
            status = (s['status'] or '').replace("'", "''")
            remote = 'TRUE' if s['is_remote'] else 'FALSE'
            closed = 'TRUE' if s['is_closed'] else 'FALSE'
            video_raw = s['video_url']
            if isinstance(video_raw, list):
                video = video_raw[0] if video_raw else ''
            else:
                video = video_raw or ''
            video = str(video).replace("'", "''")
            agenda = s['agenda'].replace("'", "''")
            
            values.append(
                f"('{code}', {num}, {date}, {start}, {end}, '{room}', '{status}', "
                f"{remote}, {closed}, '{video}', '{agenda}', 10)"
            )
        
        if values:
            sql = f"""
            INSERT INTO committee_sittings 
            (committee_code, sitting_number, date, start_time, end_time, room, status, 
             is_remote, is_closed, video_url, agenda, term)
            VALUES {', '.join(values)}
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
            stdout, stderr = run_sql(sql)
            if stderr and 'ERROR' in stderr:
                print(f"Error at batch {i}: {stderr[:100]}")
            else:
                inserted += len(batch)
        
        if (i + 50) % 200 == 0:
            print(f"  Inserted {inserted}...")
    
    print(f"\n✓ Inserted {inserted} sittings")
    
    # Verify
    stdout, _ = run_sql("SELECT count(*) FROM committee_sittings;")
    print(f"\nFinal count: {stdout.strip()}")
    
    # Show sample
    stdout, _ = run_sql("""
        SELECT committee_code, count(*) as sittings 
        FROM committee_sittings 
        GROUP BY committee_code 
        ORDER BY sittings DESC 
        LIMIT 5;
    """)
    print(f"\nTop committees by sittings:\n{stdout}")
    
    print("\n" + "=" * 60)
    print("ETL COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
