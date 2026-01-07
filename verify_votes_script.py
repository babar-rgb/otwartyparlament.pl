import sys
import os
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the project root to python path
sys.path.append(os.getcwd())

from backend.models import Vote
# We need to know the DB URL. I will assume it is sqlite:///./parlament.db based on common practices or check env
# But since I don't want to guess, I'll try to import SessionLocal from backend.core.orm_db if possible
# If not, I'll try to find it.

try:
    from backend.core.orm_db import SessionLocal
except ImportError:
    # Fallback if imports fail due to some path issue
    print("Could not import SessionLocal. Please check path.")
    sys.exit(1)

def verify_data():
    db = SessionLocal()
    try:
        # Get count of votes
        count = db.query(Vote).filter(Vote.term == 10).count()
        if count == 0:
            print("No votes found for term 10.")
            return

        print(f"Total votes in term 10: {count}")
        
        # Pick 3 random offsets
        offsets = random.sample(range(count), 3)
        
        for offset in offsets:
            vote = db.query(Vote).filter(Vote.term == 10).offset(offset).first()
            if not vote:
                continue
                
            print("\n------------------------------------------------")
            print(f"Vote ID: {vote.id}")
            print(f"Date: {vote.date}")
            print(f"Sitting: {vote.sitting}, Voting: {vote.voting_number}")
            print(f"Title: {vote.title_clean or vote.title_raw or 'No Title'}")
            
            # Details
            details = vote.details_json or {}
            print(f"DB Results: Yes={details.get('yes', 0)}, No={details.get('no', 0)}, Abstain={details.get('abstain', 0)}")
            
            # Verdict
            print(f"Verdict: {vote.verdict}")
            
            # Clean URL
            url = f"https://www.sejm.gov.pl/Sejm10.nsf/agent.xsp?symbol=glosowania&NrKadencji=10&NrPosiedzenia={vote.sitting}&NrGlosowania={vote.voting_number}"
            print(f"Sejm URL: {url}")
            
    finally:
        db.close()

if __name__ == "__main__":
    verify_data()
