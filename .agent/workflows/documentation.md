---
description: "Documentation Update: Auto-generates OpenAPI spec, Database ERD, and AI Changelog"
---

# Continuous Documentation Workflow

This workflow ensures that the project documentation (API spec, Database Schema, and Changelog) is always up-to-date with the code.

## 1. Export OpenAPI Specification
**Goal:** Generate a machine-readable API definition (Swagger/OpenAPI).

> **Note:** We mock `DATABASE_URL` to ensure the app can be imported without connectivity.

// turbo
1. Generate OpenAPI JSON
cat << 'EOF' > /tmp/gen_openapi.py
import sys, os, json

# 1. Safety Mock: Prevent DB connection on import
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

sys.path.append(os.getcwd())

try:
    from backend.main import app
    print(json.dumps(app.openapi(), indent=2))
except Exception as e:
    sys.stderr.write(f"Error: {e}\n")
    sys.exit(1)
EOF
python3 /tmp/gen_openapi.py > backend/openapi.json && rm /tmp/gen_openapi.py

> **Result:** `backend/openapi.json` is updated.

## 2. Generate Database Diagram (ERD)
**Goal:** Specific visual graph of database tables and relationships.

// turbo
2. Generate Mermaid ERD
cat << 'EOF' > /tmp/gen_erd.py
import sys, os

# 1. Safety Mock: Prevent DB connection on import
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
sys.path.append(os.getcwd())

# 2. Key Import: We MUST import the models file so SQLAlchemy 'sees' the classes
try:
    import backend.models  # This registers models to Base.metadata
    from backend.core.orm_db import Base
except ImportError as e:
    print(f"Error importing models: {e}")
    sys.exit(1)

def generate_mermaid():
    if not Base.metadata.tables:
        print("Error: No tables found in Base.metadata. Did you import models?")
        sys.exit(1)

    print("erDiagram")
    
    # Tables
    for table_name, table in Base.metadata.tables.items():
        print(f"  {table_name} {{")
        for column in table.columns:
            # Map Python/SQL types to generic types for diagram
            col_type = str(column.type).split('(')[0]
            print(f"    {col_type} {column.name}")
        print("  }")

    # Relationships (Foreign Keys)
    for table_name, table in Base.metadata.tables.items():
        for fk in table.foreign_keys:
            target_table = fk.column.table.name
            # table_name }|..|| target_table : refers_to
            print(f"  {table_name} }}|..|| {target_table} : refers_to")

if __name__ == "__main__":
    generate_mermaid()
EOF
python3 /tmp/gen_erd.py > backend/database_schema.mmd && rm /tmp/gen_erd.py

> **Result:** `backend/database_schema.mmd` updated. Render it in GitHub or Mermaid Live Editor.

## 3. Generate AI Changelog
**Goal:** Translate technical git commits into a human-readable summary of changes.

> **CI/CD Note:** This step requires full git history. Ensure `fetch-depth: 0` in GitHub Actions.

// turbo
3. Analyze Commits with AI
cat << 'EOF' > /tmp/gen_changelog.py
import sys, os, json, subprocess
import google.generativeai as genai

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("Skipping Changelog: Missing GEMINI_API_KEY")
    sys.exit(0)

genai.configure(api_key=API_KEY)

def get_recent_commits():
    # Try getting 50 commits. If shallow clone (depth 1), this might fail or return 1.
    try:
        cmd = ["git", "log", "-n", "50", "--pretty=format:%h - %s (%an)"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        logs = result.stdout.strip()
        
        if not logs:
             # Fallback check for shallow clone
             return "No commits found. (Is this a shallow clone?)"
             
        line_count = len(logs.split('\n'))
        if line_count < 2:
             print("Warning: Only 1 commit found. CI/CD might need 'fetch-depth: 0'.")
             
        return logs
    except Exception as e:
        return f"Git Error: {str(e)}"

def generate_changelog(commits):
    if not commits or "No commits" in commits: 
        return "Brak danych commitów (prawdopodobnie shallow clone)."

    prompt = f"""
    Jesteś Technical Writerem. Przeanalizuj poniższe commity z projektu Otwarty Parlament i napisz wpis do CHANGELOG.md.
    
    COMMITY:
    {commits}
    
    ZASADY:
    1. Grupuj zmiany: [Funkcje], [Poprawki], [Infrastruktura], [Refaktoryzacja].
    2. Ignoruj commity typu "fix typo", "update readme", "wip".
    3. Pisz prostym językiem, zrozumiałym dla PM-a.
    4. Użyj formatu Markdown.
    
    WYNIK (Tylko treść Markdown):
    """
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        resp = model.generate_content(prompt)
        return resp.text
    except Exception as e:
        return f"Error generating changelog: {str(e)}"

if __name__ == "__main__":
    commits = get_recent_commits()
    changelog = generate_changelog(commits)
    
    with open("CHANGELOG_DRAFT.md", "w") as f:
        f.write("# Ostatnie Zmiany (AI Generated)\n\n")
        f.write(changelog)
    
    print("Changelog generated: CHANGELOG_DRAFT.md")
EOF
# Install if missing
pip install google-generativeai > /dev/null 2>&1 || true
python3 /tmp/gen_changelog.py && rm /tmp/gen_changelog.py

> **Result:** check `CHANGELOG_DRAFT.md` for the summary.
