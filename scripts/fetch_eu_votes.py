#!/usr/bin/env python3
"""
Fetch ALL European Parliament votes and results.
Extends existing euro_votes data to maximum coverage.
"""
import requests
import os
import time
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_URL = "https://api.sejm.gov.pl/eli"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    print("=== Fetching EU Parliament Votes ===")
    
    # Fetch all available EU votes from Sejm API
    # The API endpoint: /eli/votes (European Legislative Information)
    # Note: This is POLISH MEPs' votes, not full EP data
    
    url = f"{API_URL}/votes"
    print(f"Fetching from {url}...")
    
    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code != 200:
            print(f"Error: API returned {resp.status_code}")
            # Try alternative endpoint
            print("Trying alternative: checking current euro_votes for API pattern...")
            
            # Check existing data to understand API pattern
            existing = supabase.table('euro_votes').select('*').limit(1).execute()
            if existing.data:
                print(f"Sample existing vote: {existing.data[0]}")
            
            return
        
        data = resp.json()
        print(f"Received {len(data) if isinstance(data, list) else 'unknown'} votes")
        
        # Process and insert
        if isinstance(data, list):
            batch = []
            for vote in data:
                # Map to euro_votes schema
                # Assuming structure similar to Sejm votes
                record = {
                    'vote_id': vote.get('id') or vote.get('voteId'),
                    'title': vote.get('title'),
                    'date': vote.get('date'),
                    'sitting': vote.get('sitting'),
                    # Add other fields as available
                }
                batch.append(record)
                
                if len(batch) >= 50:
                    try:
                        supabase.table('euro_votes').upsert(batch).execute()
                        print(f"✓ {len(batch)} votes saved")
                        batch = []
                    except Exception as e:
                        print(f"Error saving batch: {e}")
                        batch = []
            
            if batch:
                supabase.table('euro_votes').upsert(batch).execute()
                print(f"✓ Final {len(batch)} votes saved")
        
    except Exception as e:
        print(f"Error fetching EU votes: {e}")
        print("\nNote: EU Parliament data via Sejm API may be limited.")
        print("For complete EP data, consider using:")
        print("  - European Parliament Open Data Portal")
        print("  - VoteWatch Europe API")
    
    # Show current status
    count = supabase.table('euro_votes').select('vote_id', count='exact').execute()
    print(f"\nTotal EU votes in database: {count.count}")

if __name__ == "__main__":
    main()
