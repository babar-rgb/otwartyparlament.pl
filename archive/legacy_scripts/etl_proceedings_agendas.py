#!/usr/bin/env python3
"""
ETL: Proceedings Agendas (Porządek Obrad) - FIXED VERSION
Fetches agenda for all 65 proceedings
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

def fetch_proceedings():
    """Get all proceedings"""
    resp = requests.get(f"{API_BASE}/proceedings", timeout=15)
    if resp.status_code == 200:
        return resp.json()
    return []

def fetch_proceeding_detail(number):
    """Get detailed proceeding with agenda"""
    try:
        resp = requests.get(f"{API_BASE}/proceedings/{number}", timeout=15)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        print(f"  Error fetching {number}: {e}")
    return None

def main():
    print("=" * 60)
    print("ETL: PROCEEDINGS AGENDAS (FIXED)")
    print(f"Timestamp: {datetime.now()}")
    print("=" * 60)
    
    # Clear existing
    print("\nClearing old data...")
    run_sql("DELETE FROM sitting_agendas WHERE term = 10;")
    
    # Fetch proceedings
    proceedings = fetch_proceedings()
    print(f"\nProceedings to process: {len(proceedings)}")
    
    # Identify future proceedings
    today = datetime.now().date()
    future_procs = []
    for p in proceedings:
        dates = p.get('dates', [])
        if dates:
            last_date = max(dates)
            if datetime.strptime(last_date, '%Y-%m-%d').date() >= today:
                future_procs.append(p['number'])
    
    print(f"Future/current proceedings: {future_procs}")
    
    all_agenda_items = []
    
    for proc in proceedings:
        number = proc.get('number')
        dates = proc.get('dates', [])
        date = dates[0] if dates else None
        is_current = proc.get('current', False)
        
        print(f"\nProcessing sitting {number}{'*' if is_current else ''}...")
        
        detail = fetch_proceeding_detail(number)
        if not detail:
            print(f"  No details available")
            continue
        
        # The agenda is an array of strings (topics), not objects
        agenda = detail.get('agenda', [])
        
        if not agenda:
            # Try alternative structure
            points = detail.get('points', [])
            if points:
                agenda = points
        
        print(f"  Agenda items: {len(agenda)}")
        
        for idx, item in enumerate(agenda, 1):
            # Handle both string and object formats
            if isinstance(item, str):
                title = item[:500]  # Truncate if too long
                print_num = None
                desc = ''
            elif isinstance(item, dict):
                title = (item.get('topic') or item.get('title') or str(item))[:500]
                print_num = item.get('printNumber') or item.get('print')
                desc = (item.get('description') or '')[:1000]
            else:
                title = str(item)[:500]
                print_num = None
                desc = ''
            
            all_agenda_items.append({
                'sitting_number': number,
                'point_number': idx,
                'title': title.replace("'", "''"),
                'description': desc.replace("'", "''"),
                'print_number': print_num,
                'date': date,
                'is_future': number in future_procs,
            })
    
    print(f"\nTotal agenda items: {len(all_agenda_items)}")
    
    if not all_agenda_items:
        print("No items to insert.")
        return
    
    # Batch insert
    print("Inserting agenda items...")
    inserted = 0
    
    for i in range(0, len(all_agenda_items), 50):
        batch = all_agenda_items[i:i+50]
        values = []
        
        for item in batch:
            sitting = item['sitting_number']
            point = item['point_number']
            title = item['title']
            desc = item['description']
            print_num = f"'{item['print_number']}'" if item['print_number'] else 'NULL'
            date = f"'{item['date']}'" if item['date'] else 'NULL'
            
            values.append(
                f"({sitting}, {point}, '{title}', '{desc}', {print_num}, {date}, 10)"
            )
        
        if values:
            sql = f"""
            INSERT INTO sitting_agendas 
            (sitting_number, point_number, title, description, print_number, date, term)
            VALUES {', '.join(values)}
            ON CONFLICT DO NOTHING;
            """
            stdout, stderr = run_sql(sql)
            if stderr and 'ERROR' in stderr:
                print(f"Error at batch {i}: {stderr[:100]}")
            else:
                inserted += len(batch)
    
    print(f"\n✓ Inserted {inserted} agenda items")
    
    # Verify
    stdout, _ = run_sql("SELECT count(*) as items, count(DISTINCT sitting_number) as sittings FROM sitting_agendas;")
    print(f"\nVerification:\n{stdout}")
    
    # Show future items
    stdout, _ = run_sql("""
        SELECT sitting_number, date, count(*) as items 
        FROM sitting_agendas 
        WHERE date >= CURRENT_DATE
        GROUP BY sitting_number, date
        ORDER BY date;
    """)
    print(f"Future/upcoming agendas:\n{stdout}")
    
    print("\n" + "=" * 60)
    print("ETL COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
