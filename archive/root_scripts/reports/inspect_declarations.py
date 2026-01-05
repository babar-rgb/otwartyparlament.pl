import requests
import json

def inspect_declarations():
    # Fetch list of MPs to get a valid ID
    print("Fetching MPs...")
    resp = requests.get("https://api.sejm.gov.pl/sejm/term10/MP")
    if resp.status_code != 200:
        print("Failed to fetch MPs")
        return

    mps = resp.json()
    if not mps:
        print("No MPs found")
        return

    # Pick a random MP (e.g., first one)
    mp_id = mps[0]['id']
    mp_name = mps[0]['firstLastName']
    print(f"Inspecting declarations for MP: {mp_name} (ID: {mp_id})")

    # Try to fetch declarations (guessing endpoint based on standard Sejm API patterns)
    # Usually it is /MP/{id}/declarations or similar.
    # Let's try a few common patterns if documentation isn't available.
    
    # Pattern 1: Check MP details for links
    url = f"https://api.sejm.gov.pl/sejm/term10/MP/{mp_id}"
    print(f"Checking details at {url}...")
    resp = requests.get(url)
    if resp.status_code == 200:
        data = resp.json()
        print("MP Details Keys:", data.keys())
        # Check for 'declarations' or similar keys
        if 'declarations' in data:
             print("Found 'declarations' in MP details!")
             print(json.dumps(data['declarations'], indent=2, ensure_ascii=False))
        else:
             print("'declarations' key not found in MP details.")
             
    # Pattern 3: Scrape Sejm Website (Main Page)
    padded_id = f"{mp_id:03d}"
    url_web = f"https://www.sejm.gov.pl/Sejm10.nsf/posel.xsp?id={padded_id}"
    print(f"Checking website {url_web}...")
    
    resp = requests.get(url_web)
    if resp.status_code == 200:
        print("Website fetch success!")
        # Print title to verify
        if "<title>" in resp.text:
            start = resp.text.find("<title>") + 7
            end = resp.text.find("</title>")
            print(f"Page Title: {resp.text[start:end]}")
            
        # Search for "Oświadczenia"
        if "Oświadczenia" in resp.text:
            print("Found 'Oświadczenia' text in HTML!")
            # Print context
            idx = resp.text.find("Oświadczenia")
            print(f"Context: {resp.text[idx-50:idx+100]}")
    # Pattern 5: Scrape with Headers
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    }
    
    padded_id = f"{mp_id:03d}"
    url_web = f"https://www.sejm.gov.pl/Sejm10.nsf/posel.xsp?id={padded_id}"
    print(f"Checking website {url_web} with headers...")
    
    try:
        resp = requests.get(url_web, headers=headers, timeout=10)
        if resp.status_code == 200:
            print("Website fetch success!")
            if "Oświadczenia majątkowe" in resp.text:
                print("Found 'Oświadczenia majątkowe' text!")
                # Try to extract the link
                # Look for href containing "OSW" or "osw10.nsf"
                if "osw10.nsf" in resp.text:
                    print("Found 'osw10.nsf' in HTML!")
                    # Extract a sample link
                    import re
                    matches = re.findall(r'href="([^"]*osw10.nsf[^"]*)"', resp.text)
                    for m in matches:
                        print(f"Found Link: {m}")
            else:
                print("Text 'Oświadczenia majątkowe' not found.")
        else:
            print(f"Website fetch failed: {resp.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_declarations()
