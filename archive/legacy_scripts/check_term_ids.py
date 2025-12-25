import requests

def get_mp_name(term, mp_id):
    url = f"https://api.sejm.gov.pl/sejm/term{term}/MP/{mp_id}"
    try:
        r = requests.get(url)
        if r.status_code == 200:
            return r.json()['firstLastName']
    except:
        pass
    return None

name9 = get_mp_name(9, "001")
name10 = get_mp_name(10, "001")

print(f"Term 9 MP 001: {name9}")
print(f"Term 10 MP 001: {name10}")

if name9 != name10:
    print("IDs are reused! We need composite keys (term + id).")
else:
    print("IDs might be stable, but safer to assume reuse.")
