#!/usr/bin/env python3
"""
Reclassify votes to fill missing topic_tag values.
Uses the same keyword_map logic as the ETL.

Run: python scripts/fill_topic_tag.py
"""

import subprocess
from keyword_map import CATEGORY_KEYWORDS

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
DB_USER = "kajtek"


def run_sql(query, return_output=False):
    """Execute SQL"""
    if return_output:
        cmd = [PSQL, "-U", DB_USER, "-d", DB, "-t", "-c", query]
    else:
        cmd = [PSQL, "-U", DB_USER, "-d", DB, "-c", query]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"SQL Error: {result.stderr[:200]}")
        return None
    return result.stdout.strip() if return_output else True


def classify_vote(title):
    """Classify based on title keywords"""
    if not title:
        return 'INNE'
    
    title_lower = title.lower()
    
    # Procedural filter
    procedural_prefixes = ["wybór", "powołanie", "odwołanie", "zmiany w składach"]
    if any(title_lower.startswith(p) for p in procedural_prefixes):
        return "PERSONALNE/PROCEDURALNE"
    
    symbolic_words = ["upamiętnienia", "rocznicy", "dnia"]
    if any(w in title_lower for w in symbolic_words):
        return "SYMBOLICZNE"
    
    # Score-based
    scores = {cat: 0 for cat in CATEGORY_KEYWORDS}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in title_lower:
                scores[cat] += 1
                if f"zmiana ustawy o {kw}" in title_lower:
                    scores[cat] += 2
    
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else 'INNE'


def fill_topic_tags():
    """Fill missing topic_tag values in votes table"""
    print("Fetching votes without topic_tag...")
    
    output = run_sql("""
    SELECT id, title_clean, title_raw
    FROM votes 
    WHERE topic_tag IS NULL OR topic_tag = 'INNE'
    LIMIT 5000;
    """, return_output=True)
    
    if not output:
        print("No votes to update")
        return
    
    votes = []
    for line in output.split('\n'):
        if '|' in line:
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 3:
                votes.append({
                    'id': parts[0],
                    'title': parts[1] or parts[2]
                })
    
    print(f"Found {len(votes)} votes to classify")
    
    updated = 0
    for vote in votes:
        tag = classify_vote(vote['title'])
        if tag and tag != 'INNE':
            safe_tag = tag.replace("'", "''")
            query = f"""
            UPDATE votes SET topic_tag = '{safe_tag}'
            WHERE id = {vote['id']};
            """
            if run_sql(query):
                updated += 1
    
    print(f"✅ Updated {updated} votes with topic_tag")


def show_stats():
    output = run_sql("""
    SELECT topic_tag, count(*) as cnt
    FROM votes
    WHERE topic_tag IS NOT NULL
    GROUP BY topic_tag
    ORDER BY cnt DESC;
    """, return_output=True)
    print("\n📊 TOPIC TAG DISTRIBUTION:")
    print(output)


def main():
    print("="*60)
    print("  TOPIC TAG FILLER")
    print("="*60)
    
    fill_topic_tags()
    show_stats()


if __name__ == "__main__":
    main()
