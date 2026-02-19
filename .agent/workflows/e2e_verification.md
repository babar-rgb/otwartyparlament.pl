---
description: "E2E Verification: Checks if the entire pipeline (ETL -> AI -> API -> Frontend) is alive"
---

# End-to-End (E2E) Pipeline Verification

This workflow acts as a "Pulse Check" for the entire system. It verifies that data flows from the Sejm API, through our database and AI models, all the way to the frontend.

## 1. Check System Pulse
**Goal:** Gather health metrics from all key components.

// turbo
1. Execute Health Check Script
cat << 'EOF' > /tmp/check_system_health.py
import sys, os, json, requests
from datetime import datetime, date
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuration with Docker-friendly defaults
DB_URL = os.getenv("DATABASE_URL")
# Use 'host.docker.internal' if running inside docker, else localhost
API_URL = os.getenv("API_URL", "http://host.docker.internal:8000") 
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://host.docker.internal:5173")

if not DB_URL:
    print(json.dumps({"status": "error", "message": "DATABASE_URL not set"}))
    sys.exit(0)
if "+asyncpg" in DB_URL: DB_URL = DB_URL.replace("+asyncpg", "+psycopg2")

def get_db_metrics():
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # 1. Latest Data (ETL Liveness)
            latest_vote_row = conn.execute(text("SELECT date FROM votes ORDER BY date DESC LIMIT 1")).fetchone()
            
            if latest_vote_row and latest_vote_row[0]:
                latest_date = latest_vote_row[0] # date object
                days_diff = (date.today() - latest_date).days
                latest_date_str = str(latest_date)
            else:
                latest_date_str = "None"
                days_diff = 9999
            
            # 2. AI Pipeline Lag
            pending_ai = conn.execute(text("SELECT COUNT(*) FROM analysis_requests WHERE status = 'PENDING'")).scalar() or 0
            failed_ai = conn.execute(text("SELECT COUNT(*) FROM analysis_requests WHERE status = 'FAILED'")).scalar() or 0
            
            return {
                "latest_vote_date": latest_date_str,
                "days_since_last_vote": days_diff,
                "ai_queue": {"pending": pending_ai, "failed": failed_ai}
            }
    except Exception as e:
        return {"error": str(e)}

def check_service(url, name):
    try:
        # Timeout 2s is enough for local health check
        resp = requests.get(url, timeout=2)
        return {"status": "UP", "code": resp.status_code, "url": url}
    except Exception as e:
        return {"status": "DOWN", "error": str(e), "url": url}

if __name__ == "__main__":
    report = {
        "timestamp": datetime.now().isoformat(),
        "components": {
            "backend_api": check_service(f"{API_URL}/health", "Backend"),
            "frontend_ui": check_service(FRONTEND_URL, "Frontend"),
            "database": get_db_metrics()
        }
    }
    
    with open("health_dossier.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print("Health Dossier prepared: health_dossier.json")
EOF

# Install dependencies
pip install requests psycopg2-binary > /dev/null 2>&1 || true
python3 /tmp/check_system_health.py && rm /tmp/check_system_health.py

## 2. Agent Review (Manual Step)
**Goal:** The AI Agent interprets the vital signs.

> **Instruction for Agent:**
> 1. Read `health_dossier.json`.
> 2. **Backend**: Must be UP (200 OK).
> 3. **Frontend**: Must be UP (200-299). If DOWN, warn user (dev server might be off).
> 4. **ETL**: Check `days_since_last_vote`.
>    - If > 30, WARN "Data Stale (Last vote: X days ago)".
>    - If < 30, PASS.
> 5. **AI**: If `pending` > 100, warn "AI Pipeline Clogged".
> 6. Output a final verdict: **SYSTEM HEALTHY** or **SYSTEM DEGRADED**.
