#!/usr/bin/env python3
"""
Gap Analysis - Data Quality Audit for "Kompas Obywatelski"
Checks schema existence and data saturation for required columns.

Run: python scripts/gap_analysis.py
"""

import subprocess

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
DB_USER = "kajtek"

# Checklist of required columns for Kompas Obywatelski
CHECKS = [
    # USTAWY (Legislation)
    {"table": "processes", "column": "body_text", "name": "Pełna Treść Ustaw", "critical": True},
    {"table": "processes", "column": "simple_summary", "name": "AI Streszczenia (TL;DR)", "critical": True},
    {"table": "processes", "column": "who_affected", "name": "Kogo Dotyczy", "critical": False},
    {"table": "processes", "column": "category", "name": "Kategoria Procesu", "critical": False},
    
    # GŁOSOWANIA (Votes)
    {"table": "votes", "column": "importance_score", "name": "Ocena Ważności (0-100)", "critical": True},
    {"table": "votes", "column": "topic_tag", "name": "Tag Tematyczny", "critical": True},
    {"table": "votes", "column": "persona_tags", "name": "Tagi Person (Rolnik/Pacjent)", "critical": True},
    {"table": "votes", "column": "controversy_score", "name": "Wskaźnik Kontrowersji", "critical": False},
    {"table": "votes", "column": "ux_category", "name": "Kategoria UX", "critical": False},
    
    # ANALYSIS (AI)
    {"table": "vote_analyses", "column": "summary", "name": "AI Summary Głosowania", "critical": False},
    {"table": "vote_analyses", "column": "pros", "name": "Argumenty Za", "critical": False},
    {"table": "vote_analyses", "column": "cons", "name": "Argumenty Przeciw", "critical": False},
    
    # POSŁOWIE (MPs)
    {"table": "mps", "column": "photo_url", "name": "Zdjęcia Posłów", "critical": True},
    {"table": "mps", "column": "party", "name": "Partia Posła", "critical": True},
    {"table": "mps", "column": "seat_number", "name": "Numer Miejsca w Sejmie", "critical": False},
    
    # AKTYWA (Assets)
    {"table": "asset_declarations", "column": "file_path", "name": "PDFy Oświadczeń", "critical": False},
    
    # INTERAKCJE (Interactions)
    {"table": "interpellations", "column": "content", "name": "Treść Interpelacji", "critical": True},
    {"table": "interpellations", "column": "reply_content", "name": "Odpowiedzi na Interpelacje", "critical": True},
    {"table": "speeches", "column": "content", "name": "Treść Stenogramów", "critical": True},
]


def run_sql(query):
    """Execute SQL and return output"""
    cmd = [PSQL, "-U", DB_USER, "-d", DB, "-t", "-A", "-c", query]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return None
    return result.stdout.strip()


def check_column_exists(table, column):
    """Check if column exists in table schema"""
    query = f"""
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = '{table}' AND column_name = '{column}';
    """
    result = run_sql(query)
    return result == "1"


def get_saturation(table, column):
    """Get fill rate for column"""
    # Count total and filled
    query = f"""
    SELECT 
        COUNT(*) as total,
        COUNT({column}) as filled
    FROM {table};
    """
    result = run_sql(query)
    if not result or '|' not in result:
        return 0, 0, 0
    
    parts = result.split('|')
    total = int(parts[0]) if parts[0] else 0
    filled = int(parts[1]) if parts[1] else 0
    pct = round(100 * filled / total, 1) if total > 0 else 0
    return total, filled, pct


def get_status_emoji(pct, schema_exists, critical):
    """Return status emoji based on saturation"""
    if not schema_exists:
        return "🔴 SCHEMA MISSING" if critical else "⚪ SCHEMA MISSING"
    if pct >= 90:
        return "🟢 READY"
    if pct >= 50:
        return "🟡 IN PROGRESS"
    if pct >= 10:
        return "🟠 LOW"
    return "🔴 CRITICAL" if critical else "⚪ EMPTY"


def get_action(pct, schema_exists, column, critical):
    """Suggest remediation action"""
    if not schema_exists:
        return f"ALTER TABLE ADD {column}"
    if pct >= 90:
        return "✓ Gotowe"
    if pct >= 50:
        return "Kontynuuj ETL"
    return "Uruchom skrypt wypełniający"


def main():
    print("=" * 80)
    print("  GAP ANALYSIS - Kompas Obywatelski Data Quality Audit")
    print("=" * 80)
    print()
    
    # Header
    print(f"{'MODUŁ':<20} {'KOLUMNA':<20} {'SCHEMAT':<12} {'WYPEŁNIENIE':<15} {'STATUS':<18} {'AKCJA'}")
    print("-" * 120)
    
    missing_schemas = []
    low_saturation = []
    
    for check in CHECKS:
        table = check["table"]
        column = check["column"]
        name = check["name"]
        critical = check["critical"]
        
        # Schema check
        schema_exists = check_column_exists(table, column)
        
        if schema_exists:
            total, filled, pct = get_saturation(table, column)
            schema_str = "✅ ISTNIEJE"
            saturation_str = f"{filled:,}/{total:,} ({pct}%)"
        else:
            pct = 0
            schema_str = "❌ BRAK"
            saturation_str = "N/A"
            missing_schemas.append(check)
        
        status = get_status_emoji(pct, schema_exists, critical)
        action = get_action(pct, schema_exists, column, critical)
        
        if schema_exists and pct < 50 and critical:
            low_saturation.append(check)
        
        print(f"{table:<20} {column:<20} {schema_str:<12} {saturation_str:<15} {status:<18} {action}")
    
    print()
    print("=" * 80)
    print("  PODSUMOWANIE")
    print("=" * 80)
    
    if missing_schemas:
        print("\n🔴 BRAKUJĄCE KOLUMNY (wymaga migracji):")
        for s in missing_schemas:
            crit = "KRYTYCZNA" if s["critical"] else "opcjonalna"
            print(f"   - {s['table']}.{s['column']} ({s['name']}) [{crit}]")
    else:
        print("\n✅ Wszystkie kolumny istnieją w schemacie")
    
    if low_saturation:
        print("\n🟡 NISKIE WYPEŁNIENIE (wymaga ETL):")
        for s in low_saturation:
            print(f"   - {s['table']}.{s['column']} ({s['name']})")
    
    print("\n" + "=" * 80)
    print("  REKOMENDOWANE AKCJE")
    print("=" * 80)
    
    if missing_schemas:
        print("\n1. Dodaj brakujące kolumny:")
        for s in missing_schemas:
            if s["column"] == "persona_tags":
                print(f"   ALTER TABLE {s['table']} ADD COLUMN {s['column']} TEXT[];")
            else:
                print(f"   ALTER TABLE {s['table']} ADD COLUMN {s['column']} TEXT;")
    
    print("\n2. Uruchom skrypty wypełniające:")
    print("   python scripts/humanize_laws.py      # simple_summary")
    print("   python scripts/fill_topic_tag.py    # topic_tag")
    print()


if __name__ == "__main__":
    main()
