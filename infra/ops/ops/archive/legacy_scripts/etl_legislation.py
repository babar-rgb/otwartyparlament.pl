import asyncio
import aiohttp
import os
import time
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_URL = "https://api.sejm.gov.pl/sejm"
TARGET_TERMS = [9, 10]
BATCH_SIZE = 100

if not SUPABASE_KEY:
    print("Error: SUPABASE_KEY not found in environment.")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

async def fetch_processes_batch(session, term, offset, limit):
    url = f"{API_URL}/term{term}/processes?limit={limit}&offset={offset}"
    try:
        async with session.get(url) as response:
            if response.status == 200:
                return await response.json()
            elif response.status == 429:
                print(f"Rate limited (429). Waiting...")
                await asyncio.sleep(2)
                return await fetch_processes_batch(session, term, offset, limit)
            else:
                print(f"Error {response.status} fetching term {term} offset {offset}")
                return []
    except Exception as e:
        print(f"Exception fetching {url}: {e}")
        return []

async def process_term(term):
    print(f"\n--- Starting ETL for Term {term} Legislation ---")
    
    # 1. Get Total Count first (optional, or just iterate until empty)
    # We'll just iterate
    offset = 0
    total_inserted = 0
    
    async with aiohttp.ClientSession() as session:
        while True:
            batch = await fetch_processes_batch(session, term, offset, BATCH_SIZE)
            if not batch:
                break
            
            upsert_data = []
            for item in batch:
                print_num = item.get("number")
                if not print_num:
                    continue  # We use print_num as ID mostly
                
                # User requested: id, title, description, status, date, print_number
                # Mapping:
                # id -> print_number (or documentId if available, but print_number is used in app)
                # status -> ? item doesn't always have status simple string. we use UE/finished etc.
                # We'll map what we have.
                
                record = {
                    "id": print_num,  # Keeping existing logic: ID = Print Number (int/str)
                    "term": term,
                    "title": item.get("title"),
                    "description": item.get("description", ""),
                    "print_number": str(print_num),
                    "process_start_date": item.get("processStartDate"),
                    "change_date": item.get("changeDate"),
                    "ue": item.get("UE") == 'YES',
                    # "status": "processing" # We don't have accurate status in list view usually
                }
                upsert_data.append(record)
            
            if upsert_data:
                try:
                    # Sync call to supabase inside async loop (it's fast enough locally)
                    result = supabase.table('processes').upsert(upsert_data).execute()
                    total_inserted += len(upsert_data)
                    print(f"Term {term}: Inserted {len(upsert_data)} items (Offset {offset}). Total: {total_inserted}")
                except Exception as e:
                    print(f"Error upserting batch: {e}")
            
            offset += BATCH_SIZE
            # Safety break
            if len(batch) < BATCH_SIZE:
                break
                
    print(f"--- Term {term} Complete. Total: {total_inserted} ---")

async def main():
    tasks = [process_term(t) for t in TARGET_TERMS]
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
