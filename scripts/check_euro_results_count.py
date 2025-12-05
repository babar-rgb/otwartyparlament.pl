import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

response = supabase.table('euro_votes').select('*', count='exact', head=True).execute()
print(f"Euro Votes (Metadata): {response.count}")

response_res = supabase.table('euro_vote_results').select('*', count='exact', head=True).execute()
print(f"Euro Vote Results (Individual Votes): {response_res.count}")
