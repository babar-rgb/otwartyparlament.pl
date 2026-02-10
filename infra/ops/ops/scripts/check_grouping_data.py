
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from backend.models import Vote
from backend.core.config import Config

DATABASE_URL = Config.get_db_uri()

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def analyze_grouping_potential():
    # 1. Check how many votes have topics
    total_votes = db.query(Vote).count()
    votes_with_topic = db.query(Vote).filter(Vote.topic.isnot(None)).count()
    votes_with_parent = db.query(Vote).filter(Vote.parent_vote_id.isnot(None)).count()
    
    print(f"Total Votes: {total_votes}")
    print(f"Votes with Topic: {votes_with_topic}")
    print(f"Votes with Parent: {votes_with_parent}")

    # 2. Sample sitting to see potential groups
    # Get a recent sitting with many votes
    recent_sitting = db.query(Vote.sitting).order_by(Vote.date.desc()).first()[0]
    print(f"\nAnalyzing Sitting {recent_sitting}:")
    
    votes = db.query(Vote.id, Vote.voting_number, Vote.title_clean, Vote.street_title, Vote.topic, Vote.parent_vote_id)\
        .filter(Vote.sitting == recent_sitting)\
        .order_by(Vote.voting_number)\
        .all()
        
    for v in votes:
        print(f"[{v.voting_number}] {v.street_title or v.title_clean[:50]}... | Topic: {v.topic} | Parent: {v.parent_vote_id}")

if __name__ == "__main__":
    analyze_grouping_potential()
