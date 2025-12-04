from playwright.sync_api import sync_playwright
import time

def scrape_declarations():
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 720},
            ignore_https_errors=True
        )
        page = context.new_page()
        
        mp_id = "001"
        url = f"https://www.sejm.gov.pl/Sejm10.nsf/posel.xsp?id={mp_id}"
        print(f"Navigating to {url}...")
        
        page.goto(url)
        
        # Wait for load
        page.wait_for_load_state("networkidle")
        
        # Scroll to bottom to trigger lazy loading
        print("Scrolling to bottom...")
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(2000)
        
        # Take screenshot
        page.screenshot(path="debug_page.png")
        print("Screenshot saved to debug_page.png")
        
        # Try to find by partial text
        try:
            print("Waiting for 'Oświadczenia' link...")
            links = page.get_by_text("Oświadczenia", exact=False).all()
            print(f"Found {len(links)} links with text 'Oświadczenia'")
            
            for i, link in enumerate(links):
                print(f"Link {i}: {link.inner_text()}")
                
            # Click the one that says "Oświadczenia majątkowe"
            target_link = page.get_by_text("Oświadczenia majątkowe", exact=True)
            if target_link.count() > 0:
                print("Clicking 'Oświadczenia majątkowe'...")
                target_link.first.click()
                page.wait_for_timeout(3000)
                
                # Look for PDF links
                print("Extracting PDF links...")
                pdf_links = page.locator("a[href*='.pdf']").all()
                print(f"Found {len(pdf_links)} PDF links.")
                
                # Dump HTML
                with open("debug_click.html", "w") as f:
                    f.write(page.content())
                print("Saved debug_click.html")
                
                # Print ALL links again
                print("Printing all links after click...")
                links = page.locator("a").all()
                for link in links:
                    try:
                        text = link.inner_text()
                        href = link.get_attribute("href")
                        if "OSW" in href or "pdf" in href:
                            print(f"Found potential link: {text} -> {href}")
                    except:
                        pass
            else:
                print("Exact link 'Oświadczenia majątkowe' not found.")
                
        except Exception as e:
            print(f"Error: {e}")
            
        browser.close()

if __name__ == "__main__":
    scrape_declarations()
