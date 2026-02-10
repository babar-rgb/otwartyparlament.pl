import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

print("Attempting to import backend.models...")
try:
    from backend import models
    print("SUCCESS: backend.models imported.")
except Exception as e:
    print(f"FAILURE importing backend.models: {e}")
    sys.exit(1)

print("Attempting to import backend.main...")
try:
    from backend import main
    print("SUCCESS: backend.main imported.")
except Exception as e:
    print(f"FAILURE importing backend.main: {e}")
    sys.exit(1)

print("Attempting to initialize DB session...")
try:
    from backend.core.orm_db import SessionLocal
    db = SessionLocal()
    print("SUCCESS: DB Session created.")
    
    # Try a simple query
    print("Test Query: Checking pgvector extension...")
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        print("SUCCESS: Simple query executed.")
        
        # Test Vector Query
        print("Test Query: Vector cosine distance...")
        from backend import models
        # Create a dummy vector of 384 zeros
        dummy_vec = [0.0] * 384
        try:
            # We must use proper session query
            res = db.query(models.Vote).filter(models.Vote.vector_embedding != None)\
                .order_by(models.Vote.vector_embedding.cosine_distance(dummy_vec))\
                .limit(1).first()
            print(f"SUCCESS: Vector query executed. Result ID: {res.id if res else 'None'}")
        except Exception as e:
            print(f"FAILURE: Vector query failed: {e}")
            raise e

    except Exception as e:
        print(f"FAILURE: Query failed: {e}")
        
except Exception as e:
    print(f"FAILURE initializing DB: {e}")
    sys.exit(1)
