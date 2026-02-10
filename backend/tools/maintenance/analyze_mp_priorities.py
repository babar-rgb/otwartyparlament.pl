import logging
logging.basicConfig(level=logging.INFO)
import sys
import json
from pathlib import Path
from collections import Counter

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from backend.core.orm_db import SessionLocal
from backend.models import MP, Interpellation, MPStat, InterpellationAuthor

# Extended Topic Dictionary
TOPICS = {
    "Zdrowie": ["szpital", "lekarz", "medyczn", "pacjent", "chorob", "leków", "recept", "nfz", "karetka", "sor"],
    "Infrastruktura": ["droga", "kolej", "pociąg", "pkp", "autostrada", "remont", "budowa", "obwodnica", "dworzec", "most"],
    "Rolnictwo": ["rolni", "zboż", "wieś", "krow", "trzoda", "asf", "dopłaty", "ziemia", "plon", "susz"],
    "Edukacja": ["szkoł", "nauczyciel", "uczeń", "oświat", "edukac", "podręcznik", "lekcj", "przedszkol"],
    "Energetyka": ["prąd", "energi", "węgiel", "gaz", "ciepł", "elektrowni", "oze", "fotowoltaik", "wiatrow"],
    "Środowisko": ["odpad", "śmieci", "las", "drzew", "rzek", "wod", "powietrz", "smog", "klimat", "park narodowy"],
    "Gospodarka": ["podatk", "vat", "przedsiębiorc", "firm", "inflacj", "pkb", "biznes", "zus", "rynek"],
    "Obronność": ["wojsk", "armi", "obron", "żołnierz", "sprzęt", "amunicj", "granic", "mundur"],
    "Mieszkania": ["mieszkan", "lokal", "czynsz", "najem", "spółdzielni", "deweloper", "budownictw"],
    "Prawa Kobiet": ["kobiet", "aborcj", "ciąż", "poród", "równouprawnien"],
    "Zwierzęta": ["zwierz", "psów", "kot", "schronisk", "weterynar"],
}

def analyze_priorities():
    db = SessionLocal()
    try:
        logging.info("Analyzing MP Priorities...")
        mps = db.query(MP).filter(MP.active == True).all()
        
        # Use join table
        results = db.query(Interpellation, InterpellationAuthor.mp_id)\
                    .join(InterpellationAuthor, Interpellation.id == InterpellationAuthor.interpellation_id)\
                    .all()
       
        interpellation_map = {}
        for interpellation, mp_id in results:
            if mp_id not in interpellation_map:
                interpellation_map[mp_id] = []
            interpellation_map[mp_id].append(interpellation)

        stats_to_add = []
        
        # Clear old stats
        db.query(MPStat).filter(MPStat.stat_key == "top_priorities").delete()
        
        for mp in mps:
            mps_ints = interpellation_map.get(mp.id, [])
            if not mps_ints:
                continue
                
            # Count topics
            topic_counter = Counter()
            
            full_text = " ".join([i.title.lower() for i in mps_ints if i.title])
            
            for topic, keywords in TOPICS.items():
                for kw in keywords:
                    if kw in full_text:
                        # Count occurrences? Or just presence per interpellation?
                        # Counting per interpellation is better.
                        count = sum(1 for i in mps_ints if i.title and kw in i.title.lower())
                        topic_counter[topic] += count
            
            # Get Top 3
            top_3 = topic_counter.most_common(3)
            # Filter out zeros
            top_3 = [(t, c) for t, c in top_3 if c > 0]
            
            if top_3:
                stats_to_add.append(MPStat(
                    mp_id=mp.id,
                    stat_key="top_priorities",
                    stat_value=json.dumps([{"topic": t, "count": c} for t, c in top_3])
                ))
                
        logging.info(f"Saving priorities for {len(stats_to_add)} MPs...")
        db.add_all(stats_to_add)
        db.commit()
        logging.info("Done.")

    except Exception as e:
        logging.info(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    analyze_priorities()
