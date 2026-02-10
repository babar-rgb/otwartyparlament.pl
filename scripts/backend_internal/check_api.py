import requests
import json

def check():
    print("Checking /MP list...")
    r = requests.get("https://api.sejm.gov.pl/sejm/term10/MP")
    if r.status_code == 200:
        data = r.json()
        print(f"List item keys: {data[0].keys()}")
        if 'educations' in data[0]:
            print("FOUND educations in list!")
        else:
            print("NOT FOUND educations in list.")
            
    print("\nChecking /MP/1 details...")
    # Find a valid ID first
    id = data[0]['id']
    r2 = requests.get(f"https://api.sejm.gov.pl/sejm/term10/MP/{id}")
    if r2.status_code == 200:
        d2 = r2.json()
        print(f"Detail keys: {d2.keys()}")
        if 'educations' in d2:
            print("FOUND educations in details!")
            print(f"Educations: {d2['educations']}")
        else:
             print("NOT FOUND educations in details.")

if __name__ == "__main__":
    check()
