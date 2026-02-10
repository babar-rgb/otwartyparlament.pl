import logging
logging.basicConfig(level=logging.INFO)
import requests
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from backend.core.db import db
except ImportError:
    pass

def verify_holownia():
    # Skip MP list fetch if it fails, try to find him in votes by ID 133 or Name
    expected_id = 133
    logging.info(f"   Skipping API list check. Assuming ID {expected_id}...")

    logging.info("\n--- 2. verify Votes (Sitting 48) ---")
    # Votes from screenshot: 69, 68, 67
    votes_to_check = [69, 68, 67]
    
    # We need to know his ID to check the 'vote' field which uses MP ID.
    # But we can also look for a mapping if the API provides it?
    # Actually, the voting endpoint returns list of votes: { MP: 123, vote: 1 }
    # It does NOT return names.
    # So we MUST confirm his ID.
    
    # Let's try to get his specific details
    r = requests.get(f"https://api.sejm.gov.pl/sejm/term10/MP/{expected_id}")
    if r.status_code == 200:
        d = r.json()
        logging.info(f"   Confirmed ID {expected_id} is: {d.get('firstName')} {d.get('lastName')}")
    else:
        logging.info(f"   ⚠️ Could not confirm ID {expected_id} via API. Status: {r.status_code}")

    api_id = expected_id
    
    for v_num in votes_to_check:
        url = f"https://api.sejm.gov.pl/sejm/term10/votings/48/{v_num}"
        logging.info(f"\nChecking Vote 48/{v_num}...")
        resp = requests.get(url)
        data = resp.json()
        logging.info(f"   Date: {data.get('date')}")
        logging.info(f"   Title: {data['title']}")
        
        votes = data.get('votes', [])
        
        # Find Hołownia's vote
        his_vote = next((v for v in votes if v['MP'] == api_id), None)
        
        if his_vote:
            val = his_vote['vote']
            human_val = "UNKNOWN"
            if val == 1: human_val = "YES (Za)"
            elif val == 2: human_val = "NO (Przeciw)"
            elif val == 3: human_val = "ABSTAIN (Wstrzymał się)"
            elif val == 4: human_val = "ABSENT (Nieobecny)"
            
            logging.info(f"   👉 Hołownia voted: {human_val}")
        else:
             logging.info("   ❓ Hołownia NOT on the list of voters for this vote!")

if __name__ == "__main__":
    verify_holownia()
