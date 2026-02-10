import requests
import json
from bs4 import BeautifulSoup

def clean(html):
    soup = BeautifulSoup(html, 'html.parser')
    return soup.get_text().strip()[:200]

def main():
    term = 10
    prints = ["361", "24", "19", "27", "363"]
    
    for print_num in prints:
        url = f"https://api.sejm.gov.pl/sejm/term{term}/prints/{print_num}"
        print(f"--- Print {print_num} ---")
        try:
             resp = requests.get(url)
             data = resp.json()
             attachments = data.get('attachments', [])
             for att in attachments:
                 name = att if isinstance(att, str) else att.get('fileName')
                 print(f"File: {name}")
        except:
             print("Error")

if __name__ == "__main__":
    main()
