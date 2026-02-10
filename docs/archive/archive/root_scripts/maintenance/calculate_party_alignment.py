import os
import json
from supabase import create_client, Client
from collections import Counter

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def calculate_party_alignment():
    print("Fetching key votes...")
    # Fetch votes marked as 'is_key_vote'
    votes_resp = supabase.table('votes').select('*').eq('is_key_vote', True).order('date', desc=True).limit(20).execute()
    key_votes = votes_resp.data
    
    if not key_votes:
        print("No key votes found. Using importance score > 50 as fallback.")
        votes_resp = supabase.table('votes').select('*').gt('importance_score', 50).order('date', desc=True).limit(20).execute()
        key_votes = votes_resp.data

    print(f"Found {len(key_votes)} key votes.")

    print("Fetching MPs and their parties...")
    mps_resp = supabase.table('mps').select('id, party').execute()
    mp_party_map = {mp['id']: mp['party'] for mp in mps_resp.data}
    
    # Get unique parties
    parties = list(set(mp_party_map.values()))
    print(f"Parties found: {parties}")

    alignment_data = []

    for vote in key_votes:
        print(f"Processing vote: {vote['title_clean']} (ID: {vote['id']})")
        
        # Fetch results for this vote
        results_resp = supabase.table('vote_results').select('mp_id, vote').eq('vote_id', vote['id']).execute()
        results = results_resp.data
        
        party_votes = {party: [] for party in parties}
        
        for r in results:
            mp_id = r['mp_id']
            if mp_id in mp_party_map:
                party = mp_party_map[mp_id]
                party_votes[party].append(r['vote'])
        
        # Determine party stance
        party_stances = {}
        for party, votes_list in party_votes.items():
            if not votes_list:
                party_stances[party] = 'ABSENT'
                continue
                
            counts = Counter(votes_list)
            total = len(votes_list)
            
            yes = counts.get('YES', 0)
            no = counts.get('NO', 0)
            abstain = counts.get('ABSTAIN', 0)
            
            # Simple majority rule
            if yes > total * 0.5:
                party_stances[party] = 'YES'
            elif no > total * 0.5:
                party_stances[party] = 'NO'
            elif abstain > total * 0.5:
                party_stances[party] = 'ABSTAIN'
            else:
                party_stances[party] = 'MIXED' # No clear discipline
        
        alignment_data.append({
            'vote_id': vote['id'],
            'title': vote['title_clean'],
            'description': vote['title_raw'], # Using raw title as description for now
            'date': vote['date'],
            'category': vote['category'],
            'party_stances': party_stances
        })

    # Save to a JSON file in src/data for the frontend to consume
    output_path = 'src/data/realTestVotes.json'
    os.makedirs('src/data', exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(alignment_data, f, indent=2, ensure_ascii=False)
        
    print(f"Saved alignment data to {output_path}")

if __name__ == "__main__":
    calculate_party_alignment()
