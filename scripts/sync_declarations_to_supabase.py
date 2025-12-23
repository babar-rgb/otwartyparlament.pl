#!/usr/bin/env python3
"""
Sync asset declarations from local PostgreSQL to Supabase.
Also fetches fresh data from Sejm API if needed.
"""

import os
import subprocess
import json
import requests
import re
from supabase import create_client

# Load .env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#') and '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing Supabase credentials")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

API_BASE = "https://api.sejm.gov.pl/sejm/term10"


def fetch_mp_declarations_from_api(mp_api_id):
    """Fetch declarations from Sejm API"""
    url = f"{API_BASE}/MP/{mp_api_id}/writtenStatements"
    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code == 200:
            return resp.json()
    except:
        pass
    return []


def parse_money_string(s):
    """Parse Polish money string to float"""
    if s is None:
        return 0.0
    if isinstance(s, (int, float)):
        return float(s)
    if isinstance(s, str):
        # Remove words and keep numbers
        s = s.replace('PLN', '').replace('zł', '').replace('złotych', '')
        s = s.replace('tys.', '000').replace('tyś.', '000')
        s = s.replace(' ', '').replace(',', '.')
        # Extract first number
        match = re.search(r'[\d.]+', s)
        if match:
            try:
                return float(match.group())
            except:
                pass
    return 0.0


def main():
    print("=== Syncing Declarations to Supabase ===")
    
    # 1. Get all MPs from Supabase
    result = supabase.table('mps').select('id, api_id, name').eq('active', True).execute()
    mps = {mp['api_id']: {'id': mp['id'], 'name': mp['name']} for mp in result.data if mp.get('api_id')}
    print(f"Found {len(mps)} MPs in Supabase")
    
    # 2. Get existing declarations from Supabase
    existing = supabase.table('asset_declarations').select('mp_id, pdf_url').execute()
    existing_set = {(d['mp_id'], d['pdf_url']) for d in existing.data}
    print(f"Existing declarations in Supabase: {len(existing_set)}")
    
    # 3. Fetch from API and insert
    new_count = 0
    for api_id, mp_info in mps.items():
        declarations = fetch_mp_declarations_from_api(api_id)
        
        for decl in declarations:
            pdf_url = decl.get('pdfUrl') or decl.get('url')
            if not pdf_url:
                continue
                
            # Skip if already exists
            if (mp_info['id'], pdf_url) in existing_set:
                continue
            
            year = decl.get('date', '')[:4] if decl.get('date') else None
            
            try:
                supabase.table('asset_declarations').insert({
                    'mp_id': mp_info['id'],
                    'pdf_url': pdf_url,
                    'year': year or decl.get('date'),
                    'parsed_content': None,
                    'summary': None
                }).execute()
                new_count += 1
                existing_set.add((mp_info['id'], pdf_url))
            except Exception as e:
                pass  # Skip duplicates
        
        if new_count > 0 and new_count % 50 == 0:
            print(f"  Inserted {new_count} new declarations...")
    
    print(f"\nInserted {new_count} new declarations")
    
    # 4. Now sync parsed_content from local PostgreSQL
    print("\n--- Syncing parsed content from local DB ---")
    
    result = subprocess.run(
        ['/opt/homebrew/opt/postgresql@17/bin/psql', '-d', 'otwarty_parlament', '-At', '-c',
         "SELECT mp_id, year, parsed_content::text, summary FROM asset_declarations WHERE parsed_content IS NOT NULL;"],
        capture_output=True, text=True
    )
    
    if result.returncode != 0:
        print("Could not read from local PostgreSQL")
        return
    
    synced = 0
    for line in result.stdout.strip().split('\n'):
        if not line or '|' not in line:
            continue
        parts = line.split('|')
        if len(parts) < 4:
            continue
        
        mp_id = int(parts[0])
        year = parts[1]
        parsed_json = parts[2]
        summary = parts[3]
        
        try:
            parsed_content = json.loads(parsed_json)
            
            # Update in Supabase
            supabase.table('asset_declarations').update({
                'parsed_content': parsed_content,
                'summary': summary
            }).eq('mp_id', mp_id).like('year', f'{year[:4]}%').execute()
            synced += 1
        except Exception as e:
            pass
    
    print(f"Synced {synced} parsed declarations")
    
    # 5. Final stats
    final = supabase.table('asset_declarations').select('id', count='exact').execute()
    parsed = supabase.table('asset_declarations').select('id', count='exact').neq('parsed_content', None).execute()
    
    print(f"\n=== Final Stats ===")
    print(f"Total declarations: {final.count}")
    print(f"Parsed declarations: {parsed.count}")
    print("=== DONE ===")


if __name__ == "__main__":
    main()
