import requests
import json

url = "https://api.sejm.gov.pl/sejm/term10/processes?documentType=projekt%20ustawy&limit=3"
try:
    resp = requests.get(url, timeout=10)
    data = resp.json()
    print(json.dumps(data[0:3], indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")
