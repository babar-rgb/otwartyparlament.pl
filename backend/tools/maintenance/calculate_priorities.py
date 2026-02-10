import logging
logging.basicConfig(level=logging.INFO)

import json
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from backend import models
from backend.core.config import config
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

TOPIC_KEYWORDS = {
    "Zdrowie": ["zdrowie", "szpital", "lekarz", "lekars", "pacjent", "geriatria", "psycholog", "psychiatra", "onkolog", "lecznictwo", "chorob", "medycz", "rehabilitacja"],
    "Gospodarka": ["finans", "gospodarka", "biznes", "przedsiębiorca", "ceny", "energia", "prąd", "gaz", "paliwo", "podat", "kapitał", "ekonomia", "budżet", "inwestycje"],
    "Infrastruktura": ["droga", "autostrada", "kolej", "pociąg", "tory", "transport", "most", "remont", "infrastruktura", "łączność", "kierowca"],
    "Mieszkania": ["mieszkan", "dom", "lokal", "nieruchomość", "budownict", "czynsz", "deweloper", "pustostan"],
    "Środowisko": ["środowisko", "ekologia", "odpad", "śmieci", "las", "woda", "lasy", "klimat", "przyroda", "rolnictwo", "zwierzęta"],
    "Edukacja": ["szkoła", "nauczyciel", "uczeń", "edukacja", "oświata", "uniwersytet", "nauka", "student", "lekcje", "podręcznik"],
    "Obronność": ["wojsko", "armia", "obrona", "zbrojen", "militarn", "bezpieczeństwo", "granica", "policja", "służby", "straż"],
    "Rolnictwo": ["rolnictwo", "wieś", "rolnik", "uprawa", "hodowla", "płod", "ziemia", "zbior", "gospodarstwo rolne", "asf", "ptasia grypa"],
    "Sprawiedliwość": ["sąd", "prawo", "wymiar sprawiedliwości", "prokuratura", "sędzia", "adwokat", "trybunał", "konstytucja", "karne", "cywilne"],
    "Polityka Społeczna": ["rodzina", "dzieci", "senior", "emerytura", "emeryt", "emerytaln", "renta", "zasiłek", "pomoc społeczna", "niepełnosprawn", "opieka", "kobiety", "mężczyźni"]
}

def classify_text(text):
    if not text:
        return None
    text = text.lower()
    scores = {}
    for topic, keywords in TOPIC_KEYWORDS.items():
        score = 0
        for kw in keywords:
            if kw in text:
                score += 1
        if score > 0:
            scores[topic] = score
    
    if not scores:
        return "Inne"
    
    # Return the topic with highest score
    return max(scores, key=scores.get)

def calculate_priorities():
    database_url = config.get_db_uri()
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
        
    engine = create_engine(database_url)
    db = Session(engine)
    
    logging.info("Fetching MPs...")
    mps = db.query(models.MP).filter(models.MP.term == 10, models.MP.active == True).all()
    
    for idx, mp in enumerate(mps):
        topic_counts = {}
        
        # 1. Analyze Interpellations
        # Join many-to-many
        interpellations = db.query(models.Interpellation).join(models.InterpellationAuthor).filter(models.InterpellationAuthor.mp_id == mp.id).all()
        for interp in interpellations:
            topic = classify_text(interp.title)
            if topic:
                topic_counts[topic] = topic_counts.get(topic, 0) + 1
        
        # 2. Analyze Bills (where he is proposer)
        bills = db.query(models.Bill).filter(models.Bill.mp_id == mp.id).all()
        for bill in bills:
            # Use bill.topic if exists, else classify title
            topic = bill.topic or classify_text(bill.title)
            if topic:
                topic_counts[topic] = topic_counts.get(topic, 0) + 2 # Heavily weight bills
                
        # 3. Analyze Speeches (if they have topics, or classify content/topic field)
        speeches = db.query(models.Speech).filter(models.Speech.mp_id == mp.id).all()
        for speech in speeches:
            # If topic exists but is 'Debata' or empty, ignore
            topic = speech.topic if speech.topic not in ['Debata', '', None] else None
            # Or classify content snippet? Let's just use topic for now if useful
            if topic:
                topic_counts[topic] = topic_counts.get(topic, 0) + 0.5 # Light weight for speeches

        # Sort and take top 3
        sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
        top_3 = [{"topic": t, "count": int(c)} for t, c in sorted_topics if t != "Inne"][:3]
        
        if top_3:
            # Upsert into MPStat
            stat = db.query(models.MPStat).filter(models.MPStat.mp_id == mp.id, models.MPStat.stat_key == 'top_priorities').first()
            if not stat:
                stat = models.MPStat(mp_id=mp.id, stat_key='top_priorities')
                db.add(stat)
            
            stat.stat_value = json.dumps(top_3)
        
        if idx % 50 == 0:
            logging.info(f"Processed {idx}/{len(mps)} MPs...")
            db.commit()

    db.commit()
    logging.info("Done!")

if __name__ == "__main__":
    calculate_priorities()
