import sys
import os
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from backend.core.orm_db import SessionLocal
from backend.models import Vote
from backend.services.embedding import embedding_service
from backend.core.logger import get_logger

logger = get_logger("etl.embed_votes")

def grinder(batch_size: int = 50):
    """
    Semantic Data Grinder: Fetches votes without embeddings and processes them.
    """
    db = SessionLocal()
    try:
        # 1. Fetch votes without embeddings
        votes_to_process = db.query(Vote).filter(Vote.vector_embedding == None).limit(batch_size).all()
        
        if not votes_to_process:
            logger.info("No votes left to process for embeddings.")
            return False

        logger.info(f"Grinding {len(votes_to_process)} votes semantically...")
        
        for vote in votes_to_process:
            # Prepare content for embedding
            content = f"{vote.title_clean or vote.name_citizen or ''}. {vote.description or ''}"
            
            if len(content.strip()) < 5:
                # Fallback if no content
                vote.vector_embedding = [] # Mark as processed with empty
                continue
                
            # Generate embedding
            embedding = embedding_service.get_embedding(content)
            
            if embedding:
                vote.vector_embedding = embedding
                logger.info(f"  ✓ Processed Vote {vote.id}")
            else:
                logger.error(f"  ✗ Failed to embed Vote {vote.id}")
        
        db.commit()
        logger.info(f"Batch complete. Saved {len(votes_to_process)} embeddings.")
        return True
        
    except Exception as e:
        logger.error(f"Grinder error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("Starting Semantic Grinder (Manual Mode)")
    
    # Process several batches
    while grinder(batch_size=50):
        # We can stop after a few batches for now to give control back
        # or just let it run if the user wants "background"
        pass
    
    logger.info("Grinding finished.")
