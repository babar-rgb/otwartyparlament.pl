import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from backend.services.embedding import embedding_service

def test_embeddings():
    print("--- Embedding Service Verification ---")
    
    # Check availability
    print(f"Service Available: {embedding_service.is_available}")
    
    # Test texts
    text_a = "Podatki i finanse publiczne"
    text_b = "Budżet państwa oraz podatki"
    text_c = "Hodowla zwierząt i uprawa roli"
    
    print("\n[1] Testing Embedding Generation...")
    emb = embedding_service.get_embedding(text_a)
    if emb:
        print(f"✅ Embedding generated. Dimension: {len(emb)}")
    else:
        print("❌ Failed to generate embedding.")
        return

    print("\n[2] Testing Semantic Similarity...")
    sim_ab = embedding_service.get_similarity(text_a, text_b)
    sim_ac = embedding_service.get_similarity(text_a, text_c)
    
    print(f"Similarity ('{text_a}' vs '{text_b}'): {sim_ab:.4f}")
    print(f"Similarity ('{text_a}' vs '{text_c}'): {sim_ac:.4f}")
    
    if sim_ab > sim_ac:
        print("\n✅ Logic Check Passed: Finance is more similar to Finance than to Agriculture.")
    else:
        print("\n❌ Logic Check Failed: Similarity hierarchy is incorrect.")

if __name__ == "__main__":
    test_embeddings()
