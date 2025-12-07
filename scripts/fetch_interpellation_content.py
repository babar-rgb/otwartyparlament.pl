#!/usr/bin/env python3
"""
Fetch Missing Interpellation Content
Uses Sejm API to download body text for interpellations without content.

API endpoint: https://api.sejm.gov.pl/sejm/term10/interpellations/{num}/body
"""

import subprocess
import requests
import time
import re
from html import unescape

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
API_BASE = "https://api.sejm.gov.pl/sejm/term10/interpellations"

def run_sql(query, return_rows=True):
    """Execute SQL using psql"""
    cmd = [PSQL, "-d", DB, "-t", "-c", query]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return []
    if return_rows:
        lines = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
        return lines
    return []

def get_count(query):
    result = run_sql(query)
    return int(result[0]) if result else 0

def clean_html(html):
    """Strip HTML tags and clean text"""
    if not html:
        return None
    # Remove HTML tags
    clean = re.sub(r'<[^>]+>', ' ', html)
    # Decode entities
    clean = unescape(clean)
    # Clean whitespace
    clean = ' '.join(clean.split())
    return clean[:10000] if clean else None  # Limit length

def fetch_interpellation_body(num):
    """Fetch body text from Sejm API"""
    try:
        url = f"{API_BASE}/{num}/body"
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            return clean_html(resp.text)
        return None
    except Exception as e:
        return None

def main():
    print("="*70)
    print("  FETCH MISSING INTERPELLATION CONTENT")
    print("  Source: api.sejm.gov.pl")
    print("="*70)
    
    # Get current stats
    total = get_count("SELECT count(*) FROM interpellations")
    with_content = get_count("SELECT count(*) FROM interpellations WHERE content IS NOT NULL AND content != ''")
    missing = total - with_content
    
    print(f"\nCurrent state:")
    print(f"  Total interpellations: {total:,}")
    print(f"  With content:          {with_content:,}")
    print(f"  Missing content:       {missing:,}")
    
    if missing == 0:
        print("\n✅ All interpellations already have content!")
        return
    
    # Get interpellations without content
    # Need to extract the interpellation number from raw_data or id
    rows = run_sql("""
        SELECT id, raw_data::json->>'num' as num
        FROM interpellations 
        WHERE (content IS NULL OR content = '')
        AND raw_data IS NOT NULL
        ORDER BY id
        LIMIT 500
    """)
    
    print(f"\nFetching content for {len(rows)} interpellations...")
    
    fetched = 0
    failed = 0
    
    for idx, row in enumerate(rows):
        parts = row.split('|')
        if len(parts) < 2:
            continue
        
        interp_id = parts[0].strip()
        num = parts[1].strip()
        
        if not num or num == 'None':
            failed += 1
            continue
        
        if (idx + 1) % 50 == 0:
            print(f"\n--- Progress: {idx+1}/{len(rows)} | Fetched: {fetched} | Failed: {failed} ---\n")
        
        print(f"[{idx+1}/{len(rows)}] Interpelacja #{num}...", end=" ", flush=True)
        
        body = fetch_interpellation_body(num)
        
        if body and len(body) > 50:
            # Escape quotes for SQL
            body_escaped = body.replace("'", "''")
            
            # Update database
            run_sql(f"""
                UPDATE interpellations 
                SET content = '{body_escaped[:9999]}' 
                WHERE id = {interp_id}
            """, return_rows=False)
            
            print(f"✅ {len(body)} chars")
            fetched += 1
        else:
            print("❌")
            failed += 1
        
        # Rate limiting
        time.sleep(0.2)
    
    # Final stats
    final_with_content = get_count("SELECT count(*) FROM interpellations WHERE content IS NOT NULL AND content != ''")
    
    print("\n" + "="*70)
    print("  FINAL RESULTS")
    print("="*70)
    print(f"  Fetched:       {fetched}")
    print(f"  Failed:        {failed}")
    print(f"  With content:  {with_content:,} -> {final_with_content:,}")
    print(f"  Coverage:      {final_with_content/total*100:.1f}%")
    print("\n✅ Fetch complete!")

if __name__ == "__main__":
    main()
