from typing import Dict
from backend.core.logger import get_logger

logger = get_logger("services.ml")

class VoteIntelligenceService:
    """
    Standardized Logic for Vote Classification and Scoring.
    Refactored from scripts/vote_intelligence.py
    """

    CATEGORY_KEYWORDS = {
        "ZDROWIE": ["zdrow", "szpital", "lekarz", "pielęgnia", "medyc", "leków", "leki", "refundac", "pacjent", "nfz", "farmaceu", "ratownictw", "chorób", "szczepie", "epidemi", "transplant", "krwiodaw", "psychiat", "sanitarn", "wyrobów medycz"],
        "GOSPODARKA": ["podat", "vat", "pit", "cit", "akcyz", "budżet", "finans", "bank", "pieniądz", "gospodar", "przedsiębior", "biznes", "handl", "cłO", "skarbow", "dochod", "ubezpiecz", "ofE", "zus", "giełd", "inwestyc", "dług publicz", "inflac", "walut", "nbf", "kredyt", "działalność gospodar"],
        "ROLNICTWO": ["roln", "wieś", "wsi", "gospodarstw", "pasz", "zboż", "hodowl", "zwierząt", "grunt", "nawoz", "arimr", "krus", "rybołów", "łowiec", "lasy", "leśn", "weterynar", "odroln", "szkod łowiec", "kół gospodyń"],
        "OBRONNOŚĆ": ["wojsk", "obron", "armi", "żołnierz", "granic", "mundur", "weteran", "nato", "wywiad", "kontrwywiad", "służb specjal", "amunic", "broń", "zbrojn", "cyberbezpiecz", "terytorials", "wot"],
        "SPRAWIEDLIWOŚĆ": ["sąd", "praw", "karn", "kodeks", "cywiln", "prokurat", "trybunał", "ustroj", "więzien", "służb więzien", "komornic", "notarial", "adwokat", "radc prawn", "sprawiedliwo", "nieletni", "krs"],
        "EDUKACJA": ["szkoł", "szkoln", "edukac", "naucz", "oświat", "uczelni", "student", "akademi", "nauk", "badawcz", "egzamin", "dyplom", "przedszkol", "kurator", "nauczyciel"],
        "ENERGETYKA": ["energ", "prąd", "węgiel", "węglow", "gaz", "paliw", "elektrown", "oze", "klimat", "ciepł", "górnic", "jądrow", "atom", "ropa", "biomas", "fotowolta", "wiatrow"],
        "INFRASTRUKTURA": ["drog", "dróg", "kolej", "transport", "autostrad", "pociąg", "lotnic", "mieszkan", "budowlan", "lokal", "pkp", "poczt", "żeglug", "morsk", "port", "kierowc", "pojazd", "ruch drogow"],
        "POLITYKA SPOŁECZNA": ["rent", "emeryt", "socjal", "niepełnosprawn", "rodzin", "dziec", "zasiłk", "pomoc społeczn", "bezroboc", "pracy", "kodeks pracy", "związk zawod", "płac minimal", "500+", "800+", "świadczen"],
        "SPRAWY ZAGRANICZNE": ["umow międzynarodow", "ratyfik", "zagranic", "konsul", "dyploma", "unia europej", "ue", "ukrain", "poloni", "współprac"],
        "KULTURA": ["kultur", "sztuk", "muze", "teatr", "film", "radi", "telewizj", "dziedzictw", "zabytk", "artyst", "mediów", "radiofoni"]
    }

    HIGH_IMPACT_KEYWORDS = {
        'konstytucja': 100, 'konstytucji': 100,
        'budżet': 90, 'budżetowa': 90, 'vat': 85, 'podatek': 85, 'podatku': 85,
        'aborcja': 95, 'in vitro': 90, 'ochrona zdrowia': 80,
        'obronność': 85, 'wojsko': 80, 'bezpieczeństwo': 80,
        'sąd najwyższy': 90, 'trybunał': 90, 'krs': 85,
        'unijna': 75, 'dyrektywa': 70,
        'wotum nieufności': 100,
    }

    LEGAL_HIERARCHY = {
        'zmiana konstytucji': 100, 'ustawa budżetowa': 95, 'wotum nieufności': 90,
        'ustawa': 70, 'kodeks': 75, 'uchwała': 40, 'apel': 30,
        'poprawka': 25, 'wniosek mniejszości': 20, 'wniosek formalny': 10,
        'wybór personalny': 50
    }

    def __init__(self):
        logger.info("Initializing VoteIntelligenceService")

    def calculate_political_weight(self, yes: int, no: int, abstain: int) -> float:
        total = yes + no + abstain
        if total == 0: return 0.0
        
        turnout_score = min(1.0, total / 440.0)
        
        controversy_votes = yes + no
        if controversy_votes > 0:
            margin = abs(yes - no) / controversy_votes
            controversy_score = 1.0 - margin
        else:
            controversy_score = 0.0
            
        weight = (controversy_score * 0.7 + turnout_score * 0.3)
        if abs(yes - no) < 10 and total > 230:
            weight = min(1.0, weight + 0.3)
            
        return float(weight)

    def analyze_text_importance(self, text: str) -> float:
        text = text.lower()
        score = 50.0
        
        for kw, points in self.HIGH_IMPACT_KEYWORDS.items():
            if kw in text:
                score += 20
        
        return float(max(0.0, min(100.0, score)) / 100.0)

    def predict_topic(self, text: str) -> str:
        text = text.lower()
        scores = {cat: 0 for cat in self.CATEGORY_KEYWORDS}
        
        for cat, kws in self.CATEGORY_KEYWORDS.items():
            for kw in kws:
                if kw in text:
                    scores[cat] += 1
                    if f"ustawa o {kw}" in text: scores[cat] += 3
        
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else 'Inne'

    def calculate_score(self, title: str, description: str, yes: int, no: int, abstain: int) -> Dict:
        text = f"{title} {description}"
        text_score = self.analyze_text_importance(text)
        pol_score = self.calculate_political_weight(yes, no, abstain)
        
        # Simple weighted sum
        final = (text_score * 0.45) + (pol_score * 0.55)
        score_100 = round(final * 100)
        
        # Hard overrides
        if "przerw" in title.lower() and score_100 > 15: score_100 = 15
        if text_score > 0.8: score_100 = max(score_100, 75)

        return {
            "importance_score": score_100,
            "category": self.predict_topic(text),
            "is_key_vote": score_100 >= 65
        }

vote_intelligence = VoteIntelligenceService()
