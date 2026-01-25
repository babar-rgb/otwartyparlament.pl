import sys
import os
import logging
import re
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models import Vote
from backend.core.orm_db import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("identify_procedural")

PROCEDURAL_KEYWORDS = [
    r'przerw', r'odroczen', r'zamknięci', r'uzupełnien', r'porządk', r'dzienneg', 
    r'repartycj', r'składu', r'osoboweg', r'powołania komisji', r'wybór', r'kandydatur',
    r'zmiany w składzie'
]

def process_clarity():
    session = SessionLocal()
    
    try:
        # 1. Identify Procedural Votes
        votes = session.query(Vote).all()
        logger.info(f"🚀 Analyzing {len(votes)} votes for procedural markers...")
        
        count = 0
        for vote in votes:
            title = (vote.title_clean or vote.title_raw or "").lower()
            is_proc = any(re.search(kw, title) for kw in PROCEDURAL_KEYWORDS)
            
            # Additional heuristic: If it's a "wniosek o przerwę" it's definitely procedural
            if "wniosek" in title and ("przerw" in title or "odroczen" in title):
                is_proc = True
            
            if is_proc:
                vote.is_procedural = True
                count += 1
            else:
                vote.is_procedural = False
                
        session.commit()
        logger.info(f"✅ Procedural markers updated. Found {count} procedural votes.")
        
        # 2. Grouping (Parent-Child) - Robust Strategy
        # We group by RAW title because AI titles (title_clean) are too unique.
        # Often multiple votes (amendments) share the exact same 'Pkt. X Sprawozdanie...' raw title.
        logger.info("🚀 Grouping votes into legislative clusters...")
        
        # Reset previous grouping
        session.query(Vote).update({Vote.parent_vote_id: None})
        session.commit()

        from sqlalchemy import cast, Date

        # Grouping keys: term, date, sitting, title_raw
        # We cast date to Date to ignore time components if present.
        date_col = cast(Vote.date, Date)
        
        subq = session.query(
            Vote.term, date_col, Vote.sitting, Vote.title_raw, func.count('*').label('cnt')
        ).group_by(Vote.term, date_col, Vote.sitting, Vote.title_raw).having(func.count('*') > 1).all()
        
        groups_count = 0
        for term, date, sitting, title_raw, cnt in subq:
            if not title_raw: continue
            
            cluster = session.query(Vote).filter(
                Vote.term == term,
                cast(Vote.date, Date) == date,
                Vote.sitting == sitting,
                Vote.title_raw == title_raw
            ).order_by(Vote.voting_number.desc()).all()
            
            if len(cluster) > 1:
                # The assumption: The last vote (highest number) is the decisive one (e.g. 'Vote on the whole').
                # Everything before it with the same raw title is a child (amendment, procedure).
                parent = cluster[0] 
                groups_count += 1
                for child in cluster[1:]:
                    child.parent_vote_id = parent.id
                    
        session.commit()
        logger.info(f"✅ Clusters established: {groups_count} groups created based on Raw Titles.")
        
    except Exception as e:
        logger.error(f"❌ Error during clarity update: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    process_clarity()
