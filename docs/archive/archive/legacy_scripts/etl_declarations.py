#!/usr/bin/env python3
"""
ETL: MP Asset Declarations (Oświadczenia Majątkowe)
Fetches declarations from Sejm API for all MPs
"""
import requests
import subprocess
import json
import os
from datetime import datetime

API_BASE = "https://api.sejm.gov.pl/sejm/term10"

def get_mp_mapping():
    """Get MP API IDs to DB IDs mapping"""
    result = subprocess.run(
        ['/opt/homebrew/opt/postgresql@17/bin/psql', '-d', 'otwarty_parlament', '-At', '-c',
         'SELECT api_id, id, name FROM mps WHERE term = 10 AND active = true;'],
        capture_output=True, text=True
    )
    
    mapping = {}
    for line in result.stdout.strip().split('\n'):
        if '|' in line:
            parts = line.split('|')
            if len(parts) >= 3:
                api_id, db_id, name = parts[0], parts[1], parts[2]
                mapping[int(api_id)] = {'db_id': int(db_id), 'name': name}
    return mapping

def fetch_mp_declarations(mp_api_id):
    """Fetch declarations for a single MP"""
    url = f"{API_BASE}/MP/{mp_api_id}/writtenStatements"
    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code == 200:
            return resp.json()
    except:
        pass
    return []

def main():
    print("=== ETL: Asset Declarations ===")
    print(f"Timestamp: {datetime.now()}")
    
    # Get existing declarations count
    result = subprocess.run(
        ['/opt/homebrew/opt/postgresql@17/bin/psql', '-d', 'otwarty_parlament', '-At', '-c',
         'SELECT count(*) FROM asset_declarations;'],
        capture_output=True, text=True
    )
    existing = int(result.stdout.strip()) if result.stdout.strip().isdigit() else 0
    print(f"Existing declarations: {existing}")
    
    # Get MP mapping
    mp_map = get_mp_mapping()
    print(f"MPs to process: {len(mp_map)}")
    
    # Check which MPs already have declarations
    result = subprocess.run(
        ['/opt/homebrew/opt/postgresql@17/bin/psql', '-d', 'otwarty_parlament', '-At', '-c',
         'SELECT DISTINCT mp_id FROM asset_declarations;'],
        capture_output=True, text=True
    )
    existing_mp_ids = set()
    for line in result.stdout.strip().split('\n'):
        if line.strip().isdigit():
            existing_mp_ids.add(int(line.strip()))
    
    print(f"MPs with declarations: {len(existing_mp_ids)}")
    
    # Process MPs without declarations
    new_declarations = []
    processed = 0
    
    for api_id, mp_info in mp_map.items():
        db_id = mp_info['db_id']
        name = mp_info['name']
        
        if db_id in existing_mp_ids:
            continue
        
        declarations = fetch_mp_declarations(api_id)
        
        if declarations:
            for decl in declarations:
                # Parse declaration data
                year = decl.get('date', '')[:4] if decl.get('date') else None
                decl_type = decl.get('type', 'unknown')
                pdf_url = decl.get('pdfUrl') or decl.get('url')
                
                new_declarations.append({
                    'mp_id': db_id,
                    'year': year,
                    'type': decl_type,
                    'pdf_url': pdf_url,
                    'raw_data': json.dumps(decl)
                })
            
            print(f"✓ {name}: {len(declarations)} declarations")
        else:
            print(f"- {name}: No declarations found")
        
        processed += 1
        if processed % 50 == 0:
            print(f"Progress: {processed}/{len(mp_map) - len(existing_mp_ids)}")
    
    print(f"\nNew declarations to insert: {len(new_declarations)}")
    
    if new_declarations:
        # Batch insert via SQL
        for i in range(0, len(new_declarations), 50):
            batch = new_declarations[i:i+50]
            values = []
            for d in batch:
                mp_id = d['mp_id']
                year = f"'{d['year']}'" if d['year'] else 'NULL'
                dtype = d['type'].replace("'", "''")
                pdf = (d['pdf_url'] or '').replace("'", "''")
                raw = d['raw_data'].replace("'", "''")
                values.append(f"({mp_id}, {year}, '{dtype}', '{pdf}', '{raw}')")
            
            if values:
                sql = f"""
                INSERT INTO asset_declarations (mp_id, year, type, pdf_url, raw_data)
                VALUES {', '.join(values)}
                ON CONFLICT DO NOTHING;
                """
                subprocess.run(
                    ['/opt/homebrew/opt/postgresql@17/bin/psql', '-d', 'otwarty_parlament', '-c', sql],
                    capture_output=True
                )
        
        print("✓ Declarations inserted")
    
    # Verify
    result = subprocess.run(
        ['/opt/homebrew/opt/postgresql@17/bin/psql', '-d', 'otwarty_parlament', '-At', '-c',
         'SELECT count(*) FROM asset_declarations;'],
        capture_output=True, text=True
    )
    final_count = result.stdout.strip()
    print(f"\nFinal count: {final_count}")
    print("=== COMPLETE ===")

if __name__ == "__main__":
    main()
