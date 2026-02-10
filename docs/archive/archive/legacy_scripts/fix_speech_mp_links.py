#!/usr/bin/env python3
"""
Fix missing mp_id linkages in speeches table using speaker_name matching.
Handles middle names and variations.
"""
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def normalize_name(name):
    """Normalize name for matching: remove middle names, lowercase, strip."""
    if not name:
        return ""
    # Remove common prefixes
    name = name.replace("Poseł ", "").replace("Pose", "").replace("Marszałek ", "")
    parts = name.lower().strip().split()
    # Keep only first and last name (remove middle names/initials)
    if len(parts) >= 2:
        return f"{parts[0]} {parts[-1]}"
    return " ".join(parts)

def main():
    print("=== Fixing Speech-MP Linkages (using speaker_name) ===")
    
    # Load all MPs
    print("Loading MPs...")
    mps_res = supabase.table('mps').select('id, name').execute()
    mps_map = {}
    for mp in mps_res.data:
        normalized = normalize_name(mp['name'])
        mps_map[normalized] = mp['id']
    
    print(f"Loaded {len(mps_map)} MPs")
    print(f"Sample mappings: {list(mps_map.items())[:3]}")
    
    # Fetch speeches with NULL or empty mp_id
    print("Fetching speeches...")
    offset = 0
    batch = []
    fixed = 0
    skipped = 0
    
    while True:
        # Get speeches where mp_id is NULL or empty string
        res = supabase.table('speeches').select('id, mp_id, speaker_name').range(offset, offset+999).execute()
        rows = res.data
        if not rows: break
        
        for speech in rows:
            # Skip if already has mp_id
            if speech.get('mp_id') and speech['mp_id'] != '':
                continue
                
            speaker = speech.get('speaker_name', '')
            if not speaker:
                skipped += 1
                continue
                
            normalized = normalize_name(speaker)
            
            if normalized in mps_map:
                mp_id = mps_map[normalized]
                batch.append({
                    'id': speech['id'],
                    'mp_id': mp_id
                })
                fixed += 1
                if fixed <= 5:  # Show first few matches
                    print(f"  Match: '{speaker}' -> MP ID {mp_id}")
            else:
                skipped += 1
        
        offset += 1000
        if len(rows) < 1000: break
    
    print(f"\nFound {fixed} speeches to fix, {skipped} couldn't match")
    
    if not batch:
        print("All speeches already linked!")
        return
    
    # Update in batches
    print("Updating database...")
    batch_size = 100
    for i in range(0, len(batch), batch_size):
        chunk = batch[i:i+batch_size]
        try:
            supabase.table('speeches').upsert(chunk).execute()
            print(f"✓ {min(i+batch_size, len(batch))}/{len(batch)} fixed")
        except Exception as e:
            print(f"Error: {e}")
    
    print("=== Fix Complete ===")
    
    # Verify
    res = supabase.table('speeches').select('id', count='exact').execute()
    total = res.count
    res2 = supabase.table('speeches').select('id', count='exact').filter('mp_id', 'not.is', 'null').execute()
    linked = res2.count
    print(f"\nLinked speeches: {linked}/{total} ({100*linked/total:.1f}%)")

if __name__ == "__main__":
    main()
