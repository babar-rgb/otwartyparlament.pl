import logging
logging.basicConfig(level=logging.INFO)
import sys
import os
import re
from collections import defaultdict
from sqlalchemy import text, func

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.core.orm_db import SessionLocal
from backend.models import Vote
from backend.services.gemini import gemini_service

def group_votes_for_sitting(db, sitting_number):
    logging.info(f"\n--- Processing Sitting {sitting_number} ---")
    
    # 1. Fetch votes in strict temporal order
    votes = db.query(Vote).filter(Vote.sitting == sitting_number).order_by(Vote.voting_number).all()
    if not votes:
        return

    # 2. Linear Scan for Contiguous Clusters
    # Logic: Votes for the same law happen in sequence. 
    # We group V(i) with V(i-1) if they share a Print Number OR a very long distinct prefix.
    
    clusters = []
    current_cluster = []
    
    # Reset all grouping for this sitting first to ensure clean state (Legal Safety)
    # But for performance, we might just update. Let's assume re-run overwrites.
    
    def get_print_number(v):
        match = re.search(r'druki? n?r (\d+)', v.title_raw or "", re.IGNORECASE)
        return match.group(1) if match else None

    def are_related(v1, v2):
        # Rule A: Same Print Number (Strongest Evidence)
        p1 = get_print_number(v1)
        p2 = get_print_number(v2)
        if p1 and p2:
            return p1 == p2
        
        # Rule B: High Text Similarity (Prefix)
        # We need a long prefix to avoid "Sprawozdanie Komisji o..." (generic)
        # "Sprawozdanie Komisji o rządowym projekcie ustawy o zmianie ustawy o podatku od towarów..."
        t1 = (v1.title_clean or v1.title_raw or "").strip().lower()
        t2 = (v2.title_clean or v2.title_raw or "").strip().lower()
        
        # Determine common prefix length
        limit = min(len(t1), len(t2))
        match_len = 0
        for i in range(limit):
            if t1[i] != t2[i]:
                break
            match_len += 1
            
        # Threshold: 60 characters is usually enough to cover the full name of the Act
        # Generic prefixes are usually ~30-40 chars.
        if match_len > 40: # Relaxed heuristic from 60 to 40
            return True
            
        # Fallback: AI Semantic Check (For "Zmiana" vs "Nowelizacja")
        # Only check if they happened in the same sitting (context implies yes as we scan linearly)
        # We limit to titles that are at least somewhat long to avoid "Wniosek o przerwę" matching random things
        if len(t1) > 20 and len(t2) > 20: 
            # Optimization: Check for overlap of significant words?
            # Or just trust AI.
            logging.info(f"    🤖 AI Checking linkage: '{t1[:30]}...' vs '{t2[:30]}...'")
            is_same = gemini_service.compare_titles(t1, t2)
            if is_same:
                logging.info(f"    ✅ AI FOUND LINK: {t1} <-> {t2}")
                return True
                
        return False

    for v in votes:
        # Clear previous AI/heuristic flags
        v.is_procedural = False
        v.parent_vote_id = None
        
        if not current_cluster:
            current_cluster.append(v)
            continue
            
        last_v = current_cluster[-1]
        
        if are_related(last_v, v):
            current_cluster.append(v)
        else:
            # Cluster ended or broke continuity.
            clusters.append(current_cluster)
            current_cluster = [v]
            
    if current_cluster:
        clusters.append(current_cluster)

    # 3. Validate and Commit Groups
    updates = 0
    grouped_clusters_count = 0
    
    for group in clusters:
        if len(group) <= 1:
            continue
            
        # LEGAL CHECK: Does this group have a "Final Verdict"?
        # If a group is just a bunch of amendments without a final vote, 
        # grouping them might be misleading (orphaned amendments).
        
        # Identify Parent (Final Vote)
        parent = None
        
        # Explicit Keywords for Polish Legislative Finality
        finality_keywords = [
            "nad całością", 
            "uchwalenie", 
            "udzielenie wotum", 
            "wybór", 
            "powołanie",
            "przyjęcie wniosku", 
            "odrzucenie wniosku"
        ]
        
        # Search for parent in the group (usually at the end)
        for i in range(len(group) - 1, -1, -1):
            v = group[i]
            t_lower = (v.title_clean or v.title_raw or "").lower()
            if any(k in t_lower for k in finality_keywords):
                parent = v
                break
        
        # Fallback: If no explicit keyword, but we have a Print Number group,
        # the last vote is presumed final.
        if not parent:
            # Check if group shares a Print Number
            p_nums = set(get_print_number(v) for v in group if get_print_number(v))
            if len(p_nums) == 1:
                parent = group[-1]
        
        # Safe Mode: If still no parent, we DO NOT group.
        # It's better to show 5 separate votes than 1 potentially wrong group.
        if not parent:
            continue
            
        # Apply Grouping
        grouped_clusters_count += 1
        for v in group:
            if v.id == parent.id:
                v.is_procedural = False
                v.parent_vote_id = None
            else:
                v.is_procedural = True
                v.parent_vote_id = parent.id
                updates += 1
                
        if len(group) > 3:
            logging.info(f"  [SAFE MODE] Grouped {len(group)} votes under MAIN: #{parent.voting_number} ({parent.title_clean[:60]}...)")

    db.commit()
    logging.info(f"  Updates committed: {updates} (Clusters: {grouped_clusters_count})")

def main():
    db = SessionLocal()
    
    # Reset all grouping first? Or just iterate all.
    # Iterating all sittings ensures consistency.
    sittings = db.query(Vote.sitting).distinct().order_by(Vote.sitting).all()
    
    for (s_num,) in sittings:
        group_votes_for_sitting(db, s_num)
        
    db.close()

if __name__ == "__main__":
    main()
