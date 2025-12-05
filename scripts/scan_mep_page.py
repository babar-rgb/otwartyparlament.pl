import requests
import re
import sys

if len(sys.argv) < 2:
    print("Usage: python scan_mep_page.py <id>")
    exit(1)

mep_id = sys.argv[1]
url = f"https://www.europarl.europa.eu/meps/en/{mep_id}"
print(f"Scanning {url}...")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

r = requests.get(url, headers=headers)
if r.status_code != 200:
    print(f"Failed: {r.status_code}")
    exit(1)

# Regex to find img tags
imgs = re.findall(r'<img[^>]+src="([^">]+)"', r.text)
for img in imgs:
    if 'photo' in img or mep_id in img:
        print(f"Found candidate: {img}")
