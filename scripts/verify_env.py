import os
from dotenv import load_dotenv

print(f"CWD: {os.getcwd()}")
load_dotenv()
print("Load default:")
print(f"URL: {os.environ.get('VITE_SUPABASE_URL')}")

load_dotenv('.env')
print("Load explicit .env:")
print(f"URL: {os.environ.get('VITE_SUPABASE_URL')}")

load_dotenv('../.env')
print("Load parent .env:")
print(f"URL: {os.environ.get('VITE_SUPABASE_URL')}")
