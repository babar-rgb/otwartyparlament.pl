import requests
import json

def check_mp_api():
    url = "https://api.sejm.gov.pl/sejm/term10/MP"
    print(f"Fetching from {url}...")
    try:
        resp = requests.get(url)
        data = resp.json()
        
        # Find Tusk
        for mp in data:
            if mp['lastName'] == 'Tusk':
                print("Found Donald Tusk:")
                print(json.dumps(mp, indent=2))
                return
        
        print("Tusk not found? Printing first MP...")
        if data:
            print(json.dumps(data[0], indent=2))
            
    except Exception as e:
        print(e)

if __name__ == "__main__":
    check_mp_api()
