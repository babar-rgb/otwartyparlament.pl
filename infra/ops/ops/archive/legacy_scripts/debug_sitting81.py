import requests
import os
from supabase import create_client

# Config
SUPABASE_URL = "http://localhost:5173"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoid2ViX2Fub24ifQ.33U98-wreuo0Qic9lsznlb9mL58v3yHJX_2vf2rcKGk" # Hardcoded known working key
SUPABASE_SERVICE_ROLE_KEY = SUPABASE_KEY # Using same key for local debug

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def clean_title(title):
    return title.replace('"', "'").strip()

def debug_sitting81():
    print("Fetching Sitting 81 data...")
    url = "https://api.sejm.gov.pl/sejm/term9/votings/81"
    response = requests.get(url)
    if response.status_code != 200:
        print(f"API Error: {response.status_code}")
        return
    
    votings = response.json()
    print(f"Found {len(votings)} votes in Sitting 81.")

    for vote in votings:
        print(f"Processing Vote {vote['votingNumber']}...")
        
        # Mimic ETL Logic
        try:
             vote_record = {
                "id": 900000 + vote['votingNumber'],
                "sitting": 81,
                "voting_number": vote['votingNumber'],
                "date": vote['date'],
                "title_raw": vote['title'],
                "title_clean": clean_title(vote['title']),
                "term": 9,
                "details_json": {
                    "yes": int(vote.get('yes', 0) or 0),
                    "no": int(vote.get('no', 0) or 0),
                    "abstain": int(vote.get('abstain', 0) or 0),
                    "kind": str(vote.get('kind', '') or ''),
                    "topic": str(vote.get('topic', '') or ''),
                },
                "importance_score": 50,
                "topic_tag": "DEBUG",
                "semantic_weight": 0,
                "category": "DEBUG"
            }
             
             # Try Upsert with minimal return to avoid serialization errors
             res = supabase.table('votes').upsert(vote_record, returning='minimal').execute()
             print(f"Success: {vote['votingNumber']}")
        
        except Exception as e:
            print(f"FAILED Vote {vote['votingNumber']}")
            print(f"Error: {e}")
            # Print Payload that failed
            print(f"Payload: {vote_record}")
            break # Stop at first error

if __name__ == "__main__":
    debug_sitting81()
