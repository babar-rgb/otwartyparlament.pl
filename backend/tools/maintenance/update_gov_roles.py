import logging
logging.basicConfig(level=logging.INFO)
from sqlalchemy.orm import Session
from backend.core.orm_db import SessionLocal
from backend.models import MP, MPStat
from sqlalchemy import text

ROLES = {
    "Tusk": "Prezes Rady Ministrów",
    "Kosiniak-Kamysz": "Wiceprezes Rady Ministrów, Minister Obrony Narodowej",
    "Gawkowski": "Wiceprezes Rady Ministrów, Minister Cyfryzacji",
    "Hołownia": "Marszałek Sejmu (do 2025)", # Updated based on user info
    "Bosak": "Wicemarszałek Sejmu",
    "Czarzasty": "Marszałek Sejmu", # Rotated
    "Niedziela": "Wicemarszałek Sejmu",
    "Wielichowska": "Wicemarszałek Sejmu",
    "Zgorzelski": "Wicemarszałek Sejmu",
    "Bodnar": "Minister Sprawiedliwości",
    "Jazłowiecka": "Wiceprzewodnicząca ZP Rady Europy",
    "Szłapka": "Minister do spraw Unii Europejskiej",
    "Okła-Drewnowicz": "Minister do spraw Polityki Senioralnej",
    "Klimczak": "Minister Infrastruktury",
    "Kołodziejczak": "Sekretarz Stanu w Ministerstwie Rolnictwa",
    "Tomczyk": "Sekretarz Stanu w MON",
    "Myrcha": "Sekretarz Stanu w Ministerstwie Sprawiedliwości",
    "Gajewska": "Sekretarz Stanu w MRPiPS",
    "Zielińska": "Sekretarz Stanu w MKiŚ",
    "Sikorski": "Minister Spraw zagranicznych",
    "Domański": "Minister Finansów",
    "Hennig-Kloska": "Minister Klimatu i Środowiska",
    "Siekierski": "Minister Rolnictwa i Rozwoju Wsi",
    "Arłukowicz": "Przewodniczący Komisji Zdrowia", # Example
    "Kierwiński": "Minister Spraw Wewnętrznych i Administracji (były)",
    "Siemoniak": "Minister Spraw Wewnętrznych i Administracji",
    "Budka": "Poseł do PE (były Minister)",
    "Nitras": "Minister Sportu i Turystyki",
    "Nowacka": "Minister Edukacji",
    "Wieczorek": "Minister Nauki",
    "Kotula": "Minister do spraw Równości",
    "Biejat": "Wicemarszałek Senatu (oops, Senat)",
    "Dziemianowicz-Bąk": "Minister Rodziny, Pracy i Polityki Społecznej",
    "Pełczyńska-Nałęcz": "Minister Funduszy i Polityki Regionalnej",
    "Paszyk": "Minister Rozwoju i Technologii",
    "Lasek": "Pełnomocnik Rządu do spraw CPK"
}

def update_roles():
    db = SessionLocal()
    try:
        logging.info("Updating Government/Parliamentary Roles...")
        
        for last_name, role in ROLES.items():
            # Find MP
            # Specific targeting
            if last_name == "Hołownia":
                mp = db.query(MP).filter(MP.last_name == "Hołownia", MP.first_name == "Szymon", MP.term == 10).first()
            elif last_name == "Bosak":
                mp = db.query(MP).filter(MP.last_name == "Bosak", MP.first_name == "Krzysztof", MP.term == 10).first()
            elif last_name == "Sikorski":
                mp = db.query(MP).filter(MP.last_name == "Sikorski", MP.first_name == "Radosław", MP.term == 10).first()
            elif last_name == "Bodnar":
                # Adam Bodnar is Senator, not MP. Izabela Bodnar is MP. 
                # Izabela is NOT the Minister. Skip Bodnar key to avoid confusion.
                logging.info("Skipping Bodnar (Adam is Senator/Minister, Izabela is MP/Not Minister)")
                mp = None
            elif last_name == "Pełczyńska-Nałęcz":
                # Not an MP
                logging.info("Skipping Pełczyńska-Nałęcz (Not an MP)")
                mp = None
            elif last_name == "Kołodziejczak":
                mp = db.query(MP).filter(MP.last_name == last_name, MP.first_name == "Michał", MP.term == 10).first()
            elif last_name == "Gajewska":
                mp = db.query(MP).filter(MP.last_name == last_name, MP.first_name == "Aleksandra", MP.term == 10).first()
            elif last_name == "Wieczorek":
                 mp = db.query(MP).filter(MP.last_name == last_name, MP.first_name == "Dariusz", MP.term == 10).first()
            elif last_name == "Niedziela":
                mp = db.query(MP).filter(MP.last_name == last_name, MP.term == 10).first()
            else:
                mps = db.query(MP).filter(MP.last_name == last_name, MP.term == 10).all()
                if len(mps) > 1:
                    logging.info(f"⚠️ Multiple MPs found for {last_name}: {[m.first_name for m in mps]}. Skipping.")
                    continue
                mp = mps[0] if mps else None
            
            if mp:
                logging.info(f"✅ Assigning '{role}' to {mp.first_name} {mp.last_name}")
                
                # Check if stat exists
                stat = db.query(MPStat).filter(MPStat.mp_id == mp.id, MPStat.stat_key == "function_gov").first()
                if not stat:
                    stat = MPStat(mp_id=mp.id, stat_key="function_gov", stat_value=role)
                    db.add(stat)
                else:
                    stat.stat_value = role
            else:
                logging.info(f"❌ MP not found: {last_name}")
        
        db.commit()
        logging.info("Done.")

    finally:
        db.close()

if __name__ == "__main__":
    import sys
    import os
    # Add backend path to sys.path
    sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
    update_roles()
