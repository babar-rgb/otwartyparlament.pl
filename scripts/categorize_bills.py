#!/usr/bin/env python3
"""
Categorize all bills (processes) using keyword-based classification.
"""
import os
from supabase import create_client
from dotenv import load_dotenv
from keyword_map import CATEGORY_KEYWORDS

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def classify_bill(title):
    """
    Classify bill based on title keywords.
    """
    if not title:
        return 'INNE'
        
    title_lower = title.lower()
    
    # Procedural Filter
    if any(title_lower.startswith(prefix) for prefix in ["wybór", "powołanie", "odwołanie", "zmiany w składach"]):
        return "PERSONALNE/PROCEDURALNE"
        
    if any(keyword in title_lower for keyword in ["upamiętnienia", "dnia", "rocznicy"]):
        return "SYMBOLICZNE"
    
    # Scoring Algorithm
    scores = {category: 0 for category in CATEGORY_KEYWORDS.keys()}
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in title_lower:
                scores[category] += 1
                # Bonus for "zmiana ustawy o [keyword]"
                if f"zmiana ustawy o {keyword}" in title_lower or f"ustawa o {keyword}" in title_lower:
                    scores[category] += 2
                    
    # Find category with highest score
    best_category = max(scores, key=scores.get)
    
    if scores[best_category] > 0:
        return best_category
        
    return 'INNE'

def main():
    print("=== Categorizing Bills ===")
    
    # Fetch all bills without category
    print("Loading bills...")
    offset = 0
    batch = []
    processed = 0
    
    while True:
        res = supabase.table('processes').select('id, title, category').range(offset, offset+999).execute()
        rows = res.data
        if not rows: break
        
        for r in rows:
            # Classify if no category or category is null/empty
            if not r.get('category') or r['category'] == '':
                category = classify_bill(r['title'])
                batch.append({
                    'id': r['id'],
                    'title': r['title'],  # Include for upsert
                    'category': category
                })
                processed += 1
        
        offset += 1000
        if len(rows) < 1000: break
    
    print(f"Found {processed} bills to categorize")
    
    if not batch:
        print("All bills already categorized!")
        return
    
    # Batch update
    print("Updating database...")
    batch_size = 50
    for i in range(0, len(batch), batch_size):
        chunk = batch[i:i+batch_size]
        try:
            supabase.table('processes').upsert(chunk).execute()
            print(f"✓ {i+len(chunk)}/{len(batch)} categorized")
        except Exception as e:
            print(f"Error: {e}")
    
    print("=== Categorization Complete ===")
    
    # Show distribution
    res = supabase.table('processes').select('category').execute()
    from collections import Counter
    counts = Counter(r['category'] for r in res.data if r.get('category'))
    
    print("\nCategory Distribution:")
    for cat, count in counts.most_common():
        print(f"  {cat}: {count}")

if __name__ == "__main__":
    main()
