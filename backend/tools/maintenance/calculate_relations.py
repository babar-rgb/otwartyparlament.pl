import logging
logging.basicConfig(level=logging.INFO)

from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func
from backend import models
from backend.core.config import config
import sys
import os

# Add parent directory to path to allow importing backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

def calculate_relations():
    database_url = config.get_db_uri()
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
        
    engine = create_engine(database_url)
    db = Session(engine)
    
    logging.info("Fetching MPs...")
    mps = db.query(models.MP).filter(models.MP.term == 10, models.MP.active == True).all()
    logging.info(f"Found {len(mps)} active MPs in term 10.")
    
    # Pre-fetch all vote results for term 10
    logging.info("Fetching Vote Results (this might take a moment)...")
    # Optimize: Only fetch (mp_id, vote_id, result) tuples
    results = db.query(models.VoteResult.mp_id, models.VoteResult.vote_id, models.VoteResult.result)\
        .join(models.Vote, models.VoteResult.vote_id == models.Vote.id)\
        .filter(models.Vote.term == 10)\
        .all()
        
    logging.info(f"Loaded {len(results)} vote results.")
    
    # Organize into a dictionary: mp_id -> {vote_id: result}
    mp_votes = {}
    for r in results:
        if r.mp_id not in mp_votes:
            mp_votes[r.mp_id] = {}
        mp_votes[r.mp_id][r.vote_id] = r.result
        
    logging.info("Calculating similarities...")
    
    # Calculate relations
    # We want to find for each MP:
    # 1. Ideological Twin (Max Agreement)
    # 2. Opposition Twin (Max Disagreement - i.e. strict opposite votes)
    
    relations_to_add = []
    
    # Wipe existing relations for clean state or update? Wiping is safer for now.
    db.query(models.MPRelation).delete()
    db.commit()
    
    total_mps = len(mps)
    
    for idx, mp_a in enumerate(mps):
        if mp_a.id not in mp_votes:
            continue
            
        votes_a = mp_votes[mp_a.id]
        
        best_agreement_score = -1.0
        best_agreement_mp_id = None
        
        best_opposition_score = -1.0
        best_opposition_mp_id = None
        
        # Compare with every other MP
        for mp_b in mps:
            if mp_a.id == mp_b.id:
                continue
            
            if mp_b.id not in mp_votes:
                continue
                
            votes_b = mp_votes[mp_b.id]
            
            # Find common votes
            common_vote_ids = set(votes_a.keys()) & set(votes_b.keys())
            if not common_vote_ids:
                continue
                
            total_common = len(common_vote_ids)
            if total_common < 100: # Minimum threshold to be meaningful
                continue
                
            agreement_count = 0
            opposition_count = 0
            
            for vid in common_vote_ids:
                res_a = votes_a[vid]
                res_b = votes_b[vid]
                
                # Check agreement
                if res_a == res_b:
                    if res_a in ['YES', 'NO', 'ABSTAIN']:
                        agreement_count += 1
                
                # Check opposition (strict opposite)
                if (res_a == 'YES' and res_b == 'NO') or (res_a == 'NO' and res_b == 'YES'):
                    opposition_count += 1
            
            # Use intersection count excluding absences for denominator? 
            # Ideally denominator is votes where both were present.
            # Let's approximate: denominator is all common votes where neither was absent?
            # Or just use raw total_common.
            
            # Agreement Score
            ag_score = agreement_count / total_common
            
            # Opposition Score
            op_score = opposition_count / total_common
            
            if ag_score > best_agreement_score:
                best_agreement_score = ag_score
                best_agreement_mp_id = mp_b.id
                
            if op_score > best_opposition_score:
                best_opposition_score = op_score
                best_opposition_mp_id = mp_b.id
        
        # Add to batch
        if best_agreement_mp_id:
            relations_to_add.append(models.MPRelation(
                mp_id_a=mp_a.id,
                mp_id_b=best_agreement_mp_id,
                relation_type='ideological_twin',
                similarity_score=best_agreement_score
            ))
            
        if best_opposition_mp_id:
            relations_to_add.append(models.MPRelation(
                mp_id_a=mp_a.id,
                mp_id_b=best_opposition_mp_id,
                relation_type='opposition_twin',
                similarity_score=best_opposition_score
            ))
            
        if idx % 10 == 0:
            logging.info(f"Processed {idx}/{total_mps} MPs...")
            
    logging.info(f"Saving {len(relations_to_add)} relations to DB...")
    db.bulk_save_objects(relations_to_add)
    db.commit()
    logging.info("Done!")

if __name__ == "__main__":
    calculate_relations()
