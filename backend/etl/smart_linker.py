
import re
import logging
from typing import Optional, List, Tuple
from sqlalchemy import select, text, cast, String
from sqlalchemy.orm import Session
from thefuzz import fuzz

try:
    from backend.models import Vote, Bill
    from backend.core.db import SessionLocal
except ImportError:
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
    from backend.models import Vote, Bill
    from backend.core.db import SessionLocal

logger = logging.getLogger("etl.smart_linker")

class SmartLinker:
    def __init__(self, db: Session = None):
        self.db = db if db else SessionLocal()

    def link_vote(self, vote_id: int, db: Session = None) -> Optional[int]:
        """
        Main entry point for linking a single vote to a bill.
        Returns the bill_id if found and linked, else None.
        """
        session = db if db else self.db
        vote = session.get(Vote, vote_id)
        if not vote:
            return None

        if vote.bill_id:
            return vote.bill_id

        # Strategy 1: Regex Extraction from Title
        print_number = self._extract_print_number(vote.title_raw or vote.title_clean)
        if print_number:
            logger.info(f"🔍 Extracted print number {print_number} for vote {vote_id}")
            bill = self._find_bill_by_number(print_number, session)
            if bill:
                self._update_vote(vote, bill.id)
                return bill.id

        # Strategy 2: Fuzzy Title Match
        logger.info(f"🕵️ Attempting fuzzy match for vote {vote_id}...")
        
        # Guard: Check for generic titles that should not be linked via fuzzy
        v_title_raw = (vote.title_raw or vote.title_clean or "").lower()
        blacklist = ["posiedzenie sejmu", "wybór składów", "zmiany w składach", "przyjęcie protokołu"]
        if any(b in v_title_raw for b in blacklist):
            logger.info(f"🚫 Vote {vote_id} has a generic title. Skipping fuzzy match to avoid false positives.")
            return None

        bill_id = self._find_bill_by_fuzzy_title(vote, session)
        if bill_id:
            self._update_vote(vote, bill_id)
            return bill_id

        return None

    def _extract_print_number(self, text_str: str) -> Optional[str]:
        """Extracts print number (e.g. '123') from string."""
        if not text_str: return None
        # Pattern for 'druk nr 123', 'druku nr 123', 'drukiem nr 123', etc.
        patterns = [
            r'druk[a-z]*\s+(?:nr\s+)?(\d+)',
            r'\(druk\s+(\d+)\)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text_str, re.IGNORECASE)
            if match:
                val = match.group(1)
                logger.debug(f"Matches pattern {pattern}: {val}")
                return val
        return None

    def _find_bill_by_number(self, number: str, db: Session) -> Optional[Bill]:
        """Finds a bill by its print number."""
        stmt = select(Bill).where(Bill.number == number)
        return db.execute(stmt).scalars().first()

    def _find_bill_by_fuzzy_title(self, vote: Vote, db: Session) -> Optional[int]:
        """
        Compares vote title with recent bills.
        """
        # Clean vote title (basic)
        v_title = self._clean_vote_title(vote.title_clean or vote.title_raw)
        logger.debug(f"Fuzzy matching with cleaned title: {v_title}")
        
        # Get bills within a 60-day window of the vote
        # This prevents matching with very old similarly named bills
        from datetime import timedelta
        start_date = vote.date - timedelta(days=45)
        end_date = vote.date + timedelta(days=15)
        
        stmt = select(Bill.id, Bill.title).where(
            Bill.date >= start_date,
            Bill.date <= end_date
        )
        candidates = db.execute(stmt).all()
        
        best_match_id = None
        best_score = 0
        
        for b_id, b_title in candidates:
            # Clean bill title too for comparison
            b_title_clean = self._clean_vote_title(b_title)
            # We use token_set_ratio because vote titles are often longer/procedural
            score = fuzz.token_set_ratio(v_title, b_title_clean)
            
            # Merit Thresholding: 
            # If the title is still somewhat generic, require higher confidence
            required_score = 70
            if len(v_title) < 30 or "posiedzeni" in v_title.lower():
                required_score = 85
                
            if score > best_score and score >= required_score:
                best_score = score
                best_match_id = b_id
        
        if best_match_id:
            logger.info(f"🎯 Fuzzy found Bill #{best_match_id} for Vote {vote.id} (Score: {best_score})")
            
        return best_match_id

    def _clean_vote_title(self, title: str) -> str:
        """Removes common procedural noise from vote titles."""
        if not title: return ""
        # Remove 'Pkt 12. Głosowanie over...'
        title = re.sub(r'^Pkt\s+\d+\.?\s*', '', title, flags=re.IGNORECASE)
        # Remove 'Głosowanie nad...'
        title = re.sub(r'^Głosowanie\s+nad\s+', '', title, flags=re.IGNORECASE)
        # Remove common legislative prefixes
        title = re.sub(r'^(?:Projekt\s+)?ustawy\s+o\s+', '', title, flags=re.IGNORECASE)
        title = re.sub(r'^(?:Projekt\s+)?uchwały\s+w\s+sprawie\s+', '', title, flags=re.IGNORECASE)
        # Remove suffixes like '(druk nr 123)'
        title = re.sub(r'\(druku?\s+(?:nr\s+)?\d+\)', '', title, flags=re.IGNORECASE)
        return title.strip()

    def _update_vote(self, vote: Vote, bill_id: int):
        """Updates the vote record in DB with Bill info."""
        vote.bill_id = bill_id
        
        # Fetch Bill to get titles
        # We use the session attached to the vote object
        session = Session.object_session(vote)
        if session:
            bill = session.get(Bill, bill_id)
            if bill:
                # Prioritize Street Title (AI) > Official Title
                vote.title_clean = bill.street_title if bill.street_title else bill.title
                vote.topic = bill.topic
                logger.info(f"✅ Linked Vote {vote.id} to Bill {bill_id} (Title: {vote.title_clean})")
        else:
             logger.warning(f"⚠️ Vote {vote.id} has no session, could not sync title.")

# Singleton-like instance
smart_linker = SmartLinker()
