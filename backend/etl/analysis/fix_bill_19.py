from backend.core.orm_db import SessionLocal
from backend.models import BillAnalysis
import json

ALIGNMENTS = {
    19: {
        "summary": "Projekt uchwały w sprawie wyboru posła Tomasza Zimocha na członka Krajowej Rady Sądownictwa.",
        "category": "Ustrój",
        "pros": ["Uzupełnienie składu KRS", "Doświadczenie prawniczeandydata"],
        "cons": ["Wybór polityczny (poseł)"],
        "impact": "Krajowa Rada Sądownictwa, wymiar sprawiedliwości",
        "importance": 8
    }
}

def apply_fixes():
    db = SessionLocal()
    try:
        count = 0
        for bill_id, data in ALIGNMENTS.items():
            analysis = db.query(BillAnalysis).filter(BillAnalysis.bill_id == bill_id).first()
            if analysis:
                analysis.summary = data["summary"]
                analysis.category = data["category"]
                analysis.pros = data["pros"]
                analysis.cons = data["cons"]
                analysis.impact = data["impact"]
                analysis.importance = data["importance"]
                db.add(analysis)
                count += 1
                print(f"Update queued for Bill {bill_id}")
            else:
                print(f"BillAnalysis {bill_id} not found to update.")
        
        db.commit()
        print(f"Successfully fixed {count} bills.")
        
    finally:
        db.close()

if __name__ == "__main__":
    apply_fixes()
