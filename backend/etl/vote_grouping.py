import re
import sys
import os
from sqlalchemy import text
from backend.core.orm_db import SessionLocal
from backend.models import Vote
from backend.services.gemini import gemini_service
from backend.core.logger import get_logger

logger = get_logger("etl.grouping")

class VoteGroupingETL:
    def __init__(self, term=10):
        self.term = term

    def run(self, sitting=None):
        """
        Run grouping. If sitting is provided, run only for that sitting.
        Otherwise, run for all sittings in the term.
        """
        db = SessionLocal()
        try:
            if sitting:
                self.group_votes_for_sitting(db, sitting)
            else:
                sittings = db.query(Vote.sitting).filter(Vote.term == self.term).distinct().order_by(Vote.sitting).all()
                for (s_num,) in sittings:
                    self.group_votes_for_sitting(db, s_num)
        finally:
            db.close()

    def group_votes_for_sitting(self, db, sitting_number):
        logger.info(f"Grouping votes for Sitting {sitting_number}...")
        
        # 1. Fetch votes in strict temporal order
        votes = db.query(Vote).filter(Vote.sitting == sitting_number, Vote.term == self.term).order_by(Vote.voting_number).all()
        if not votes:
            return

        # 2. Linear Scan for Contiguous Clusters
        clusters = []
        current_cluster = []
        
        for v in votes:
            # Clear previous flags
            v.is_procedural = False
            v.parent_vote_id = None
            
            if not current_cluster:
                current_cluster.append(v)
                continue
                
            last_v = current_cluster[-1]
            
            if self.are_related(last_v, v):
                current_cluster.append(v)
            else:
                clusters.append(current_cluster)
                current_cluster = [v]
                
        if current_cluster:
            clusters.append(current_cluster)

        # 3. Commit Groups
        updates = 0
        grouped_clusters_count = 0
        
        for group in clusters:
            if len(group) <= 1:
                continue
                
            parent = self.identify_parent(group)
            if not parent:
                continue
                
            grouped_clusters_count += 1
            for v in group:
                if v.id == parent.id:
                    v.is_procedural = False
                    v.parent_vote_id = None
                else:
                    v.is_procedural = True
                    v.parent_vote_id = parent.id
                    updates += 1
                    
        db.commit()
        if updates > 0:
            logger.info(f"Sitting {sitting_number}: Grouped {updates} votes into {grouped_clusters_count} clusters")

    def get_print_number(self, v):
        match = re.search(r'druki? n?r (\d+)', v.title_raw or "", re.IGNORECASE)
        return match.group(1) if match else None

    def are_related(self, v1, v2):
        # 0. Check for "Punkt" in details_json (Most reliable if available)
        d1 = v1.details_json or {}
        d2 = v2.details_json or {}
        
        # Sejm API often puts stuff like "1. Pierwsze czytanie..." in 'topic'
        point1 = d1.get('topic', '').split('.')[0] if '.' in d1.get('topic', '') else None
        point2 = d2.get('topic', '').split('.')[0] if '.' in d2.get('topic', '') else None
        
        if point1 and point2 and point1.isdigit() and point2.isdigit():
            if point1 == point2: return True

        # Rule A: Same Print Number
        p1 = self.get_print_number(v1)
        p2 = self.get_print_number(v2)
        if p1 and p2:
            return p1 == p2
        
        # Rule B: High Text Similarity (Prefix)
        t1 = (v1.title_clean or v1.title_raw or "").strip().lower()
        t2 = (v2.title_clean or v2.title_raw or "").strip().lower()
        
        # Rule C: Smart Topic Check from Sejm API
        topic1 = d1.get('topic', '')
        topic2 = d2.get('topic', '')
        if topic1 and topic2 and topic1 == topic2:
            return True

        limit = min(len(t1), len(t2))
        match_len = 0
        for i in range(limit):
            if t1[i] != t2[i]:
                break
            match_len += 1
            
        if match_len > 40:
            return True
            
        # Fallback: AI Semantic Check
        if len(t1) > 20 and len(t2) > 20:
             try:
                is_same = gemini_service.compare_titles(t1, t2)
                if is_same:
                    return True
             except Exception as e:
                logger.error(f"AI Check failed: {e}")
                
        return False

    def identify_parent(self, group):
        finality_keywords = [
            "nad całością", "uchwalenie", "udzielenie wotum", 
            "wybór", "powołanie", "przyjęcie wniosku", "odrzucenie wniosku"
        ]
        
        # Search backwards
        for i in range(len(group) - 1, -1, -1):
            v = group[i]
            t_lower = (v.title_clean or v.title_raw or "").lower()
            if any(k in t_lower for k in finality_keywords):
                return v
        
        # Fallback: Print Number consistency
        p_nums = set(self.get_print_number(v) for v in group if self.get_print_number(v))
        if len(p_nums) == 1:
            return group[-1]
            
        return None
