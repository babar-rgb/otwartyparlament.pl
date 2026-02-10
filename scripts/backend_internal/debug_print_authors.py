import requests
import json

def check_print_authors():
    # Fetch list of latest prints
    print("Fetching list of latest prints (50)...")
    resp = requests.get("https://api.sejm.gov.pl/sejm/term10/prints?limit=50")
    prints_list = resp.json()
    
    found = False
    for p in prints_list:
        p_num = p['number']
        # print(f"Checking Print {p_num}...")
        resp_detail = requests.get(f"https://api.sejm.gov.pl/sejm/term10/prints/{p_num}")
        print_detail = resp_detail.json()
        
        if 'authorIDs' in print_detail:
            print(f"✅ Found 'authorIDs' in Print {p_num}: {print_detail['authorIDs']}")
            found = True
            break
        elif 'authors' in print_detail:
            print(f"✅ Found 'authors' in Print {p_num}: {print_detail['authors']}")
            found = True
            break
    
    if not found:
        print("❌ scanned 50 prints, NO author info found.")

if __name__ == "__main__":
    check_print_authors()
