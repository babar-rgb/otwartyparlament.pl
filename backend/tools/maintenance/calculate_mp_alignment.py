import sys
import numpy as np
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import func

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from backend.core.orm_db import SessionLocal
from backend.models import Vote, VoteResult, MP, MPRelation

def calculate_alignment():
    db = SessionLocal()
    try:
        print("Fetching data...")
        # 1. Get current term (assuming max term is current)
        current_term = db.query(func.max(MP.term)).scalar() or 10
        print(f"Analyzing Term: {current_term}")

        # 2. Get MPs
        mps = db.query(MP).filter(MP.term == current_term, MP.active == True).all()
        mp_id_map = {mp.id: i for i, mp in enumerate(mps)}
        mp_ids = [mp.id for mp in mps]
        n_mps = len(mps)
        
        if n_mps < 2:
            print("Not enough MPs to calculate alignment.")
            return

        # 3. Get Votes (only key votes or all votes? All votes for better data)
        # Filter votes that belong to this term
        votes = db.query(Vote).filter(Vote.term == current_term).all()
        vote_id_map = {vote.id: i for i, vote in enumerate(votes)}
        n_votes = len(votes)
        
        print(f"MPs: {n_mps}, Votes: {n_votes}")
        
        if n_votes == 0:
            print("No votes found.")
            return

        # 4. Build Matrix
        # Rows: MPs, Cols: Votes
        # Values: 1 (Za), -1 (Przeciw), 0 (Others)
        matrix = np.zeros((n_mps, n_votes), dtype=np.float32)

        # Bulk fetch results is faster
        results = db.query(VoteResult).join(Vote).filter(Vote.term == current_term).all()
        
        print(f"Processing {len(results)} vote results...")
        for res in results:
            if res.mp_id in mp_id_map and res.vote_id in vote_id_map:
                row = mp_id_map[res.mp_id]
                col = vote_id_map[res.vote_id]
                
                if res.result == "Za":
                    matrix[row, col] = 1.0
                elif res.result == "Przeciw":
                    matrix[row, col] = -1.0
                # Wstrzymał/Nieobecny stays 0

        # 5. Normalize vectors (for Cosine Similarity)
        # Norm = sqrt(sum(x^2))
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        # Avoid division by zero
        norms[norms == 0] = 1.0
        normalized_matrix = matrix / norms

        # 6. Compute Similarity Matrix (Dot Product)
        # shape: (n_mps, n_mps)
        similarity_matrix = np.dot(normalized_matrix, normalized_matrix.T)

        print("Calculated similarity matrix. Saving relations...")
        
        # 7. Extract Top 1 Twin (excluding self)
        # Clear old relations for this type?
        db.query(MPRelation).filter(MPRelation.relation_type == "ideological_twin").delete()
        db.query(MPRelation).filter(MPRelation.relation_type == "opponent").delete()
        db.query(MPRelation).filter(MPRelation.relation_type == "opposition_twin").delete()
        
        relations_to_add = []
        
        for i in range(n_mps):
            mp_a_id = mp_ids[i]
            
            # 1. General Ideological Twin (Best match overall)
            scores = similarity_matrix[i].copy()
            scores[i] = -2.0 # exclude self
            
            best_idx = np.argmax(scores)
            best_score = scores[best_idx]
            
            relations_to_add.append(MPRelation(
                mp_id_a=mp_a_id,
                mp_id_b=mp_ids[best_idx],
                similarity_score=float(best_score),
                relation_type="ideological_twin"
            ))

            # 2. Opposition Twin (Best match from different club)
            my_club = mps[i].club
            opp_scores = similarity_matrix[i].copy()
            
            for j in range(n_mps):
                if mps[j].club == my_club:
                    opp_scores[j] = -999.0 # Exclude same club
            
            opp_best_idx = np.argmax(opp_scores)
            opp_best_score = opp_scores[opp_best_idx]
            
            if opp_best_score > -2.0: # Check if valid
                 relations_to_add.append(MPRelation(
                    mp_id_a=mp_a_id,
                    mp_id_b=mp_ids[opp_best_idx],
                    similarity_score=float(opp_best_score),
                    relation_type="opposition_twin"
                ))
            
            # 3. Opponent (Worst match globally)
            # worst_idx = np.argmin(scores)
            # ....")
            
        db.add_all(relations_to_add)
        db.commit()
        print("Done.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    calculate_alignment()
