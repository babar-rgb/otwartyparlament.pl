#!/usr/bin/env python3
"""
ULTRA-FAST Mass pre-generate embeddings for 100,000 search queries
Uses parallel embedding and larger batches.
"""

import sys
import os
import time
import random
import concurrent.futures
from typing import List, Set
import google.generativeai as genai
from sqlalchemy import text

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.core.orm_db import SessionLocal

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not set", flush=True)
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-001')

GEN_BATCH_SIZE = 1000 # Larger chunks
EMBED_BATCH_SIZE = 100 # API Max
PARALLEL_WORKERS = 50 # Extreme parallelism
TARGET_TOTAL = 910000 # TARGET: Add ~15k new queries

TOPICS = [
    # Politicians
    "nawrocki", "hołownia", "tusk", "kaczyński", "mentzen", "bosak", "czarzasty", "kosiniak-kamysz", "braun",
    "trzaskowski", "duda", "morawiecki", "sasin", "ziobro", "błaszczak", "czarnek", 
    
    # Economics / Daily Life
    "podatki", "vat", "cit", "pit", "zus", "inflacja", "ceny", "gospodarka",
    "zdrowie", "nfz", "szpitale", "lekarze", "leki", "pielęgniarki",
    "szkoła", "nauczyciele", "edukacja", "podręczniki", "studia",
    "klimat", "środowisko", "lasy", "woda", "oze", "atom", "węgiel", "prąd",
    "wojsko", "obrona", "nato", "bezpieczeństwo", "policja", "granica",
    "rolnictwo", "wieś", "dopłaty", "rolnicy", "produkty rolne",
    "drogi", "kolej", "autostrady", "lotniska", "mosty", "cpk",
    "technologia", "ai", "internet", "cyfryzacja", "cyberbezpieczeństwo",
    "rodzina", "800 plus", "dzieci", "mieszkanie", "kredyt", "deweloperzy",
    "kobiety", "prawa", "aborcja", "in vitro", "równość",
    "sądy", "krs", "prokuratura", "konstytucja", "prawo", "sprawiedliwość",
    "unia europejska", "fundusze", "kpo", "zagranica", "usa", "ukraina",
    "emerytury", "waloryzacja", "młodzież", "sport", "kultura", "kościół",
    "podatki lokalne", "śmieci", "woda", "lasy", "myśliwi", "zwierzęta",
    "paliwo", "benzyna", "gaz", "ciepło", "fotowoltaika", "pompy ciepła",
    "nauczyciele", "pensje", "podwyżki", "budżetówka", "urzędnicy",
    "policja", "wojsko", "zakupy zbrojeniowe", "czołgi", "f-35",
    "stocznie", "porty", "handel", "niedziele handlowe", "ceny żywności",
    "leki", "refundacja", "dentysta", "nfz", "kolejki do lekarza"
]

def generate_queries_mega_batch(count: int) -> List[str]:
    """Generate a large batch of queries using Gemini"""
    seeds = random.sample(TOPICS, 15)
    prompt = f"""Wygeneruj {count} unikalnych, krótkich (2-5 słów) zapytań po polsku dotyczących Sejmu i polityki. 
    Tematy przewodnie: {', '.join(seeds)}.
    Wymagania: 
    - Język potoczny i fachowy.
    - Tylko lista, jedno na linię.
    - Żadnych dodatkowych tekstów.
    """
    try:
        response = model.generate_content(prompt)
        return [q.strip() for q in response.text.split('\n') if q.strip()]
    except Exception as e:
        print(f"⚠️  Gen error: {e}", flush=True)
        return []

def embed_single_batch(queries_batch: List[str]):
    """Embed and return (query, embedding) pairs"""
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=queries_batch,
            task_type="retrieval_query"
        )
        return list(zip(queries_batch, result['embedding']))
    except Exception as e:
        print(f"⚠️  Embed error: {e}", flush=True)
        return []

def main():
    db = SessionLocal()
    
    current = db.execute(text("SELECT COUNT(*) FROM query_embeddings")).scalar()
    print(f"🚀 Starting from {current:,} / {TARGET_TOTAL:,}", flush=True)
    
    start_time = time.time()
    total_new = 0
    
    while current + total_new < TARGET_TOTAL:
        print(f"[{time.strftime('%H:%M:%S')}] Attempting to generate {GEN_BATCH_SIZE} queries...", flush=True)
        # 1. Generate queries in large chunks
        raw_queries = generate_queries_mega_batch(GEN_BATCH_SIZE)
        if not raw_queries:
            print("💤 No queries returned, retrying in 2s...", flush=True)
            time.sleep(2)
            continue
            
        print(f"📡 Generated {len(raw_queries)} queries. Embedding in parallel...", end="", flush=True)
        
        # 2. Split into embedding batches
        embed_batches = [raw_queries[i:i + EMBED_BATCH_SIZE] for i in range(0, len(raw_queries), EMBED_BATCH_SIZE)]
        
        # 3. Parallel embedding
        all_pairs = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=PARALLEL_WORKERS) as executor:
            futures = [executor.submit(embed_single_batch, b) for b in embed_batches]
            for f in concurrent.futures.as_completed(futures):
                all_pairs.extend(f.result())
        
        # 4. Save to DB
        saved = 0
        for q, emb in all_pairs:
            try:
                db.execute(text("""
                    INSERT INTO query_embeddings (query, embedding)
                    VALUES (:query, CAST(:embedding AS vector))
                    ON CONFLICT (query) DO NOTHING
                """), {"query": q.lower()[:2000], "embedding": str(emb)})
                saved += 1
            except:
                pass
        db.commit()
        
        total_new += saved
        elapsed = time.time() - start_time
        rate = total_new / (elapsed / 60) if elapsed > 0 else 0
        print(f"✅ Saved {saved}. Total: {current + total_new:,}. Rate: {rate:.1f}/min", flush=True)
        
        # Periodic sync to DB to keep count accurate
        if total_new % 1000 == 0:
            db.close()
            db = SessionLocal()

    db.close()
    print(f"🏁 DONE! Total saved: {total_new}", flush=True)

if __name__ == "__main__":
    main()
