#!/usr/bin/env python3
"""
Download missing declaration PDFs from Sejm website.
Uses direct URL construction from existing pdf_url data.

Run: python scripts/download_declarations_pdfs.py
"""

import os
import subprocess
import requests
import time
from pathlib import Path

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
DB_USER = "kajtek"

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "declarations"

def run_sql(query):
    """Execute SQL and return output"""
    cmd = [PSQL, "-U", DB_USER, "-d", DB, "-t", "-A", "-c", query]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"SQL Error: {result.stderr[:200]}")
        return None
    return result.stdout.strip()


def get_declarations_to_download():
    """Get declarations that need PDF download"""
    output = run_sql("""
    SELECT id, mp_id, year, pdf_url, file_path
    FROM asset_declarations 
    ORDER BY id;
    """)
    
    if not output:
        return []
    
    declarations = []
    for line in output.split('\n'):
        if '|' in line:
            parts = line.split('|')
            if len(parts) >= 5:
                declarations.append({
                    'id': parts[0],
                    'mp_id': parts[1],
                    'year': parts[2],
                    'pdf_url': parts[3],
                    'file_path': parts[4]
                })
    return declarations


def download_pdf(url, output_path):
    """Download PDF from URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 200 and len(response.content) > 1000:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            return True
        return False
    except Exception as e:
        print(f"    Error: {e}")
        return False


def main():
    print("=" * 60)
    print("  DECLARATION PDF DOWNLOADER")
    print("=" * 60)
    
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    declarations = get_declarations_to_download()
    print(f"Found {len(declarations)} declarations in database")
    
    # Check which files already exist
    existing = set(os.listdir(OUTPUT_DIR))
    print(f"Already have {len(existing)} PDFs on disk")
    
    to_download = []
    for d in declarations:
        filename = d['file_path'].split('/')[-1] if d['file_path'] else None
        # Only download if we have a valid URL (starts with http) and file doesn't exist
        if filename and filename not in existing and d['pdf_url'].startswith('http'):
            to_download.append(d)
    
    print(f"Need to download {len(to_download)} PDFs")
    print()
    
    if not to_download:
        print("Nothing to download!")
        return
    
    downloaded = 0
    failed = 0
    
    for i, d in enumerate(to_download):
        filename = d['file_path'].split('/')[-1]
        output_path = OUTPUT_DIR / filename
        
        print(f"[{i+1}/{len(to_download)}] {filename}...", end=" ")
        
        if download_pdf(d['pdf_url'], output_path):
            print("✅")
            downloaded += 1
        else:
            print("❌")
            failed += 1
        
        # Rate limiting
        time.sleep(0.2)
        
        # Progress checkpoint every 50
        if (i + 1) % 50 == 0:
            print(f"Progress: {i+1}/{len(to_download)} - Downloaded: {downloaded}, Failed: {failed}")
    
    print()
    print("=" * 60)
    print(f"  COMPLETE: Downloaded {downloaded}, Failed {failed}")
    print("=" * 60)


if __name__ == "__main__":
    main()
