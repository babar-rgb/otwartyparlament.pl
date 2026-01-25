import sys
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sentence_transformers import SentenceTransformer

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models import Vote
from backend.core.orm_db import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backfill_embeddings")

# Use a lightweight multilingual model
MODEL_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'

def backfill():
    session = SessionLocal()
    
    try:
        logger.info(f"💾 Loading model: {MODEL_NAME}...")
        model = SentenceTransformer(MODEL_NAME)
        
        # Fetch votes with missing embeddings
        votes = session.query(Vote).filter(Vote.vector_embedding == None).all()
        total = len(votes)
        logger.info(f"🚀 Vectorizing {total} votes...")
        
        batch_size = 100
        for i in range(0, total, batch_size):
            batch = votes[i:i+batch_size]
            
            # Prepare texts
            texts = [v.title_clean or v.title_raw or "" for v in batch]
            
            # Encode
            embeddings = model.encode(texts)
            
            # Save
            for vote, embedding in zip(batch, embeddings):
                vote.vector_embedding = embedding.tolist()
                
            session.commit()
            logger.info(f"✅ Processed {i + len(batch)}/{total}")
            
    except Exception as e:
        logger.error(f"❌ Error during backfill: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    backfill()
