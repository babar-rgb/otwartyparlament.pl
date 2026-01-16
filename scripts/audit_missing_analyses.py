from sqlalchemy import text, func, or_
from backend.core.orm_db import SessionLocal
from backend.models import Vote, VoteAnalysis

def audit_analyses():
    db = SessionLocal()
    try:
        print("Auditing Missing AI Analyses & Descriptions...")
        print("-" * 50)
        
        # 1. Total Votes
        total_votes = db.query(Vote).count()
        print(f"Total Votes in Database: {total_votes}")
        
        # 2. Votes with NO Analysis relation
        # Left join VoteAnalysis and check for null
        missing_analysis_query = db.query(Vote).outerjoin(VoteAnalysis).filter(VoteAnalysis.vote_id == None)
        missing_analysis_count = missing_analysis_query.count()
        
        print(f"Votes MISSING separate Analysis record: {missing_analysis_count} ({(missing_analysis_count/total_votes*100):.1f}%)")
        
        # 3. Votes with NO Description (in Vote table)
        missing_desc_query = db.query(Vote).filter(or_(Vote.description == None, Vote.description == ""))
        missing_desc_count = missing_desc_query.count()
        
        print(f"Votes MISSING 'description' field: {missing_desc_count} ({(missing_desc_count/total_votes*100):.1f}%)")
        
        print("-" * 50)
        print("Breakdown by Term (Kadencja):")
        
        # Group by Term
        terms = db.query(Vote.term).distinct().order_by(Vote.term.desc()).all()
        for (term_id,) in terms:
            term_total = db.query(Vote).filter(Vote.term == term_id).count()
            term_missing_ana = missing_analysis_query.filter(Vote.term == term_id).count()
            term_missing_desc = missing_desc_query.filter(Vote.term == term_id).count()
            
            print(f"Term {term_id}:")
            print(f"  - Total: {term_total}")
            print(f"  - Missing Analysis: {term_missing_ana} ({0 if term_total==0 else (term_missing_ana/term_total*100):.1f}%)")
            print(f"  - Missing Description: {term_missing_desc} ({0 if term_total==0 else (term_missing_desc/term_total*100):.1f}%)")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    audit_analyses()
