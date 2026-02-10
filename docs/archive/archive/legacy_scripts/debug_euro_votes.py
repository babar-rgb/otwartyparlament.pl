import requests
import json

# Try resolving ELI URI directly
API_URL = "https://data.europarl.europa.eu/eli/dl/event/MTG-PL-2024-01-15-DEC-163200?format=application%2Fld%2Bjson"

def debug_votes():
    print(f"Fetching VOTE DETAILS from: {API_URL}")
    try:
        response = requests.get(API_URL)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Keys:", data.keys())
            if 'data' in data:
                 print(json.dumps(data['data'], indent=2))
            else:
                 print(json.dumps(data, indent=2))
                 
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_votes()
