
import requests

base = "https://api.sejm.gov.pl/sejm/term10/MP/68"
endpoints = [
    "assetDeclarations",
    "declarations", 
    "assets",
    "statements",
    "writtenStatements",
    "accomodationAllowance"
]

for e in endpoints:
    url = f"{base}/{e}"
    resp = requests.get(url)
    print(f"{e}: {resp.status_code}")
