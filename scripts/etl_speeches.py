import asyncio
import aiohttp
import os
import time
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Config
SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_URL = "https://api.sejm.gov.pl/sejm"
TARGET_TERMS = [9, 10]
CONCURRENCY_LIMIT = 5 # Moderate concurrency to respect Sejm API
UPSERT_BATCH_SIZE = 100

if not SUPABASE_KEY:
    print("Error: SUPABASE_KEY not found.")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Cache
mp_cache = {} # "First Last": id

def load_mp_cache():
    print("Loading MP Cache from DB...")
    # Fetch all MPs
    # We might need pagination if > 1000, but PostgREST default limit logic applies.
    # We'll assume we have < 1000 MPs active per term, but total MPs in DB might be > 1000 ?
    # Let's simple fetch default max (1000) or pages.
    # Actually PostgREST default max is often 1000.
    
    rows = []
    try:
        data = supabase.table('mps').select('id, name').execute()
        rows = data.data
        # If rows == 1000, we warn ?
        if len(rows) == 1000:
            print("WARNING: MP Cache hit 1000 limit. Some MPs might be missing.")
    except Exception as e:
        print(f"Error loading MPs: {e}")
        return

    for r in rows:
        mp_cache[r['name']] = r['id']
    print(f"Cached {len(mp_cache)} MPs.")

def get_mp_id(name):
    # Try exact match
    if name in mp_cache:
        return mp_cache[name]
    # Try reversed? "Last First" vs "First Last" - usually Sejm API is consistent with 'name'
    return None

async def fetch_json(session, url, retries=3):
    for attempt in range(retries):
        try:
            async with session.get(url, timeout=30) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 429:
                    wait = 2 ** attempt
                    print(f"  [429] Rate limited on {url}. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                elif response.status >= 500:
                    wait = 2 ** attempt
                    print(f"  [{response.status}] Server error on {url}. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    # 404 or other
                    return None
        except Exception as e:
            print(f"  Exception fetching {url}: {e}")
            await asyncio.sleep(1)
    return None

async def process_transcript(session, term, sitting_num, date_str):
    url = f"{API_URL}/term{term}/proceedings/{sitting_num}/{date_str}/transcripts"
    data = await fetch_json(session, url)
    
    if not data:
        return []

    statements = data.get('statements', [])
    records = []
    
    for stmt in statements:
        speaker_name = stmt.get('name')
        if not speaker_name:
            continue # Skip meta comments like "Marszałek..." if no name or just title? 
                     # Actually Marszałek has name usually.
                     # If name is missing it's system text.

        mp_id = get_mp_id(speaker_name)
        # If mp_id is None, we still store it but with null mp_id (as requested: "Minister niebędący posłem")

        content = stmt.get('text', '')
        # Basic cleaning if needed
        # content = content.replace("<br>", "\n") 
        
        record = {
            "term": term,
            "sitting": sitting_num,
            "date": date_str,
            "statement_num": stmt.get('num'),
            "mp_id": mp_id,
            "speaker_name": speaker_name,
            "content": content,
            # "topic": ? API inside transcripts usually doesn't have topic per statement easily.
            # We would need to parse headers in the stream.
            # For now, topic is left null or "Debata"
            "topic": "Debata" 
        }
        records.append(record)
    
    return records

async def worker(term, session, queue, progress_stats):
    while True:
        item = await queue.get()
        if item is None:
            break
            
        sitting_num, date_str = item
        
        # Process
        records = await process_transcript(session, term, sitting_num, date_str)
        
        # Upsert if any
        if records:
            # Batch upsert to DB logic (sync or async if library supports it, supabase-py is sync usually)
            # We can offload to thread or just do it.
            # To avoid database lock contention with many workers, simple retry loop
            try:
                # Chunking 
                for i in range(0, len(records), UPSERT_BATCH_SIZE):
                    chunk = records[i:i+UPSERT_BATCH_SIZE]
                    supabase.table('speeches').upsert(chunk, on_conflict='mp_id,sitting,date,statement_num').execute()
            except Exception as e:
                print(f"Error upserting chunk for {sitting_num}/{date_str}: {e}")

        progress_stats['processed'] += 1
        progress_stats['statements'] += len(records)
        queue.task_done()
        
        # Simple progress log
        if progress_stats['processed'] % 10 == 0:
            print(f"Term {term}: Processed {progress_stats['processed']} dates. Statements: {progress_stats['statements']}")


async def process_term(term):
    print(f"\n=== Starting Heavy Load for Term {term} Speeches ===")
    
    # 1. Fetch Sittings
    async with aiohttp.ClientSession() as session:
        url = f"{API_URL}/term{term}/proceedings"
        sittings = await fetch_json(session, url)
        if not sittings:
            print(f"No sittings found for Term {term}")
            return

        # Prepare Queue
        queue = asyncio.Queue()
        total_dates = 0
        
        for s in sittings:
            s_num = s.get('number')
            for d in s.get('dates', []):
                queue.put_nowait((s_num, d))
                total_dates += 1
        
        print(f"Term {term}: Found {len(sittings)} sittings with {total_dates} daily transcripts.")
        
        # Start Workers
        stats = {'processed': 0, 'statements': 0}
        workers = []
        for _ in range(CONCURRENCY_LIMIT):
            w = asyncio.create_task(worker(term, session, queue, stats))
            workers.append(w)
            
        # Wait for queue
        await queue.join()
        
        # Stop workers
        for _ in range(CONCURRENCY_LIMIT):
            await queue.put(None)
        await asyncio.gather(*workers)
        
        print(f"=== Term {term} Finished. Total Statements: {stats['statements']} ===")

async def main():
    load_mp_cache()
    # Execute terms sequentially or parallel?
    # Parallel might overload Sejm API or Local DB connections.
    # Sequential is safer for "Heavy Load".
    for term in TARGET_TERMS:
        await process_term(term)

if __name__ == "__main__":
    asyncio.run(main())
