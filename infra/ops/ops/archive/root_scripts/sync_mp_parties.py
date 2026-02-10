#!/usr/bin/env python3
"""
Sync MP party affiliations from the official Sejm API.
This script fixes any discrepancies between our database and the API.
"""

import requests
import psycopg2
import json

DB_NAME = "otwarty_parlament"
DB_USER = "kajtek"
DB_HOST = "localhost"
DB_PORT = "5432"

def get_db_connection():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        host=DB_HOST,
        port=DB_PORT
    )

def fetch_mps_from_api(term):
    url = f"https://api.sejm.gov.pl/sejm/term{term}/MP"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to fetch MPs for term {term}: {response.status_code}")
        return []

def sync_parties(term):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print(f"\n=== Syncing MP parties for Term {term} ===")
    
    # Fetch from API
    api_mps = fetch_mps_from_api(term)
    print(f"Fetched {len(api_mps)} MPs from API")
    
    # Build lookup: api_id -> club
    api_clubs = {}
    for mp in api_mps:
        api_clubs[mp['id']] = mp.get('club', 'niez.')
    
    # Fetch from DB
    cursor.execute("SELECT id, api_id, name, party FROM mps WHERE term = %s", (term,))
    db_mps = cursor.fetchall()
    print(f"Found {len(db_mps)} MPs in database")
    
    # Find and fix discrepancies
    updates = []
    discrepancies = []
    
    for db_id, api_id, name, db_party in db_mps:
        if api_id in api_clubs:
            api_party = api_clubs[api_id]
            if db_party != api_party:
                discrepancies.append({
                    'name': name,
                    'db_party': db_party,
                    'api_party': api_party
                })
                updates.append((api_party, db_id))
    
    # Report discrepancies
    if discrepancies:
        print(f"\n⚠️  Found {len(discrepancies)} party discrepancies:")
        print("-" * 60)
        for d in discrepancies:
            print(f"  {d['name']}: {d['db_party']} → {d['api_party']}")
        print("-" * 60)
        
        # Apply updates
        for new_party, db_id in updates:
            cursor.execute("UPDATE mps SET party = %s WHERE id = %s", (new_party, db_id))
        
        conn.commit()
        print(f"✅ Updated {len(updates)} records")
    else:
        print("✅ No discrepancies found - all parties match API")
    
    cursor.close()
    conn.close()
    
    return discrepancies

def audit_party_counts(term):
    """Compare party counts between API and DB"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print(f"\n=== Party Count Audit for Term {term} ===")
    
    # API counts
    api_mps = fetch_mps_from_api(term)
    api_counts = {}
    for mp in api_mps:
        club = mp.get('club', 'niez.')
        api_counts[club] = api_counts.get(club, 0) + 1
    
    # DB counts
    cursor.execute("""
        SELECT party, COUNT(*) as count 
        FROM mps 
        WHERE term = %s 
        GROUP BY party 
        ORDER BY count DESC
    """, (term,))
    db_counts = {row[0]: row[1] for row in cursor.fetchall()}
    
    # Compare
    all_parties = set(api_counts.keys()) | set(db_counts.keys())
    
    print(f"\n{'Party':<20} {'API':>8} {'DB':>8} {'Status':>10}")
    print("-" * 50)
    
    issues = []
    for party in sorted(all_parties):
        api_count = api_counts.get(party, 0)
        db_count = db_counts.get(party, 0)
        
        if api_count == db_count:
            status = "✅"
        else:
            status = f"❌ ({db_count - api_count:+d})"
            issues.append(party)
        
        print(f"{party:<20} {api_count:>8} {db_count:>8} {status:>10}")
    
    print("-" * 50)
    
    cursor.close()
    conn.close()
    
    return issues

if __name__ == "__main__":
    print("=" * 60)
    print("MP PARTY SYNC & AUDIT SCRIPT")
    print("=" * 60)
    
    # Audit before sync
    print("\n📊 BEFORE SYNC:")
    audit_party_counts(10)
    
    # Sync term 10
    sync_parties(10)
    
    # Sync term 9 
    sync_parties(9)
    
    # Audit after sync
    print("\n📊 AFTER SYNC:")
    audit_party_counts(10)
    
    print("\n✅ Sync complete!")
