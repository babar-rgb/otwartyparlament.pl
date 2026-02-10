import requests
import json

def check_process_authors():
    # Get a few processes
    url = "https://api.sejm.gov.pl/sejm/term10/processes?limit=5"
    print(f"Fetching {url}...")
    resp = requests.get(url)
    data = resp.json()
    
    for p in data:
        print(f"\n--- Process {p.get('number')} ---")
        # Check specific fields for authors
        # Sejm API usually puts prints in 'prints' list, and authors might be in 'prints' details
        print(f"Keys: {p.keys()}")
        
        # Check prints if available
        if p.get('prints'):
            print_num = p['prints'][0]
            if isinstance(print_num, dict): print_num = print_num['number']
            
            print(f"Checking Print {print_num}...")
            p_url = f"https://api.sejm.gov.pl/sejm/term10/prints/{print_num}"
            p_resp = requests.get(p_url)
            if p_resp.status_code == 200:
                p_data = p_resp.json()
                print(f"Print Keys: {p_data.keys()}")
                if 'authors' in p_data:
                    print(f"✅ Authors Found in Print: {p_data['authors']}")
                else:
                    print("❌ No 'authors' field in Print.")

if __name__ == "__main__":
    check_process_authors()
