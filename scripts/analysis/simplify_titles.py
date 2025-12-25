#!/usr/bin/env python3
"""
Generate short, citizen-friendly titles for votes using AI.
Transforms long legal jargon into engaging headlines.

Run: python scripts/simplify_titles.py
"""

import os
import subprocess
import time
import google.generativeai as genai

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
DB_USER = "kajtek"

# Load .env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
except:
    pass

# Configure Gemini
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')


def run_sql(query, return_output=False):
    """Execute SQL"""
    cmd = [PSQL, "-U", DB_USER, "-d", DB, "-t", "-A", "-c", query]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return None
    return result.stdout.strip() if return_output else True


def simplify_title(long_title: str) -> str:
    """Use AI to create a short, engaging title"""
    
    prompt = f"""Jesteś dziennikarzem piszącym dla przeciętnego Polaka. 
Zamień ten nudny, prawniczy tytuł głosowania sejmowego na KRÓTKI (max 8 słów), 
zrozumiały nagłówek jak w gazecie tabloidowej.

ZASADY:
- MAX 8 słów
- Bez "w sprawie", "dot.", "ustawa o"
- Używaj prostego języka
- Bądź konkretny - co się zmienia i dla kogo
- Jeśli to budżet - napisz czyj i na co
- Jeśli to zmiana ustawy - napisz co się zmienia

TYTUŁ ORYGINALNY:
{long_title}

KRÓTKI NAGŁÓWEK (max 8 słów):"""

    try:
        response = model.generate_content(prompt)
        short = response.text.strip().strip('"').strip("'")
        # Remove any trailing punctuation and limit length
        if len(short) > 100:
            short = short[:100]
        return short
    except Exception as e:
        print(f"    AI Error: {e}")
        return None


def get_votes_without_short_title(limit=50):
    """Get votes that need short titles"""
    output = run_sql(f"""
    SELECT id, title_clean, title_raw
    FROM votes 
    WHERE title_short IS NULL
    AND (title_clean IS NOT NULL OR title_raw IS NOT NULL)
    ORDER BY importance_score DESC NULLS LAST, id DESC
    LIMIT {limit};
    """, return_output=True)
    
    if not output:
        return []
    
    votes = []
    for line in output.split('\n'):
        if '|' in line:
            parts = line.split('|')
            votes.append({
                'id': int(parts[0]),
                'title': parts[1] or parts[2]
            })
    return votes


def update_short_title(vote_id: int, short_title: str):
    """Update vote with short title"""
    safe_title = short_title.replace("'", "''")
    run_sql(f"UPDATE votes SET title_short = '{safe_title}' WHERE id = {vote_id};")


def main():
    print("=" * 60)
    print("  TITLE SIMPLIFIER (AI-powered)")
    print("=" * 60)
    
    if not API_KEY:
        print("❌ GEMINI_API_KEY not found in environment!")
        print("Set it in .env file or export GEMINI_API_KEY=...")
        return
    
    # Check current state
    current = run_sql("SELECT COUNT(*) FROM votes WHERE title_short IS NOT NULL;", return_output=True)
    total = run_sql("SELECT COUNT(*) FROM votes;", return_output=True)
    print(f"Stan: {current}/{total} głosowań ma title_short\n")
    
    # Get batch of votes
    BATCH_SIZE = 100
    votes = get_votes_without_short_title(BATCH_SIZE)
    
    if not votes:
        print("✅ Wszystkie głosowania mają już title_short!")
        return
    
    print(f"Przetwarzam {len(votes)} głosowań...\n")
    
    processed = 0
    failed = 0
    
    for i, vote in enumerate(votes):
        print(f"[{i+1}/{len(votes)}] ID {vote['id']}:")
        print(f"  Original: {vote['title'][:80]}...")
        
        short = simplify_title(vote['title'])
        
        if short:
            print(f"  → {short}")
            update_short_title(vote['id'], short)
            processed += 1
        else:
            print(f"  ❌ Failed")
            failed += 1
        
        # Rate limiting for API
        time.sleep(0.5)
        
        # Progress every 20
        if (i + 1) % 20 == 0:
            print(f"\n--- Progress: {i+1}/{len(votes)} | OK: {processed} | Failed: {failed} ---\n")
    
    print()
    print("=" * 60)
    print(f"  GOTOWE: {processed} zaktualizowanych, {failed} błędów")
    print("=" * 60)
    
    # Final count
    final = run_sql("SELECT COUNT(*) FROM votes WHERE title_short IS NOT NULL;", return_output=True)
    print(f"\nŁącznie z title_short: {final}/{total}")


if __name__ == "__main__":
    main()
