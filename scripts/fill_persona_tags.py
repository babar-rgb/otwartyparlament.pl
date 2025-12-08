#!/usr/bin/env python3
"""
Fill persona_tags based on topic_tag mapping.
Maps vote topics to affected personas (Rolnik, Pacjent, etc.)

Run: python scripts/fill_persona_tags.py
"""

import subprocess

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
DB_USER = "kajtek"

# Mapping: topic_tag -> list of personas affected
TOPIC_TO_PERSONAS = {
    # Zdrowie
    "ZDROWIE": ["Pacjent", "Senior", "Rodzic"],
    
    # Rolnictwo
    "ROLNICTWO": ["Rolnik", "Mieszkaniec wsi"],
    
    # Gospodarka
    "GOSPODARKA": ["Przedsiębiorca", "Pracownik"],
    
    # Edukacja
    "EDUKACJA": ["Student", "Rodzic", "Nauczyciel"],
    
    # Finanse
    "FINANSE": ["Podatnik", "Przedsiębiorca", "Emeryt"],
    
    # Praca
    "PRACA": ["Pracownik", "Przedsiębiorca", "Bezrobotny"],
    
    # Środowisko
    "ŚRODOWISKO": ["Ekolog", "Mieszkaniec miasta", "Rolnik"],
    
    # Transport
    "TRANSPORT": ["Kierowca", "Podróżny", "Mieszkaniec wsi"],
    
    # Bezpieczeństwo
    "BEZPIECZEŃSTWO": ["Obywatel"],
    
    # Sprawy społeczne
    "SPOŁECZNE": ["Senior", "Rodzic", "Osoba niepełnosprawna"],
    
    # Kultura
    "KULTURA": ["Artysta", "Obywatel"],
    
    # Samorząd
    "SAMORZĄD": ["Mieszkaniec gminy", "Samorządowiec"],
    
    # Wymiar sprawiedliwości
    "SPRAWIEDLIWOŚĆ": ["Obywatel"],
    
    # Obrona
    "OBRONNOŚĆ": ["Żołnierz", "Obywatel"],
    
    # Personalne/Proceduralne - no specific persona
    "PERSONALNE/PROCEDURALNE": [],
    
    # Symboliczne
    "SYMBOLICZNE": [],
    
    # Inne - general
    "INNE": ["Obywatel"],
}


def run_sql(query, return_output=False):
    """Execute SQL"""
    if return_output:
        cmd = [PSQL, "-U", DB_USER, "-d", DB, "-t", "-A", "-c", query]
    else:
        cmd = [PSQL, "-U", DB_USER, "-d", DB, "-c", query]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"SQL Error: {result.stderr[:200]}")
        return None
    return result.stdout.strip() if return_output else True


def fill_persona_tags():
    """Fill persona_tags based on topic_tag"""
    print("Filling persona_tags based on topic_tag mapping...")
    
    updated = 0
    for topic, personas in TOPIC_TO_PERSONAS.items():
        if not personas:
            continue
            
        # Format as PostgreSQL array
        pg_array = "ARRAY[" + ",".join([f"'{p}'" for p in personas]) + "]"
        
        query = f"""
        UPDATE votes 
        SET persona_tags = {pg_array}
        WHERE topic_tag = '{topic}'
        AND (persona_tags IS NULL OR persona_tags = '{{}}');
        """
        
        result = run_sql(query)
        if result:
            # Count how many were updated for this topic
            count = run_sql(f"SELECT COUNT(*) FROM votes WHERE topic_tag = '{topic}';", return_output=True)
            print(f"  {topic}: {count} głosowań → {personas}")
            updated += int(count) if count else 0
    
    print(f"\n✅ Zaktualizowano persona_tags dla głosowań")


def show_stats():
    """Show persona distribution"""
    print("\n📊 ROZKŁAD PERSON:")
    
    # Get unique personas
    output = run_sql("""
    SELECT unnest(persona_tags) as persona, COUNT(*) as cnt
    FROM votes
    WHERE persona_tags IS NOT NULL AND persona_tags != '{}'
    GROUP BY persona
    ORDER BY cnt DESC;
    """, return_output=True)
    
    if output:
        print("\n| Persona | Liczba głosowań |")
        print("|---|---|")
        for line in output.split('\n'):
            if '|' in line:
                parts = line.split('|')
                print(f"| {parts[0]} | {parts[1]} |")


def main():
    print("=" * 60)
    print("  PERSONA TAGS FILLER")
    print("=" * 60)
    
    # Check current state
    current = run_sql("""
    SELECT COUNT(*) FROM votes WHERE persona_tags IS NOT NULL AND persona_tags != '{}';
    """, return_output=True)
    print(f"Obecny stan: {current} głosowań ma persona_tags\n")
    
    fill_persona_tags()
    show_stats()
    
    # Final count
    final = run_sql("""
    SELECT COUNT(*) FROM votes WHERE persona_tags IS NOT NULL AND persona_tags != '{}';
    """, return_output=True)
    print(f"\n✅ GOTOWE: {final} głosowań ma teraz persona_tags")


if __name__ == "__main__":
    main()
