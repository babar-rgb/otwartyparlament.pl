import os
import time
import json
from playwright.sync_api import sync_playwright
from supabase import create_client, Client

# Manually load .env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
except Exception:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_and_update():
    print("Starting Asset Declarations Import...")
    
    # 1. Fetch all MPs
    response = supabase.table('mps').select('id, name').order('id').execute()
    mps = response.data
    
    print(f"Found {len(mps)} MPs to process.")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 720},
            ignore_https_errors=True
        )
        page = context.new_page()
        
        for i, mp in enumerate(mps):
            mp_id = mp['id']
            padded_id = f"{mp_id:03d}"
            name = mp['name']
            
            print(f"[{i+1}/{len(mps)}] Processing {name} (ID: {padded_id})...")
            
            try:
                url = f"https://www.sejm.gov.pl/Sejm10.nsf/posel.xsp?id={padded_id}"
                page.goto(url, timeout=30000)
                page.wait_for_load_state("networkidle")
                
                # Scroll to bottom to trigger lazy loading
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(1000)
                
                # Look for "Oświadczenia majątkowe" link by ID "osw"
                declarations = []
                try:
                    osw_link = page.locator("#osw")
                    if osw_link.count() > 0:
                        osw_link.click()
                        
                        # Wait for content to load (AJAX)
                        # We wait for at least one PDF link to appear or a timeout
                        try:
                            page.wait_for_selector("a[href*='OSW10']", timeout=10000)
                        except:
                            # Maybe no declarations?
                            pass
                            
                        # Find PDF links
                        # Filter for Sejm MPs (OSW10) and current MP ID
                        pdf_elements = page.locator(f"a[href*='OSW10'][href*='_{padded_id}.pdf']").all()
                        
                        for el in pdf_elements:
                            try:
                                href = el.get_attribute("href")
                                text = el.inner_text().strip()
                                
                                if href and text and "OSWUE" not in href:
                                    declarations.append({
                                        "label": text,
                                        "url": href
                                    })
                            except:
                                pass
                except Exception as e:
                    print(f"  Error clicking #osw: {e}")
                
                if declarations:
                    print(f"  Found {len(declarations)} declarations.")
                    # Update DB
                    supabase.table('mps').update({'declarations': declarations}).eq('id', mp_id).execute()
                else:
                    print("  No declarations found.")
                    
            except Exception as e:
                print(f"  Error processing MP {mp_id}: {e}")
                
            # Small delay to be nice to the server
            # time.sleep(0.5) 
            
        browser.close()
    
    print("Import completed.")

if __name__ == "__main__":
    scrape_and_update()
