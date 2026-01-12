import requests
import json

def check_mp_detail():
    url = "https://api.sejm.gov.pl/sejm/term10/MP/400"
    print(f"Fetching from {url}...")
    try:
        resp = requests.get(url)
        data = resp.json()
        print(json.dumps(data, indent=2))
            
    except Exception as e:
        print(e)

if __name__ == "__main__":
    check_mp_detail()
