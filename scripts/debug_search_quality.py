from sqlalchemy import text
from backend.core.orm_db import SessionLocal
from backend import models
import google.generativeai as genai
import os
import numpy as np
from dotenv import load_dotenv

load_dotenv()

THRESHOLD = 0.65

def get_cosine_distance(vec1, vec2):
    if vec1 is None or vec2 is None:
        return 1.0
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    dot = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    similarity = dot / (norm1 * norm2)
    return 1 - similarity

def check_scenario(query_text, expect_found_id=None, expect_type='vote'):
    db = SessionLocal()
    api_key = os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=api_key)

    print(f"\n🧪 SCENARIO: Query '{query_text}' expecting {expect_type} ID {expect_found_id}")
    
    try:
        # Generate query embedding
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=query_text,
            task_type="retrieval_query"
        )
        query_vec = result['embedding']
        
        # 2. Search with Threshold
        distance_col = getattr(models, expect_type.capitalize()).vector_embedding.cosine_distance(query_vec).label("distance")
        
        ModelClass = getattr(models, expect_type.capitalize())
        
        results = db.query(ModelClass, distance_col)\
            .filter(ModelClass.vector_embedding.isnot(None))\
            .order_by(distance_col)\
            .limit(20)\
            .all()
            
        found = False
        ranking = 0
        
        print(f"   Top 5 Results (Threshold {THRESHOLD}):")
        for i, (item, dist) in enumerate(results):
            status = "✅ PASS" if dist <= THRESHOLD else "❌ FILTERED"
            title = getattr(item, 'title_clean', None) or getattr(item, 'title', 'No Title')
            
            if i < 5:
                print(f"   {i+1}. [{dist:.4f}] [{status}] {title[:60]}...")
            
            if str(item.id) == str(expect_found_id):
                found = True
                ranking = i + 1
                print(f"   🎯 TARGET FOUND at rank {ranking} with dist {dist:.4f}")
                if dist > THRESHOLD:
                     print(f"   ⚠️  Target would be FILTERED by logic!")
                else:
                     print(f"   🎉 Target is VISIBLE to user.")
                break
        
        if not found:
             print(f"   ❌ Target {expect_found_id} NOT found in top 20.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # 1. Abortion Vote (should be found for 'ciąża')
    check_scenario("ciąża", expect_found_id=90300007, expect_type='vote')
    
    # 2. In Vitro Bill (should be found for 'in vitro')
    check_scenario("in vitro", expect_found_id=4226, expect_type='bill')
    
    # 3. Credit / "mieszkania"
    # check_scenario("kredyt 0%", expect_found_id=..., expect_type='bill') 
