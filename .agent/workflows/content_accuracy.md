---
description: "Content Accuracy Audit: Gathers data for manual Agent (AI) review"
---

# Content Accuracy Audit Workflow (Agent-Led)

This workflow prepares the data for a substantive audit performed by the AI Agent (Antigravity). It gathers official data from the Sejm API and compares it with the local database, outputting a report for review.

## 1. Gather Audit Evidence
**Goal:** Fetch random vote data from both the Official Sejm API and the Local Database to create a comparison dossier.

// turbo
1. Execute Data Gathering Script
cat << 'EOF' > /tmp/gather_audit_evidence.py
import sys, os, json, requests
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

SEJM_API_URL = "https://api.sejm.gov.pl/sejm"
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    print(json.dumps({"status": "error", "message": "DATABASE_URL not set"}))
    sys.exit(1)
if "+asyncpg" in DB_URL: DB_URL = DB_URL.replace("+asyncpg", "+psycopg2")

def gather_evidence():
    try:
        engine = create_engine(DB_URL)
        session = sessionmaker(bind=engine)()
        
        # 1. Select 1 random vote with AI summary
        # We need 'term' to query the API correctly!
        row = session.execute(text(
            "SELECT id, term, sitting, voting_number, date, title_clean, description, ai_summary, details_json FROM votes WHERE ai_summary IS NOT NULL ORDER BY RANDOM() LIMIT 1"
        )).fetchone()
        
        if not row:
            print("No votes with AI summary found.")
            return

        # 2. Fetch Official Data
        # Endpoint: /term{term}/votings/{sitting}/{number}
        api_url = f"{SEJM_API_URL}/term{row.term}/votings/{row.sitting}/{row.voting_number}"
        resp = requests.get(api_url, timeout=5)
        official_data = resp.json() if resp.status_code == 200 else {"error": f"API {resp.status_code}"}
        
        # 3. Create Dossier
        dossier = {
            "vote_id": row.id,
            "term": row.term,
            "sitting": row.sitting,
            "voting_number": row.voting_number,
            "OFFICIAL_SOURCE": {
                "title": official_data.get("title", "N/A"),
                "topic": official_data.get("topic", "N/A"),
                "description": official_data.get("description", "N/A"),
                "kind": official_data.get("kind", "N/A"),
                "date": official_data.get("date", "N/A"),
                "yes": official_data.get("yes", -1),
                "no": official_data.get("no", -1),
                "abstain": official_data.get("abstain", -1)
            },
            "LOCAL_DATABASE": {
                "title_clean": row.title_clean,
                "description": row.description,
                "ai_summary": row.ai_summary,
                "date": str(row.date),
                "details": row.details_json if isinstance(row.details_json, dict) else json.loads(row.details_json)
            }
        }
        
        # Write to file for Agent to read
        with open("audit_dossier.json", "w") as f:
            json.dump(dossier, f, indent=2, ensure_ascii=False)
            
        print(f"Audit Dossier prepared: audit_dossier.json (Vote #{row.id}, Term {row.term})")
        session.close()

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__": gather_evidence()
EOF

# Install dependencies if missing
pip install requests psycopg2-binary > /dev/null 2>&1 || true
python3 /tmp/gather_audit_evidence.py && rm /tmp/gather_audit_evidence.py

## 2. Agent Review (Manual Step)
**Goal:** The AI Agent reads the dossier and issues a verdict.

> **Instruction for Agent (PASS Criteria):**
> 1.  **Title Similarity**: The Local Title (`title_clean`) is a simplified/cleaned version of the Official. It does NOT need to be identical, but must refer to the same act/subject.
> 2.  **Date Match**: Dates must match EXACTLY (YYYY-MM-DD).
> 3.  **Vote Counts**: Counts (Yes/No/Abstain) must match EXACTLY.
> 4.  **AI Summary Accuracy**:
>     *   **PASS**: Summary mentions the core subject (e.g., "Changes to VAT") correctly.
>     *   **PASS**: Summary simplifies complex legal jargon but preserves meaning.
>     *   **FAIL**: Summary claims a specific outcome (e.g., "Raised taxes") when the vote was procedural (e.g., "Adjourn debate").
>     *   **FAIL**: Summary mentions numbers/amounts that DO NOT appear in the Official Context (Hallucination).
>     *   **FAIL**: Summary contradicts the Official Description.

> **Output Format:**
> Please start your reply with one of these headers:
> - `## ✅ AUDIT PASSED`
> - `## ❌ AUDIT FAILED`
> Follow with a justification list.
