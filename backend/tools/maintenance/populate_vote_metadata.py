import logging
logging.basicConfig(level=logging.INFO)
import json
from backend.core.db import db
from backend.core.logger import get_logger

logger = get_logger("scripts.populate_vote_metadata")

TOPIC_KEYWORDS = {
    "Gospodarka": ["budżet", "podatk", "finans", "ekonom", "pieniądz", "walut", "giełd", "przedsiębior"],
    "Zdrowie": ["zdrow", "medyc", "szpital", "pacjent", "lek", "apte", "chorob", "epidemi"],
    "Sprawiedliwość": ["sąd", "trybunał", "konstytuc", "kodeks", "praw", "wymiar sprawiedliwości", "sędzi", "prokurator"],
    "Obronność": ["wojsk", "armia", "obron", "bezpieczeństwo", "nato", "militarn", "żołnierz"],
    "Edukacja": ["szkoł", "nauczył", "uczeń", "uniwersytet", "nauka", "oświata", "edukac"],
    "Środowisko": ["klimat", "ekolog", "środowisk", "energia", "atom", "lasy", "woda", "powietrze"],
    "Społeczeństwo": ["rodzin", "dzieci", "emerytur", "rent", "zasił", "pomoc społeczna", "aborcj", "związki partnerskie"],
}

def classify_topic(title):
    title_lower = title.lower()
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw in title_lower for kw in keywords):
            return topic
    return "Inne"

def calculate_importance(yes, no, abstain, is_law):
    total = yes + no
    if total == 0:
        return 1
    
    # Margin-based controversy (0.0 to 1.0, lower is closer/more controversial)
    margin = abs(yes - no) / total
    
    # Base importance
    importance = 5
    if is_law:
        importance += 2
        
    # Boost for close votes
    if margin < 0.05: # very close
        importance += 3
    elif margin < 0.15: # relatively close
        importance += 1
        
    return min(10, importance)

def run():
    logger.info("Starting Vote Metadata Population...")
    
    with db.get_cursor(commit=True) as cur:
        cur.execute("SELECT id, title_raw, details_json FROM votes")
        votes = cur.fetchall()
        
        updated = 0
        for vote in votes:
            details = vote['details_json']
            if isinstance(details, str):
                details = json.loads(details)
            
            yes = details.get('yes', 0)
            no = details.get('no', 0)
            abstain = details.get('abstain', 0)
            title = vote['title_raw']
            
            is_law = "ustaw" in title.lower() or "projekt" in title.lower()
            kind = "Ustawa" if "ustaw" in title.lower() else "Uchwała" if "uchwał" in title.lower() else "Inne"
            
            topic = classify_topic(title)
            importance = calculate_importance(yes, no, abstain, is_law)
            
            cur.execute("""
                UPDATE votes 
                SET topic = %s, importance = %s, kind = %s
                WHERE id = %s
            """, (topic, importance, kind, vote['id']))
            updated += 1
            
            if updated % 100 == 0:
                logger.info(f"Updated {updated}/{len(votes)} votes...")
                
    logger.info(f"Population complete. {updated} votes updated.")

if __name__ == "__main__":
    run()
