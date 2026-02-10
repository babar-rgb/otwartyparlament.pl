#!/usr/bin/env python3
"""
Generate embeddings for semantic search using Gemini API
Processes votes, bills, and interpellations in batches
"""

import sys
import os
import time
from typing import List, Dict
import google.generativeai as genai
from sqlalchemy import text

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.core.orm_db import SessionLocal

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("⚠️ GEMINI_API_KEY not set. Embeddings generation will be skipped.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

BATCH_SIZE = 100
RATE_LIMIT_DELAY = 1.0


def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a batch of texts"""
    if not GEMINI_API_KEY:
        return []

    try:
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=texts,
            task_type="retrieval_document",
            output_dimensionality=768
        )
        return result['embedding']
    except Exception as e:
        print(f"⚠️  Error generating embeddings: {e}")
        return []


def process_votes(db, limit: int = None):
    """Generate embeddings for votes"""
    
    # Get votes without embeddings
    query = """
        SELECT id, title_clean, description
        FROM votes
        WHERE vector_embedding IS NULL
        ORDER BY id DESC
    """
    if limit:
        query += f" LIMIT {limit}"
    
    votes = db.execute(text(query)).fetchall()
    
    print(f"\n📊 Processing {len(votes)} votes...")
    
    total_processed = 0
    
    for i in range(0, len(votes), BATCH_SIZE):
        batch = votes[i:i+BATCH_SIZE]
        
        # Create text representations
        text_list = []
        for vote in batch:
            # Combine title and description for better context
            text_content = f"{vote[1] or ''} {vote[2] or ''}".strip()
            if not text_content:
                text_content = "Brak opisu"
            text_list.append(text_content)
        
        print(f"Batch {i//BATCH_SIZE + 1}/{(len(votes)-1)//BATCH_SIZE + 1}...", end=" ")
        
        # Generate embeddings
        embeddings = generate_embeddings_batch(text_list)
        
        if not embeddings:
            print("❌ Failed")
            continue
        
        # Update database
        for j, vote in enumerate(batch):
            if j < len(embeddings):
                embedding_str = str(embeddings[j])
                db.execute(text("""
                    UPDATE votes 
                    SET vector_embedding = CAST(:embedding AS vector)
                    WHERE id = :id
                """), {"embedding": embedding_str, "id": vote[0]})
        
        db.commit()
        total_processed += len(batch)
        print(f"✅ {total_processed}/{len(votes)}")
        
        # Rate limiting
        if i + BATCH_SIZE < len(votes):
            time.sleep(RATE_LIMIT_DELAY)
    
    return total_processed
    
def process_bills(db, limit: int = None):
    """Generate embeddings for bills"""
    query = """
        SELECT id, title, description
        FROM bills
        WHERE vector_embedding IS NULL
        ORDER BY id DESC
    """
    if limit:
        query += f" LIMIT {limit}"
    
    bills = db.execute(text(query)).fetchall()
    print(f"\n📄 Processing {len(bills)} bills...")
    
    total_processed = 0
    for i in range(0, len(bills), BATCH_SIZE):
        batch = bills[i:i+BATCH_SIZE]
        text_list = [f"{b[1] or ''} {b[2] or ''}".strip() or "Brak opisu" for b in batch]
        
        print(f"Batch {i//BATCH_SIZE + 1}/{(len(bills)-1)//BATCH_SIZE + 1}...", end=" ")
        embeddings = generate_embeddings_batch(text_list)
        
        if not embeddings:
            print("❌ Failed")
            continue
            
        for j, bill in enumerate(batch):
            if j < len(embeddings):
                db.execute(text("""
                    UPDATE bills 
                    SET vector_embedding = CAST(:embedding AS vector)
                    WHERE id = :id
                """), {"embedding": str(embeddings[j]), "id": bill[0]})
        
        db.commit()
        total_processed += len(batch)
        print(f"✅ {total_processed}/{len(bills)}")
        if i + BATCH_SIZE < len(bills): time.sleep(RATE_LIMIT_DELAY)
    
    return total_processed


def process_interpellations(db, limit: int = None):
    """Generate embeddings for interpellations"""
    query = """
        SELECT id, title, content
        FROM interpellations
        WHERE vector_embedding IS NULL
        ORDER BY id DESC
    """
    if limit:
        query += f" LIMIT {limit}"
    
    items = db.execute(text(query)).fetchall()
    print(f"\n📧 Processing {len(items)} interpellations...")
    
    total_processed = 0
    for i in range(0, len(items), BATCH_SIZE):
        batch = items[i:i+BATCH_SIZE]
        text_list = [f"{it[1] or ''} {it[2][:2000] if it[2] else ''}".strip() or "Brak treści" for it in batch]
        
        print(f"Batch {i//BATCH_SIZE + 1}/{(len(items)-1)//BATCH_SIZE + 1}...", end=" ")
        embeddings = generate_embeddings_batch(text_list)
        
        if not embeddings:
            print("❌ Failed")
            continue
            
        for j, it in enumerate(batch):
            if j < len(embeddings):
                db.execute(text("""
                    UPDATE interpellations 
                    SET vector_embedding = CAST(:embedding AS vector)
                    WHERE id = :id
                """), {"embedding": str(embeddings[j]), "id": it[0]})
        
        db.commit()
        total_processed += len(batch)
        print(f"✅ {total_processed}/{len(items)}")
        if i + BATCH_SIZE < len(items): time.sleep(RATE_LIMIT_DELAY)
    
    return total_processed


def estimate_cost(db):
    """Estimate how many items need embeddings"""
    v = db.execute(text("SELECT count(*) FROM votes WHERE vector_embedding IS NULL")).scalar()
    b = db.execute(text("SELECT count(*) FROM bills WHERE vector_embedding IS NULL")).scalar()
    i = db.execute(text("SELECT count(*) FROM interpellations WHERE vector_embedding IS NULL")).scalar()
    print(f"\n💰 Items to process: {v} votes, {b} bills, {i} interpellations (Total: {v+b+i})")
    print(f"Estimated time: {(v+b+i)/BATCH_SIZE * RATE_LIMIT_DELAY / 60:.1f} minutes")


class VectorSyncETL:
    def __init__(self, db_session=None):
        self.db = db_session if db_session else SessionLocal()

    def run(self, limit: int = None):
        """Run embedding generation for all types without interaction."""
        print("\n🚀 Starting automated vector sync...")
        v = process_votes(self.db, limit)
        b = process_bills(self.db, limit)
        i = process_interpellations(self.db, limit)
        total = v + b + i
        print(f"✅ Vector sync complete. Processed {total} items.")
        return total

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Generate embeddings for semantic search')
    parser.add_argument('--limit', type=int, help='Limit number of items to process (for testing)')
    parser.add_argument('--non-interactive', action='store_true', help='Skip confirmation prompt')
    parser.add_argument('--votes-only', action='store_true', help='Process only votes')
    parser.add_argument('--bills-only', action='store_true', help='Process only bills')
    parser.add_argument('--interpellations-only', action='store_true', help='Process only interpellations')
    args = parser.parse_args()
    
    db = SessionLocal()
    estimate_cost(db)
    
    if not args.non_interactive:
        proceed = input("\nProceed? (y/n): ")
        if proceed.lower() != 'y':
            print("Cancelled.")
            return
    
    # Process based on flags
    total_processed = 0
    start_time = time.time()
    
    # If no specific flag is set, process ALL
    process_all = not (args.votes_only or args.bills_only or args.interpellations_only)
    
    if args.votes_only or process_all:
        total_processed += process_votes(db, args.limit)
    
    if args.bills_only or process_all:
        total_processed += process_bills(db, args.limit)
    
    if args.interpellations_only or process_all:
        total_processed += process_interpellations(db, args.limit)
    
    elapsed = time.time() - start_time
    
    print("\n" + "="*60)
    print(f"  ✅ COMPLETE!")
    print("="*60)
    print(f"Total processed: {total_processed:,}")
    print(f"Time elapsed: {elapsed/60:.1f} minutes")
    if elapsed > 0:
        print(f"Items/second: {total_processed/elapsed:.1f}")
    print("="*60)
    
    db.close()


if __name__ == "__main__":
    main()
