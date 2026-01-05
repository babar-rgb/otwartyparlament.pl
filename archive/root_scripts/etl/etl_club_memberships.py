#!/usr/bin/env python3
"""
ETL: Club Memberships History
Fetches historical club changes from Sejm API
"""
import requests
import os
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_BASE = "https://api.sejm.gov.pl"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_clubs(term=10):
    """Fetch club data from API"""
    url = f"{API_BASE}/sejm/term{term}/clubs"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        else:
            print(f"Error: API returned {resp.status_code}")
            return []
    except Exception as e:
        print(f"Error fetching clubs: {e}")
        return []

def fetch_club_members(term, club_code):
    """Fetch members of a specific club"""
    url = f"{API_BASE}/sejm/term{term}/clubs/{club_code}"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return data.get('members', [])
        return []
    except Exception as e:
        print(f"Error fetching {club_code}: {e}")
        return []

def main():
    print("=== Fetching Club Memberships ===")
    
    # Fetch all clubs
    clubs = fetch_clubs(term=10)
    print(f"Found {len(clubs)} clubs")
    
    all_memberships = []
    
    for club in clubs:
        code = club.get('id') or club.get('code')
        name = club.get('name') or club.get('nazwa')
        
        print(f"\nProcessing: {name} ({code})")
        
        # Fetch detailed members info
        members = fetch_club_members(10, code)
        
        if not members:
            # Fallback: use basic data from clubs list
            members_count = club.get('membersCount', 0)
            print(f"  Members: {members_count} (details not available)")
            continue
        
        for member in members:
            # Extract MP info
            mp_id_api = member.get('id')
            first_name = member.get('firstName', '')
            last_name = member.get('lastName', '')
            full_name = f"{first_name} {last_name}".strip()
            
            # Find MP in our database
            mp_res = supabase.table('mps').select('id').eq('api_id', mp_id_api).eq('term', 10).execute()
            
            if not mp_res.data:
                print(f"  MP not found: {full_name} (API ID: {mp_id_api})")
                continue
            
            mp_id = mp_res.data[0]['id']
            
            # Get membership period
            from_date = member.get('from') or '2023-11-13'  # Term 10 start
            to_date = member.get('to')  # None if current
            
            membership = {
                'mp_id': mp_id,
                'club_code': code,
                'club_name': name,
                'from_date': from_date,
                'to_date': to_date,
                'term': 10
            }
            
            all_memberships.append(membership)
    
    print(f"\nTotal memberships to upsert: {len(all_memberships)}")
    
    if all_memberships:
        # Upsert
        try:
            # Delete existing for term 10 first
            supabase.table('club_memberships').delete().eq('term', 10).execute()
            
            # Insert new
            batch_size = 50
            for i in range(0, len(all_memberships), batch_size):
                batch = all_memberships[i:i+batch_size]
                supabase.table('club_memberships').insert(batch).execute()
                print(f"✓ Inserted {min(i+batch_size, len(all_memberships))}/{len(all_memberships)}")
            
            print("=== ETL Complete ===")
            
            # Summary
            res = supabase.table('club_memberships').select('club_code', count='exact').eq('term', 10).execute()
            print(f"\nTotal memberships in DB: {res.count}")
            
        except Exception as e:
            print(f"Error upserting: {e}")
    else:
        print("No memberships to insert")

if __name__ == "__main__":
    main()
