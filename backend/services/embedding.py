from typing import List, Optional
import numpy as np
import threading
from backend.core.logger import get_logger

logger = get_logger("services.embedding")

class EmbeddingService:
    """
    Local Embedding Service for semantic analysis.
    Uses 'paraphrase-multilingual-MiniLM-L12-v2' (384-dimensional vectors).
    Implements lazy loading to save memory on server startup.
    """
    
    MODEL_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'
    
    def __init__(self):
        self._model = None
        self._enabled = True
        self._lock = threading.Lock()  # Thread safety for lazy loading
        logger.info("EmbeddingService initialized (model lazy-loading enabled)")

    def _load_model(self):
        """Internal method to load the model only when needed. Thread-safe."""
        if self._model is not None:
            return self._model
        
        with self._lock:
            # Double-check after acquiring lock (another thread might have loaded it)
            if self._model is not None:
                return self._model
                
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading embedding model: {self.MODEL_NAME}...")
                self._model = SentenceTransformer(self.MODEL_NAME)
                logger.info("Model loaded successfully.")
                return self._model
            except ImportError:
                logger.error("sentence-transformers not installed. Embedding features disabled.")
                self._enabled = False
                return None
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                self._enabled = False
                return None


    def get_embedding(self, text: str) -> Optional[List[float]]:
        """Generate a 384-dimensional vector for the given text."""
        if not text or not self._enabled:
            return None
            
        model = self._load_model()
        if model:
            try:
                # model.encode returns a numpy array
                embedding = model.encode(text)
                return embedding.tolist()
            except Exception as e:
                logger.error(f"Error generating embedding: {e}")
                return None
        return None

    def get_similarity(self, text1: str, text2: str) -> float:
        """Calculate cosine similarity between two texts."""
        if not text1 or not text2 or not self._enabled:
            return 0.0
            
        model = self._load_model()
        if model:
            try:
                emb1 = model.encode(text1)
                emb2 = model.encode(text2)
                
                # Cosine similarity using numpy
                dot_product = np.dot(emb1, emb2)
                norm1 = np.linalg.norm(emb1)
                norm2 = np.linalg.norm(emb2)
                
                if norm1 == 0 or norm2 == 0:
                    return 0.0
                    
                return float(dot_product / (norm1 * norm2))
            except Exception as e:
                logger.error(f"Error calculating similarity: {e}")
                return 0.0
        return 0.0

    @property
    def is_available(self) -> bool:
        """Check if the embedding service is functional."""
        return self._enabled

    def semantic_search(self, query: str, records: List, limit: int = 10) -> List:
        """
        Rank records by semantic similarity to the query.
        Each record in 'records' must have a 'vector_embedding' attribute.
        """
        if not query or not records or not self._enabled:
            return records[:limit]
            
        model = self._load_model()
        if not model:
            return records[:limit]
            
        try:
            query_emb = model.encode(query)
            
            scored_records = []
            for rec in records:
                # Support both objects and dicts
                rec_emb = getattr(rec, 'vector_embedding', None)
                if rec_emb is None and isinstance(rec, dict):
                    rec_emb = rec.get('vector_embedding')
                
                if not rec_emb:
                    continue
                    
                # Cosine similarity
                rec_emb_arr = np.array(rec_emb)
                dot_product = np.dot(query_emb, rec_emb_arr)
                norm_q = np.linalg.norm(query_emb)
                norm_r = np.linalg.norm(rec_emb_arr)
                
                similarity = float(dot_product / (norm_q * norm_r)) if (norm_q > 0 and norm_r > 0) else 0.0
                scored_records.append((similarity, rec))
            
            # Sort by similarity descending
            scored_records.sort(key=lambda x: x[0], reverse=True)
            
            # Return top N records with score injected if possible
            results = []
            for score, rec in scored_records[:limit]:
                if hasattr(rec, '__dict__'):
                   # We don't want to modify the DB object, but we can return it
                   # For dictionary-based serialization in routers, we can use the score later
                   pass
                results.append(rec)
            return results
            
        except Exception as e:
            logger.error(f"Error in semantic_search: {e}")
            return records[:limit]

    def find_similar(self, target_vector: List[float], records: List, limit: int = 5) -> List:
        """
        Find records most similar to a given target vector.
        Each record in 'records' must have a 'vector_embedding' attribute.
        """
        if not target_vector or not records or not self._enabled:
            return records[:limit]
            
        try:
            target_arr = np.array(target_vector)
            
            scored_records = []
            for rec in records:
                rec_emb = getattr(rec, 'vector_embedding', None)
                if rec_emb is None and isinstance(rec, dict):
                    rec_emb = rec.get('vector_embedding')
                
                if not rec_emb:
                    continue
                    
                rec_emb_arr = np.array(rec_emb)
                dot_product = np.dot(target_arr, rec_emb_arr)
                norm_t = np.linalg.norm(target_arr)
                norm_r = np.linalg.norm(rec_emb_arr)
                
                similarity = float(dot_product / (norm_t * norm_r)) if (norm_t > 0 and norm_r > 0) else 0.0
                scored_records.append((similarity, rec))
            
            scored_records.sort(key=lambda x: x[0], reverse=True)
            return [rec for score, rec in scored_records[:limit]]
            
        except Exception as e:
            logger.error(f"Error in find_similar: {e}")
            return records[:limit]

# Singleton instance for the application
embedding_service = EmbeddingService()
