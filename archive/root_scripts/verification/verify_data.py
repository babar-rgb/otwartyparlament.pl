import os
from supabase import create_client, Client
from collections import Counter

# --- CONFIGURATION ---
# Manually load .env
try:
    # Try finding .env in current or parent directory
    env_paths = ['.env', '../.env']
    for path in env_paths:
        if os.path.exists(path):
            with open(path) as f:
                for line in f:
                    if '=' in line and not line.startswith('#'):
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value
            break
except Exception:
    pass

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def verify_data():
    print("\n--- DATA VERIFICATION ---\n")

    # 1. Check Total Votes
    votes_count = supabase.table('votes').select('*', count='exact', head=True).execute().count
    print(f"✅ Total Votes Imported: {votes_count}")

    # 2. Check Total Individual Decisions
    results_count = supabase.table('vote_results').select('*', count='exact', head=True).execute().count
    print(f"✅ Total Individual MP Decisions: {results_count}")

    if votes_count == 0:
        print("No votes found yet.")
        return

    # 3. Example Aggregation: Party Breakdown for the latest vote
    print("\n--- EXAMPLE: PARTY BREAKDOWN (Latest Vote) ---")
    
    # Get latest vote
    latest_vote = supabase.table('votes').select('*').order('date', desc=True).limit(1).execute().data[0]
    vote_id = latest_vote['id']
    print(f"Vote: {latest_vote['title_clean']} (ID: {vote_id})")
    print(f"Date: {latest_vote['date']}")
    print(f"Verdict: {latest_vote['verdict']}")

    # Get results for this vote joined with MPs to get party
    # Note: Supabase-py join syntax can be tricky, doing two queries for simplicity or using select with join
    response = supabase.table('vote_results').select('vote, mps(party)').eq('vote_id', vote_id).execute()
    
    party_votes = {} # { 'PiS': {'YES': 10, 'NO': 5}, ... }

    for record in response.data:
        vote_val = record['vote']
        party = record['mps']['party'] if record['mps'] else 'Unknown'
        
        if party not in party_votes:
            party_votes[party] = Counter()
        party_votes[party][vote_val] += 1

    print(f"\n{'PARTY':<20} | {'ZA':<5} | {'PRZECIW':<8} | {'WSTRZ':<5} | {'BRAK':<5}")
    print("-" * 60)
    for party, counts in party_votes.items():
        print(f"{party:<20} | {counts['YES']:<5} | {counts['NO']:<8} | {counts['ABSTAIN']:<5} | {counts['ABSENT']:<5}")

    # 4. Example Individual Votes
    print("\n--- EXAMPLE: INDIVIDUAL VOTES (First 5 MPs) ---")
    for record in response.data[:5]:
        party = record['mps']['party']
        print(f"MP (Party: {party}): {record['vote']}")

if __name__ == "__main__":
    verify_data()
