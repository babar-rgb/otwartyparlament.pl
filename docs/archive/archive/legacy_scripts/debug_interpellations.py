#!/usr/bin/env python3
"""Debug script to check interpellation data for a specific MP."""

import os
from supabase import create_client

# Get Supabase credentials from environment
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    # Try to read from .env file
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith('VITE_SUPABASE_URL='):
                    SUPABASE_URL = line.split('=', 1)[1].strip().strip('"')
                elif line.startswith('VITE_SUPABASE_ANON_KEY='):
                    SUPABASE_KEY = line.split('=', 1)[1].strip().strip('"')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Test MP ID 62 (Katarzyna Czochara)
MP_ID = 62

print(f"=== Debugging Interpellations for MP ID: {MP_ID} ===\n")

# 1. Check MP exists
mp_result = supabase.table('mps').select('id, name').eq('id', MP_ID).execute()
if mp_result.data:
    print(f"✓ MP found: {mp_result.data[0]['name']}")
else:
    print(f"✗ MP with ID {MP_ID} not found!")

# 2. Check interpellation_authors for this MP
authors_result = supabase.table('interpellation_authors').select('*').eq('mp_id', MP_ID).execute()
print(f"\n=== interpellation_authors table ===")
print(f"Entries for mp_id={MP_ID}: {len(authors_result.data)}")
if authors_result.data:
    print("Sample entries:")
    for entry in authors_result.data[:5]:
        print(f"  - interpellation_id: {entry.get('interpellation_id')}, mp_id: {entry.get('mp_id')}")

    # 3. Check if these interpellation_ids exist in interpellations table
    interp_ids = [e['interpellation_id'] for e in authors_result.data]
    print(f"\n=== Checking if interpellation_ids exist in interpellations table ===")
    interp_result = supabase.table('interpellations').select('id, title').in_('id', interp_ids).execute()
    print(f"Found {len(interp_result.data)} matching interpellations out of {len(interp_ids)} IDs")
    
    if interp_result.data:
        print("Sample interpellations:")
        for interp in interp_result.data[:3]:
            print(f"  - ID: {interp['id']}, Title: {interp['title'][:80]}...")
    else:
        print("✗ No interpellations found matching the IDs!")
        print(f"  The IDs in interpellation_authors are: {interp_ids}")
        
        # Check what IDs actually exist in interpellations table
        sample = supabase.table('interpellations').select('id').limit(5).execute()
        print(f"  Sample IDs from interpellations table: {[e['id'] for e in sample.data]}")
else:
    print("✗ No entries in interpellation_authors for this MP!")
    
    # Let's check how many total entries exist
    total = supabase.table('interpellation_authors').select('*', count='exact').execute()
    print(f"  Total entries in interpellation_authors: {total.count}")

print("\n=== Done ===")
