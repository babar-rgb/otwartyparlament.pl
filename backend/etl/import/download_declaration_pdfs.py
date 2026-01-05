#!/usr/bin/env python3
"""
Download Asset Declaration PDFs from orka.sejm.gov.pl
orka.sejm.gov.pl does NOT have anti-bot protection like www.sejm.gov.pl!

Downloads PDFs to: public/assets/declarations/{mp_id}_{year}.pdf
Updates database with local paths
"""

import subprocess
import os
import time
import requests
import re

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
OUTPUT_DIR = "/Users/kajtek/sejm/git/parlament/public/assets/declarations"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
}

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

def download_pdf(url, output_path):
    """Download PDF file"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30, stream=True)
        if resp.status_code == 200:
            with open(output_path, 'wb') as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # Verify file is a PDF (starts with %PDF)
            with open(output_path, 'rb') as f:
                header = f.read(4)
                if header == b'%PDF':
                    return True
                else:
                    os.remove(output_path)
                    return False
        return False
    except Exception as e:
        return False

def main():
    print("="*70)
    print("  DOWNLOAD ASSET DECLARATION PDFs")
    print("  Source: orka.sejm.gov.pl (no anti-bot protection!)")
    print("="*70)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Get all declarations with external URLs
    rows = run_sql("""
        SELECT id, mp_id, year, pdf_url 
        FROM asset_declarations 
        WHERE pdf_url LIKE 'https://orka%'
        ORDER BY mp_id, year DESC
    """)
    
    print(f"\nFound {len(rows)} declarations with orka.sejm.gov.pl URLs")
    
    downloaded = 0
    failed = 0
    skipped = 0
    
    for idx, row in enumerate(rows):
        parts = row.split('|')
        if len(parts) < 4:
            continue
            
        decl_id = parts[0].strip()
        mp_id = parts[1].strip()
        year = parts[2].strip()[:4] if parts[2].strip() else 'unknown'  # Get just year
        pdf_url = parts[3].strip()
        
        # Generate local filename
        filename = f"{mp_id}_{year}_{decl_id}.pdf"
        local_path = os.path.join(OUTPUT_DIR, filename)
        web_path = f"/assets/declarations/{filename}"
        
        # Skip if already downloaded
        if os.path.exists(local_path):
            skipped += 1
            continue
        
        print(f"[{idx+1}/{len(rows)}] MP {mp_id} / {year}...", end=" ", flush=True)
        
        if download_pdf(pdf_url, local_path):
            # Update database with local path
            run_sql(f"""
                UPDATE asset_declarations 
                SET pdf_url = '{web_path}' 
                WHERE id = {decl_id}
            """, return_rows=False)
            
            size_kb = os.path.getsize(local_path) / 1024
            print(f"✅ {size_kb:.0f}KB")
            downloaded += 1
        else:
            print("❌ Failed")
            failed += 1
        
        # Be nice to server
        time.sleep(0.3)
        
        # Progress every 50
        if (idx + 1) % 50 == 0:
            print(f"\n--- Progress: {idx+1}/{len(rows)} | Downloaded: {downloaded} | Failed: {failed} ---\n")
    
    # Final stats
    total_local = get_count("SELECT count(*) FROM asset_declarations WHERE pdf_url LIKE '/assets/%'")
    total_pdfs = len([f for f in os.listdir(OUTPUT_DIR) if f.endswith('.pdf')])
    
    print("\n" + "="*70)
    print("  FINAL RESULTS")
    print("="*70)
    print(f"  Downloaded: {downloaded}")
    print(f"  Failed:     {failed}")
    print(f"  Skipped:    {skipped}")
    print(f"  Local PDFs: {total_pdfs} files")
    print(f"  DB Updated: {total_local} records with local paths")
    print("\n✅ Download complete!")

if __name__ == "__main__":
    main()
