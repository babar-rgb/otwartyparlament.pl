import requests
from bs4 import BeautifulSoup

def check_tusk_html():
    url = "https://www.sejm.gov.pl/Sejm10.nsf/posel.xsp?id=400&term=10"
    print(f"Fetching {url}...")
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        
        soup = BeautifulSoup(resp.content, 'html.parser')
        
        # Look for "Prezes Rady Ministrów" text
        found = soup.find_all(string=lambda text: text and "Prezes Rady Ministrów" in text)
        if found:
            print("FOUND KEYWORD!")
            for f in found:
                print(f"Context: {f.parent}")
                print(f"Parent Class: {f.parent.get('class')}")
        else:
            print("NOT FOUND. Dumping text:")
            print(soup.get_text()[:2000])

    except Exception as e:
        print(e)
        
if __name__ == "__main__":
    check_tusk_html()
