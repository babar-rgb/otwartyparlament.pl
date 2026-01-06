import sys
import os
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from backend.core.orm_db import SessionLocal
from backend.models import Vote, Bill, EuroVote
from backend.services.embedding import embedding_service
from backend.core.logger import get_logger

logger = get_logger("etl.embed_data")

def grind_table(db: Session, model_class, content_fields: list, id_field="id", batch_size: int = 100):
    """
    Grinds a specific table for embeddings.
    """
    # Find records with NULL embedding
    records = db.query(model_class).filter(model_class.vector_embedding == None).limit(batch_size).all()
    
    if not records:
        return 0

    logger.info(f"Grinding {len(records)} records for {model_class.__tablename__}...")
    
    for rec in records:
        # Build content from multiple fields
        text_parts = [str(getattr(rec, field) or "") for field in content_fields]
        content = ". ".join([p for p in text_parts if p.strip()])
        
        if len(content.strip()) < 5:
            rec.vector_embedding = [] # Mark as processed
            continue
            
        embedding = embedding_service.get_embedding(content)
        if embedding:
            rec.vector_embedding = embedding
        else:
            logger.error(f"  ✗ Failed to embed {model_class.__tablename__} ID {getattr(rec, id_field)}")
            
    db.commit()
    return len(records)

def main():
    db = SessionLocal()
    try:
        # 1. Votes
        logger.info("--- Grinding Votes ---")
        while grind_table(db, Vote, ["title_clean", "description"], batch_size=200) > 0:
            pass
            
        # 2. Bills
        logger.info("--- Grinding Bills ---")
        while grind_table(db, Bill, ["title", "description"], batch_size=200) > 0:
            pass
            
        # 3. Euro Votes
        logger.info("--- Grinding Euro Votes ---")
        while grind_table(db, EuroVote, ["title", "description"], batch_size=200) > 0:
            pass
            
        logger.info("All tables processed successfully.")
        
    except Exception as e:
        logger.error(f"Grinder main error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
