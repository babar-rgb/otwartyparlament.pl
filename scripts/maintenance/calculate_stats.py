import os
import time
from supabase import create_client, Client
from collections import Counter

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def calculate_stats():
    print("Fetching MPs...")
    mps_resp = supabase.table('mps').select('id, party').execute()
    mps = mps_resp.data
    mp_party_map = {mp['id']: mp['party'] for mp in mps}
    
    print(f"Found {len(mps)} MPs.")

    print("Fetching all vote results (this might take a while)...")
    # Fetching all results might be too heavy. Let's do it vote by vote or in chunks?
    # Actually, let's fetch votes first to iterate.
    votes_resp = supabase.table('votes').select('id, sitting, voting_number').execute()
    votes = votes_resp.data
    print(f"Found {len(votes)} votes.")

    # Initialize stats
    mp_stats = {mp['id']: {'total': 0, 'present': 0, 'rebel': 0} for mp in mps}

    # Process votes to calculate stats
    # To avoid fetching millions of rows at once, let's iterate through votes
    # Optimization: Fetch results for a batch of votes
    
    BATCH_SIZE = 50
    total_votes_processed = 0

    for i in range(0, len(votes), BATCH_SIZE):
        batch_votes = votes[i:i+BATCH_SIZE]
        batch_ids = [v['id'] for v in batch_votes]
        
        # Fetch results for this batch
        results_resp = supabase.table('vote_results').select('vote_id, mp_id, vote').in_('vote_id', batch_ids).execute()
        results = results_resp.data
        
        # Group results by vote_id
        results_by_vote = {}
        for r in results:
            if r['vote_id'] not in results_by_vote:
                results_by_vote[r['vote_id']] = []
            results_by_vote[r['vote_id']].append(r)
            
        # Analyze each vote
        for vote_id, vote_results in results_by_vote.items():
            # Determine party lines for this vote
            party_votes = {} # { 'PiS': ['YES', 'NO', ...], ... }
            
            for r in vote_results:
                mp_id = r['mp_id']
                if mp_id not in mp_party_map: continue
                party = mp_party_map[mp_id]
                
                if party not in party_votes: party_votes[party] = []
                party_votes[party].append(r['vote'])
                
                # Update attendance
                if mp_id in mp_stats:
                    mp_stats[mp_id]['total'] += 1
                    if r['vote'] != 'ABSENT':
                        mp_stats[mp_id]['present'] += 1

            # Determine majority vote for each party
            party_lines = {}
            for party, p_votes in party_votes.items():
                # Filter out ABSENT for party line calculation? Usually yes.
                valid_votes = [v for v in p_votes if v != 'ABSENT']
                if not valid_votes:
                    party_lines[party] = None
                else:
                    counts = Counter(valid_votes)
                    majority_vote = counts.most_common(1)[0][0]
                    party_lines[party] = majority_vote
            
            # Calculate rebellion
            for r in vote_results:
                mp_id = r['mp_id']
                if mp_id not in mp_party_map: continue
                party = mp_party_map[mp_id]
                
                # Skip if no party line established or MP was absent
                if party not in party_lines or not party_lines[party]: continue
                if r['vote'] == 'ABSENT': continue
                
                if r['vote'] != party_lines[party]:
                    if mp_id in mp_stats:
                        mp_stats[mp_id]['rebel'] += 1

        total_votes_processed += len(batch_votes)
        print(f"Processed {total_votes_processed}/{len(votes)} votes...")

    # Calculate final percentages and update DB
    print("Updating MPs in DB...")
    updates = []
    for mp_id, stats in mp_stats.items():
        attendance_rate = 0
        if stats['total'] > 0:
            attendance_rate = round((stats['present'] / stats['total']) * 100, 2)
            
        updates.append({
            'id': mp_id,
            'stats_attendance': attendance_rate,
            'stats_rebellion': stats['rebel']
        })
        
    # Batch update
    # Using individual updates to avoid not-null constraint issues with partial upsert
    print(f"Updating {len(updates)} MPs...")
    for i, update_data in enumerate(updates):
        try:
            supabase.table('mps').update({
                'stats_attendance': update_data['stats_attendance'],
                'stats_rebellion': update_data['stats_rebellion']
            }).eq('id', update_data['id']).execute()
            
            if i % 50 == 0:
                print(f"Updated {i}/{len(updates)} MPs...")
        except Exception as e:
            print(f"Error updating MP {update_data['id']}: {e}")

    print("Stats calculation complete.")

if __name__ == "__main__":
    calculate_stats()
