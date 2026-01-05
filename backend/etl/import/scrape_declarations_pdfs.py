#!/usr/bin/env python3
"""
Scrape and download ALL declaration PDFs using Playwright.
Visits each MP's page, finds PDF links, downloads them.

Run: python scripts/scrape_declarations_pdfs.py
"""

import os
import subprocess
import time
import requests
from pathlib import Path
from playwright.sync_api import sync_playwright

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
DB_USER = "kajtek"

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "declarations"


def run_sql(query):
    """Execute SQL and return output"""
    cmd = [PSQL, "-U", DB_USER, "-d", DB, "-t", "-A", "-c", query]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return None
    return result.stdout.strip()


def get_mps_needing_declarations():
    """Get list of MPs to scrape"""
    output = run_sql("""
    SELECT DISTINCT mp_id FROM asset_declarations ORDER BY mp_id;
    """)
    if not output:
        return []
    return [int(x) for x in output.split('\n') if x.strip()]


def download_pdf(url, output_path):
    """Download PDF from URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30, allow_redirects=True)
        if response.status_code == 200 and len(response.content) > 1000:
            # Check if it's actually a PDF
            if response.content[:4] == b'%PDF':
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                return True
        return False
    except Exception as e:
        return False


def update_db_with_pdf(mp_id, year, pdf_url, local_path):
    """Update database with PDF info"""
    safe_url = pdf_url.replace("'", "''")
    safe_path = str(local_path).replace("'", "''")
    
    # Check if record exists
    existing = run_sql(f"""
    SELECT id FROM asset_declarations WHERE mp_id = {mp_id} AND year LIKE '{year}%';
    """)
    
    if existing:
        # Update existing record
        run_sql(f"""
        UPDATE asset_declarations 
        SET pdf_url = '{safe_url}', file_path = '/assets/declarations/{os.path.basename(local_path)}'
        WHERE mp_id = {mp_id} AND year LIKE '{year}%';
        """)
    else:
        # Insert new record
        run_sql(f"""
        INSERT INTO asset_declarations (mp_id, year, pdf_url, file_path)
        VALUES ({mp_id}, '{year}', '{safe_url}', '/assets/declarations/{os.path.basename(local_path)}');
        """)


def main():
    print("=" * 60)
    print("  DECLARATION PDF SCRAPER (Playwright)")
    print("=" * 60)
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    mp_ids = get_mps_needing_declarations()
    print(f"Found {len(mp_ids)} MPs with declarations")
    
    # Check existing files
    existing = set(os.listdir(OUTPUT_DIR))
    print(f"Already have {len(existing)} PDFs on disk")
    
    downloaded = 0
    failed = 0
    skipped = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        page = context.new_page()
        
        for i, mp_id in enumerate(mp_ids):
            padded_id = f"{mp_id:03d}"
            
            print(f"[{i+1}/{len(mp_ids)}] MP {padded_id}...", end=" ", flush=True)
            
            try:
                # Navigate to MP's base page
                url = f"https://www.sejm.gov.pl/Sejm10.nsf/posel.xsp?id={padded_id}"
                page.goto(url, timeout=30000)
                page.wait_for_timeout(1000)
                
                # Click on "Oświadczenia majątkowe" tab
                osw_link = page.locator("#osw")
                if osw_link.count() > 0:
                    osw_link.click()
                    page.wait_for_timeout(2000)
                else:
                    print("No osw tab")
                    skipped += 1
                    continue
                
                # Wait for PDF links to appear
                try:
                    page.wait_for_selector("a[href*='.pdf']", timeout=5000)
                except:
                    print("No PDFs loaded")
                    skipped += 1
                    continue
                
                # Find all PDF links
                pdf_links = page.locator("a[href*='.pdf']").all()
                
                if not pdf_links:
                    print("No PDFs found")
                    skipped += 1
                    continue
                
                mp_downloaded = 0
                for j, link in enumerate(pdf_links):
                    try:
                        href = link.get_attribute("href")
                        if not href or "OSWUE" in href:  # Skip EU declarations
                            continue
                        
                        # Extract year from href
                        year = "2024"
                        for y in ["2023", "2024", "2025"]:
                            if y in href:
                                year = y
                                break
                        
                        # Create unique filename
                        filename = f"{mp_id}_{year}_{j}.pdf"
                        output_path = OUTPUT_DIR / filename
                        
                        # Skip if already exists
                        if filename in existing:
                            continue
                        
                        # Make URL absolute
                        if href.startswith("/"):
                            href = "https://www.sejm.gov.pl" + href
                        elif not href.startswith("http"):
                            href = "https://orka.sejm.gov.pl" + href
                        
                        if download_pdf(href, output_path):
                            mp_downloaded += 1
                            existing.add(filename)  # Add to set to avoid re-download
                    except Exception as e:
                        pass
                
                if mp_downloaded > 0:
                    print(f"✅ {mp_downloaded} PDFs")
                    downloaded += mp_downloaded
                else:
                    print("Already have all")
                    skipped += 1
                    
            except Exception as e:
                print(f"❌ {str(e)[:40]}")
                failed += 1
            
            # Rate limiting
            time.sleep(0.5)
            
            # Progress every 50
            if (i + 1) % 50 == 0:
                print(f"\n--- Progress: {i+1}/{len(mp_ids)} | Downloaded: {downloaded} | Failed: {failed} ---\n")
        
        browser.close()
    
    print()
    print("=" * 60)
    print(f"  COMPLETE")
    print(f"  - New PDFs: {downloaded}")
    print(f"  - Failed: {failed}")
    print(f"  - Skipped: {skipped}")
    print("=" * 60)
    
    # Final count
    final_count = len(os.listdir(OUTPUT_DIR))
    print(f"\nTotal PDFs on disk: {final_count}")


if __name__ == "__main__":
    main()
