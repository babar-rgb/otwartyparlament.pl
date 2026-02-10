import os
from supabase import create_client, Client

# Manually load .env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
except Exception:
    pass

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

def verify_data():
    print("Verifying Interpellations Data...")
    
    # Check count
    count = supabase.table('interpellations').select('*', count='exact', head=True).execute()
    print(f"Total Interpellations: {count.count}")
    
    # Check authors link
    # Get an MP who has interpellations
    data = supabase.table('interpellation_authors').select('mp_id, interpellations(title)').limit(1).execute()
    
    if data.data:
        print("Sample Link Found:")
        print(data.data[0])
    else:
        print("No links found yet.")

if __name__ == "__main__":
    verify_data()
