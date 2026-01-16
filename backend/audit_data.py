from backend.core.orm_db import SessionLocal
from backend.models import Bill, SejmPrint, BillAnalysis
from sqlalchemy import func

def audit_data():
    db = SessionLocal()
    try:
        # Total Counts
        total_bills = db.query(Bill).count()
        total_prints = db.query(SejmPrint).count()
        
        # Content Coverage (Digital Text)
        bills_with_content = db.query(Bill).filter(Bill.content != None).count()
        
        # Analysis Coverage (AI Summaries)
        bills_with_analysis = db.query(BillAnalysis).count()
        
        # Joined Analysis Check (to be sure they link to existing bills)
        bills_with_linked_analysis = db.query(Bill).join(BillAnalysis).count()

        print(f"--- LEGISLATIVE DATA AUDIT ---")
        print(f"Total Bills (Projekty): {total_bills}")
        print(f"Total Prints (Druki): {total_prints}")
        print(f"Bills with Digital Content (Tresc): {bills_with_content} ({bills_with_content/total_bills*100:.1f}%)" if total_bills else "Bills with Digital Content: 0")
        print(f"Bills with AI Analysis (Podsumowania): {bills_with_linked_analysis} ({bills_with_linked_analysis/total_bills*100:.1f}%)" if total_bills else "Bills with AI Analysis: 0")
        
        # Check for Chinese characters in analysis
        # Unicode range for common CJK characters: \u4e00-\u9fff
        chinese_count = 0
        analyses = db.query(BillAnalysis).all()
        for a in analyses:
            if a.summary:
                for char in a.summary:
                    if '\u4e00' <= char <= '\u9fff':
                        chinese_count += 1
                        break
        
        print(f"Bills with Chinese/Bad Analysis: {chinese_count} (Potential Hallucinations)")


    finally:
        db.close()

if __name__ == "__main__":
    audit_data()
