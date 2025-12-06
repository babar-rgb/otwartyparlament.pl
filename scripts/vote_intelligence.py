import re
import math
from typing import Dict, List, Optional, Tuple

# Try to import sklearn for Thematic Pillar (Clusterization)
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.cluster import KMeans
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

class VoteAnalyzer:
    """
    Enterprise-grade Vote Intelligence Engine for classifying and scoring parliamentary votes.
    Scoring Scale: 0.0 - 100.0 (Importance Score)
    """

    def __init__(self):
        # 1. SEMANTIC PILLAR CONFIGURATION
        self.HIGH_IMPACT_KEYWORDS = {
            'konstytucja': 100, 'konstytucji': 100,
            'budżet': 90, 'budżetowa': 90, 'vat': 85, 'podatek': 85, 'podatku': 85,
            'aborcja': 95, 'in vitro': 90, 'ochrona zdrowia': 80,
            'obronność': 85, 'wojsko': 80, 'bezpieczeństwo': 80,
            'sąd najwyższy': 90, 'trybunał': 90, 'krs': 85,
            'unijna': 75, 'dyrektywa': 70,
            'wotum nieufności': 100,
        }
        
        self.LOW_IMPACT_KEYWORDS = {
            'zmiana porządku': -30, 'przerwa': -40, 'odroczenie': -30,
            'wybór sekretarzy': -50, 'sprawozdanie komisji': -10,
            'uzupełnienie porządku': -20, 'ślubowanie': -10
        }

        # 3. LEGAL PILLAR CONFIGURATION (Hierarchy)
        self.LEGAL_HIERARCHY = {
            'zmiana konstytucji': 100,
            'ustawa budżetowa': 95,
            'wotum nieufności': 90,
            'ustawa': 70,
            'kodeks': 75,
            'uchwała': 40,
            'apel': 30,
            'poprawka': 25,
            'wniosek mniejszości': 20,
            'wniosek formalny': 10,
            'wybór personalny': 50 # np. RPD, RPO
        }

        # 4. THEMATIC PILLAR (ML State)
        self.vectorizer = None
        self.kmeans = None
        self.topic_labels = {}

    def calculate_political_weight(self, yes: int, no: int, abstain: int) -> float:
        """
        FILAR 2: POLITICAL (Controversy Index)
        Analyzes vote structure to detect close calls and high interest.
        Returns: 0.0 - 1.0
        """
        total_votes = yes + no + abstain
        if total_votes == 0:
            return 0.0

        # A. Start with Turnout Factor
        # 460 MPs total. >400 is High Importance. <230 (quorum) is problematic/low.
        turnout_score = min(1.0, total_votes / 440.0)

        # B. Controversy (Close Call) Detector
        # If 50/50 split -> Score 1.0
        # If 100/0 split -> Score 0.0
        # Formula: 1 - |yes - no| / (yes + no)
        controversy_votes = yes + no
        if controversy_votes > 0:
            margin_percent = abs(yes - no) / controversy_votes
            controversy_score = 1.0 - margin_percent # 1.0 means perfect tie
        else:
            controversy_score = 0.0

        # Weighted combination: Controversy matters most, but turnout validates it.
        # If score is controversial (0.9) but turnout is 20 people (0.05), result is low.
        political_weight = (controversy_score * 0.7 + turnout_score * 0.3)
        
        # Boost for "Close Call" (within 10 votes)
        if abs(yes - no) < 10 and total_votes > 230:
            political_weight = min(1.0, political_weight + 0.3)

        return float(political_weight)

    def analyze_text_importance(self, title: str, description: str = "") -> float:
        """
        FILAR 1: SEMANTIC (NLP & Text Analysis)
        Returns: 0.0 - 1.0
        """
        text = (title + " " + description).lower()
        base_score = 50.0 # Start neutral

        # A. Keyword Analysis
        for kw, weight in self.HIGH_IMPACT_KEYWORDS.items():
            if kw in text:
                base_score += 20 # Add points for important topics
        
        for kw, weight in self.LOW_IMPACT_KEYWORDS.items():
            if kw in text:
                base_score += weight # Subtract points for procedural noise

        # B. Length/Complexity Heuristic
        # Important laws usually have longer, complex descriptions.
        # Procedural votes are usually shorts ("Wniosek o przerwę")
        if len(description) > 500:
            base_score += 10
        elif len(title) < 20:
            base_score -= 10

        # Normalize 0-100 to 0.0-1.0
        return float(max(0.0, min(100.0, base_score)) / 100.0)

    def _get_legal_rank(self, title: str) -> float:
        """
        FILAR 3: LEGAL HIERARCHY
        Returns: 0.0 - 1.0
        """
        title_lower = title.lower()
        
        best_match_score = 50 # Default middle ground

        for key, score in self.LEGAL_HIERARCHY.items():
            if key in title_lower:
                # Keep the highest matching score (e.g. "Zmiana Konstytucji" > "Ustawa")
                if score > best_match_score:
                    best_match_score = score
        
        # Special case: "Drugie czytanie" often implies "Poprawka" context unless specified
        if "drugie czytanie" in title_lower or "trzecie czytanie" in title_lower:
             # Reading phases are important but not as final as the law itself
            pass 

        return float(best_match_score / 100.0)

    def predict_topic(self, text: str) -> str:
        """
        FILAR 4: THEMATIC (Unsupervised or Keyword fallback)
        """
        text = text.lower()
        
        # Fallback Keywords (if no ML model trained)
        if 'zdrow' in text or 'lecznict' in text or 'szpital' in text or 'lekars' in text:
            return 'Zdrowie'
        if 'sąd' in text or 'trybunał' in text or 'wymiar sprawiedliwości' in text:
             return 'Sądownictwo'
        if 'finans' in text or 'budżet' in text or 'vat' in text or 'podat' in text or 'składk' in text:
            return 'Ekonomia'
        if 'roln' in text or 'wsi' in text or 'pasz' in text:
            return 'Rolnictwo'
        if 'szkoł' in text or 'nauczyciel' in text or 'edukacj' in text:
            return 'Edukacja'
        if 'obron' in text or 'wojsk' in text or 'armi' in text:
            return 'Obronność'
        if 'unii' in text or 'europejs' in text:
            return 'Sprawy Zagraniczne'
        
        return 'Inne'

    def calculate_final_score(self, 
                              title: str, 
                              description: str, 
                              yes: int, 
                              no: int, 
                              abstain: int) -> Dict:
        """
        Main entry point for scoring a single vote.
        Combines all 4 pillars using Weighted Average.
        """
        # 1. Calculate Individual Scores
        text_score = self.analyze_text_importance(title, description)
        political_score = self.calculate_political_weight(yes, no, abstain)
        legal_score = self._get_legal_rank(title)
        
        # 2. Define Weights for the "Master Formula"
        # We value Semantic (what is it?) and Political (is it hot?) the most.
        W_TEXT = 0.35
        W_POLITICAL = 0.40
        W_LEGAL = 0.25

        raw_final_score = (
            (text_score * W_TEXT) +
            (political_score * W_POLITICAL) +
            (legal_score * W_LEGAL)
        )

        # Scale to 0-100 integer
        final_score_100 = round(raw_final_score * 100)
        
        # Heuristic overrides
        if "przerw" in title.lower() and final_score_100 > 15:
            final_score_100 = 15 # Hard Cap for procedural breaks

        # BOOST: If Text Score is very high (>0.8), ensure Score is at least 60 (Key Vote)
        # This protects unanimous but important laws (like Defense spending)
        if text_score > 0.8:
            final_score_100 = max(final_score_100, 75)

        category = self.predict_topic(title + " " + description)

        return {
            "importance_score": final_score_100, # 0-100
            "category": category,
            "components": {
                "text_score": round(text_score, 2),
                "political_score": round(political_score, 2),
                "legal_score": round(legal_score, 2)
            },
            "is_key_vote": final_score_100 >= 65 # Threshold for "Key Vote"
        }

if __name__ == "__main__":
    # Quick Test
    engine = VoteAnalyzer()
    
    test_cases = [
        {
            "title": "Głosowanie nad przyjęciem wniosku o przerwę w obradach",
            "desc": "",
            "yes": 220, "no": 210, "abstain": 0 
        },
        {
            "title": "Ustawa budżetowa na rok 2024",
            "desc": "Projekt ustawy określający wydatki państwa...",
            "yes": 231, "no": 228, "abstain": 1
        },
        {
            "title": "Zmiana ustawy o podatku od towarów i usług (VAT)",
            "desc": "Podwyższenie stawki VAT na żywność.",
            "yes": 400, "no": 10, "abstain": 5
        }
    ]

    print("=== TEST ENGINE ===")
    for case in test_cases:
        result = engine.calculate_final_score(
            case['title'], case['desc'], case['yes'], case['no'], case['abstain']
        )
        print(f"\nTitle: {case['title']}")
        print(f"Votes: {case['yes']}/{case['no']}")
        print(f"Score: {result['importance_score']} / 100")
        print(f"Category: {result['category']}")
        print(f"Components: {result['components']}")
