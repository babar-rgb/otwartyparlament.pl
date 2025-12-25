#!/usr/bin/env python3
"""
ENTERPRISE FIX: Calculate MP Attendance Statistics
Fixes: 460 MPs with stats_attendance = 0
"""
import os
from supabase import create_client
from dotenv import load_dotenv
from collections import defaultdict

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    print("=== ENTERPRISE FIX: MP Attendance Statistics ===")
    
    # Get all vote IDs and count total votes per term
    print("Counting votes per term...")
    votes = supabase.table('votes').select('id, term').execute()
    
    votes_by_term = defaultdict(set)
    for v in votes.data:
        votes_by_term[v['term']].add(v['id'])
    
    total_votes_t10 = len(votes_by_term[10])
    total_votes_t9 = len(votes_by_term[9])
    
    print(f"Term 10: {total_votes_t10} votes")
    print(f"Term 9: {total_votes_t9} votes")
    
    # Get all MPs
    print("\nProcessing MPs...")
    mps = supabase.table('mps').select('id, name, term, stats_attendance').eq('active', True).execute()
    
    updates = []
    batch_count = 0
    
    for mp in mps.data:
        mp_id = mp['id']
        term = mp.get('term', 10)
        
        # Count votes this MP participated in
        vote_count_res = supabase.table('vote_results').select('id', count='exact').eq('mp_id', mp_id).execute()
        votes_cast = vote_count_res.count
        
        # Calculate attendance
        total_votes = total_votes_t10 if term == 10 else total_votes_t9
        attendance = (votes_cast / total_votes * 100) if total_votes > 0 else 0
        
        # Only update if different
        current = mp.get('stats_attendance', 0) or 0
        if abs(attendance - current) > 0.1:
            updates.append({
                'id': mp_id,
                'stats_attendance': round(attendance, 1)
            })
        
        batch_count += 1
        if batch_count % 50 == 0:
            print(f"Processed {batch_count}/{len(mps.data)} MPs...")
    
    print(f"\nNeed to update {len(updates)} MPs")
    
    if updates:
        # Batch update
        for i in range(0, len(updates), 50):
            batch = updates[i:i+50]
            supabase.table('mps').upsert(batch).execute()
            print(f"Updated {min(i+50, len(updates))}/{len(updates)}")
    
    # Verify
    print("\nVerifying...")
    res = supabase.table('mps').select('id', count='exact').eq('active', True).gt('stats_attendance', 0).execute()
    print(f"MPs with attendance > 0: {res.count}")
    
    print("=== COMPLETE ===")

if __name__ == "__main__":
    main()
