from sqlalchemy import text
from backend.core.orm_db import SessionLocal
from backend.services.embedding import embedding_service
from backend import models

def debug_search(query_text="Praca"):
    db = SessionLocal()
    try:
        print(f"Generating embedding for: '{query_text}'...")
        query_vec = embedding_service.get_embedding(query_text)
        
        print("Running SQL Vector Search...")
        # Get top 5 results with distance
        # Note: We need to explicitly select the distance to print it
        distance_col = models.Vote.vector_embedding.cosine_distance(query_vec).label("distance")
        
        results = db.query(models.Vote, distance_col)\
            .filter(models.Vote.vector_embedding != None)\
            .order_by(distance_col)\
            .limit(10)\
            .all()
            
        print(f"\nTop 10 Results for '{query_text}':")
        for i, (vote, dist) in enumerate(results):
            print(f"{i+1}. [Dist: {dist:.4f}] {vote.title_clean} (ID: {vote.id})")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_search("Praca")
