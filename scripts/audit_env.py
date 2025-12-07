import os
from dotenv import load_dotenv

# Load .env first, then .env.local to mimic precedence if needed, 
# but usually libraries load one. Let's try to load .env explicitly.
load_dotenv('.env')

print("--- AUDIT_ENV START ---")
print(f"DATABASE_URL detected: {os.getenv('DATABASE_URL', 'Not Set')}")
print(f"DB_HOST detected: {os.getenv('DB_HOST', 'Not Set')}")
print(f"SUPABASE_URL detected: {os.getenv('SUPABASE_URL', 'Not Set')}")
print(f"VITE_SUPABASE_URL detected: {os.getenv('VITE_SUPABASE_URL', 'Not Set')}")
print("--- AUDIT_ENV END ---")
