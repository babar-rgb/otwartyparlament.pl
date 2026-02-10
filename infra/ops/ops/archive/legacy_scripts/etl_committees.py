#!/usr/bin/env python3
"""
ENTERPRISE FIX: Fetch ALL Committees Data
Fills: 0 → 39 committees with full member rosters
"""
import requests
import os
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_BASE = "https://api.sejm.gov.pl/sejm/term10"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_tables():
    """Create committees tables if not exist"""
    print("Creating tables...")
    
    # Using direct SQL via psql since Supabase client doesn't support DDL
    import subprocess
    sql = """
    CREATE TABLE IF NOT EXISTS committees (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        name_genitive TEXT,
        committee_type TEXT,
        phone TEXT,
        term INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS committee_members (
        id SERIAL PRIMARY KEY,
        committee_code TEXT NOT NULL,
        mp_id INTEGER REFERENCES mps(id),
        function TEXT,
        from_date DATE,
        to_date DATE,
        term INTEGER DEFAULT 10,
        UNIQUE(committee_code, mp_id, from_date)
    );
    
    CREATE INDEX IF NOT EXISTS idx_committee_members_mp ON committee_members(mp_id);
    CREATE INDEX IF NOT EXISTS idx_committee_members_code ON committee_members(committee_code);
    """
    
    result = subprocess.run(
        ['/opt/homebrew/opt/postgresql@17/bin/psql', '-d', 'otwarty_parlament', '-c', sql],
        capture_output=True, text=True
    )
    print(result.stdout or result.stderr)

def fetch_committees():
    """Fetch committee list"""
    print("\nFetching committees from API...")
    resp = requests.get(f"{API_BASE}/committees", timeout=15)
    if resp.status_code != 200:
        print(f"Error: {resp.status_code}")
        return []
    
    return resp.json()

def fetch_committee_details(code):
    """Fetch single committee with members"""
    resp = requests.get(f"{API_BASE}/committees/{code}", timeout=15)
    if resp.status_code == 200:
        return resp.json()
    return None

def main():
    print("=== ENTERPRISE FIX: Committees ETL ===")
    print(f"Timestamp: {datetime.now()}")
    
    # Create tables
    create_tables()
    
    # Fetch committees
    committees = fetch_committees()
    print(f"Found {len(committees)} committees")
    
    # Load MP mapping
    print("\nLoading MP mapping...")
    mps_res = supabase.table('mps').select('id, api_id, name').eq('term', 10).execute()
    mp_by_api_id = {mp['api_id']: mp['id'] for mp in mps_res.data}
    print(f"Loaded {len(mp_by_api_id)} MPs")
    
    all_committees = []
    all_members = []
    
    for comm in committees:
        code = comm.get('code')
        name = comm.get('name')
        
        print(f"\nProcessing: {name} ({code})")
        
        # Store committee
        committee_data = {
            'code': code,
            'name': name,
            'name_genitive': comm.get('nameGenitive'),
            'committee_type': comm.get('type'),
            'phone': comm.get('phone'),
            'term': 10
        }
        all_committees.append(committee_data)
        
        # Fetch members
        details = fetch_committee_details(code)
        if details and 'members' in details:
            members = details.get('members', [])
            print(f"  Members: {len(members)}")
            
            for member in members:
                mp_api_id = member.get('id')
                mp_id = mp_by_api_id.get(mp_api_id)
                
                if mp_id:
                    member_data = {
                        'committee_code': code,
                        'mp_id': mp_id,
                        'function': member.get('function'),
                        'from_date': member.get('from'),
                        'to_date': member.get('to'),
                        'term': 10
                    }
                    all_members.append(member_data)
        else:
            print(f"  No member details available")
    
    # Upsert committees
    print(f"\nUpserting {len(all_committees)} committees...")
    if all_committees:
        try:
            supabase.table('committees').upsert(all_committees, on_conflict='code').execute()
            print("✓ Committees saved")
        except Exception as e:
            print(f"Error: {e}")
    
    # Upsert members
    print(f"Upserting {len(all_members)} committee members...")
    if all_members:
        try:
            # Clear existing and insert fresh
            supabase.table('committee_members').delete().eq('term', 10).execute()
            
            for i in range(0, len(all_members), 50):
                batch = all_members[i:i+50]
                supabase.table('committee_members').insert(batch).execute()
                print(f"  Inserted {min(i+50, len(all_members))}/{len(all_members)}")
            
            print("✓ Members saved")
        except Exception as e:
            print(f"Error: {e}")
    
    # Verify
    print("\n=== VERIFICATION ===")
    comm_count = supabase.table('committees').select('id', count='exact').execute()
    print(f"Committees in DB: {comm_count.count}")
    
    member_count = supabase.table('committee_members').select('id', count='exact').execute()
    print(f"Committee memberships: {member_count.count}")
    
    print("\n=== COMPLETE ===")

if __name__ == "__main__":
    main()
