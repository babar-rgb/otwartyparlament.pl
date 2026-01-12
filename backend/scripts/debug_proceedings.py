
import sys
import os
import requests
import json

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

URL = "https://api.sejm.gov.pl/sejm/term10/proceedings"

print(f"Fetching {URL}...")
try:
    resp = requests.get(URL)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Type: {type(data)}")
        print(f"Length: {len(data)}")
        if len(data) > 0:
            print("First item sample:")
            print(json.dumps(data[0], indent=2))
    else:
        print(f"Error: {resp.text}")
except Exception as e:
    print(f"Exception: {e}")
