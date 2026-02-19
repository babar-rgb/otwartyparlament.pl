---
description: "Data Coverage Audit: Checks database for missing summaries, analyses, and broken relations"
---

# Data Coverage & Integrity Audit Workflow

This workflow connects to the database to verify the completeness of the data. It checks if AI processes (summarization, analysis) have successfully run for all records.

## 1. Run Data Integrity Check (Embedded Script)
**Goal:** Calculate percentages of "enriched" data vs. raw data.

// turbo
1. Execute Python Coverage Script
cat << 'EOF' > /tmp/check_data_coverage.py
import sys
import os
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add project root to path to allow imports if needed, though we use raw SQL for speed/independence here
sys.path.append(os.getcwd())

# Configuration - Get DB URL from env or fail
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    print(json.dumps({"error": "DATABASE_URL environment variable is not set. Cannot connect to database."}))
    sys.exit(1)

# Ensure we use a sync driver for this script even if project uses async
if "+asyncpg" in DB_URL:
    DB_URL = DB_URL.replace("+asyncpg", "+psycopg2")

def check_coverage():
    try:
        engine = create_engine(DB_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        report = {"status": "success", "metrics": {}}
        
        # 1. Votes Coverage
        total_votes = session.execute(text("SELECT COUNT(*) FROM votes")).scalar()
        ai_votes = session.execute(text("SELECT COUNT(*) FROM votes WHERE ai_summary IS NOT NULL")).scalar()
        votes_pct = (ai_votes / total_votes * 100) if total_votes else 0
        report["metrics"]["votes_coverage"] = {
            "total": total_votes,
            "ai_enriched": ai_votes,
            "percentage": round(votes_pct, 2)
        }
        
        # 2. Bills Analysis Coverage
        total_bills = session.execute(text("SELECT COUNT(*) FROM bills")).scalar()
        analyzed_bills = session.execute(text("SELECT COUNT(*) FROM bill_analyses")).scalar()
        bills_pct = (analyzed_bills / total_bills * 100) if total_bills else 0
        report["metrics"]["bills_coverage"] = {
            "total": total_bills,
            "analyzed": analyzed_bills,
            "percentage": round(bills_pct, 2)
        }
        
        # 3. Interpellations Coverage
        total_interp = session.execute(text("SELECT COUNT(*) FROM interpellations")).scalar()
        ai_interp = session.execute(text("SELECT COUNT(*) FROM interpellations WHERE ai_summary IS NOT NULL")).scalar()
        interp_pct = (ai_interp / total_interp * 100) if total_interp else 0
        report["metrics"]["interpellations_coverage"] = {
            "total": total_interp,
            "ai_enriched": ai_interp,
            "percentage": round(interp_pct, 2)
        }
        
        # 4. MPs Integrity
        mps_no_club = session.execute(text("SELECT COUNT(*) FROM mps WHERE club IS NULL OR club = ''")).scalar()
        report["metrics"]["integrity_issues"] = {
            "mps_missing_club": mps_no_club
        }
        
        # 5. Orphan Checks
        orphan_results = session.execute(text("SELECT COUNT(*) FROM vote_results WHERE vote_id NOT IN (SELECT id FROM votes)")).scalar()
        report["metrics"]["integrity_issues"]["orphan_vote_results"] = orphan_results

        print(json.dumps(report, indent=2))
        
        session.close()
        
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    check_coverage()
EOF

# Install psycopg2 if missing (needed for sync connection)
pip install psycopg2-binary > /dev/null 2>&1 || true
python3 /tmp/check_data_coverage.py && rm /tmp/check_data_coverage.py

> **Pass Criteria (JSON Parsing):** 
> - `metrics.votes_coverage.percentage` > 95.0
> - `metrics.bills_coverage.percentage` > 90.0
> - `metrics.integrity_issues.orphan_vote_results` == 0
