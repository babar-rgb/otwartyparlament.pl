import requests
import json

url = "https://api.sejm.gov.pl/sejm/term10/interpellations/1"
print(f"Fetching {url}...")
r = requests.get(url)
if r.status_code == 200:
    data = r.json()
    print(json.dumps(data, indent=2, ensure_ascii=False))
else:
    print(f"Error: {r.status_code}")
