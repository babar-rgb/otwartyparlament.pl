from backend.core.orm_db import SessionLocal
from backend.models import Bill, Vote

def check_bills():
    db = SessionLocal()
    count = db.query(Bill).count()
    print(f"Total Bills: {count}")
    
    votes_with_bills = db.query(Vote).filter(Vote.bill_id != None).count()
    print(f"Votes linked to Bills: {votes_with_bills}")
    
    # Check if we can link some
    sample_vote = db.query(Vote).filter(Vote.title_clean.like("%druk%")).first()
    if sample_vote:
        print(f"Sample Vote: {sample_vote.title_clean}")
    
    db.close()

if __name__ == "__main__":
    check_bills()
