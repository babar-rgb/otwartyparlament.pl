import sys
import json
import re
from pathlib import Path
from sqlalchemy import func
from collections import Counter

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from backend.core.orm_db import SessionLocal
from backend.models import MP, Interpellation, MPStat, InterpellationAuthor

def calculate_badges():
    db = SessionLocal()
    try:
        print("Fetching Data for Badges...")
        mps = db.query(MP).filter(MP.active == True).all()
        
        # Pre-fetch interpellations using the many-to-many link
        # Join InterpellationAuthor to get mp_id
        print("Loading interpellations via authors...")
        results = db.query(Interpellation, InterpellationAuthor.mp_id)\
                    .join(InterpellationAuthor, Interpellation.id == InterpellationAuthor.interpellation_id)\
                    .all()
        
        interpellation_map = {}
        for interpellation, mp_id in results:
            if mp_id not in interpellation_map:
                interpellation_map[mp_id] = []
            interpellation_map[mp_id].append(interpellation)
            
        # Define Keyword Sets for Expertise
        EXPERTISE_KEYWORDS = {
            "Ekspert Energetyki": ["energia", "prąd", "węgiel", "atom", "oze", "elektrownia", "gaz", "paliw"],
            "Ekspert Podatkowy": ["podatek", "vat", "pit", "cit", "akcyza", "skarbow", "ryczałt"],
            "Ekspert Infrastruktury": ["droga", "kolej", "pkp", "autostrada", "obwodnica", "transport", "most"],
            "Ekspert Rolnictwa": ["rolni", "zboż", "wieś", "arimr", "krus", "trzoda", "susza"],
            "Ekspert Zdrowia": ["szpital", "lekarz", "nfz", "medyc", "lek", "pacjent", "zdrowi"]
        }
        
        # Define Confrontational Keywords
        CONFRONTATION_KEYWORDS = ["afera", "niegospodarność", "skandal", "wyjaśnienie", "kontrola", "nieprawidłowość", "nadużycie"]

        stats_to_add = []
        
        # Clear old badges
        db.query(MPStat).filter(MPStat.stat_key.like("badge_%")).delete()
        
        print(f"Analyzing {len(mps)} MPs...")
        
        for mp in mps:
            mp_interpellations = interpellation_map.get(mp.id, [])
            
            # 1. Badge: Prymus Głosowań (Attendance > 98%)
            if mp.stats_attendance and mp.stats_attendance >= 98.0:
                stats_to_add.append(MPStat(
                    mp_id=mp.id,
                    stat_key="badge_attendance_pride",
                    stat_value=json.dumps({
                        "label": "Prymus Głosowań",
                        "description": "Obecność na głosowaniach powyżej 98%.",
                        "value": f"{mp.stats_attendance}%"
                    })
                ))
                
            # 2. Badge: Buntownik (Rebellion > 5%)
            # Assumption: stats_rebellion is an integer count or percentage? 
            # Model says Integer. Let's assume it's count for now, need total votes to calc %.
            # If it's count, we can't easily do %, relying on pre-calc or skipping for now if logic unclear.
            # Let's assume if it's > 20 votes against club.
            if mp.stats_rebellion and mp.stats_rebellion > 15:
                 stats_to_add.append(MPStat(
                    mp_id=mp.id,
                    stat_key="badge_rebel",
                    stat_value=json.dumps({
                        "label": "Niezależny",
                        "description": "Często głosuje inaczej niż klub.",
                        "value": f"{mp.stats_rebellion} razy"
                    })
                ))

            # 3. Badge: Aktywność Lokalna
            # Simple heuristic: Check if 'district' name appears in topics
            district_name = mp.district.split(" ")[0] if mp.district else "" # First word often city
            local_count = 0
            if district_name and len(district_name) > 3:
                for i in mp_interpellations:
                    if i.title and district_name.lower() in i.title.lower():
                        local_count += 1
            
            if local_count >= 3:
                 stats_to_add.append(MPStat(
                    mp_id=mp.id,
                    stat_key="badge_local_focus",
                    stat_value=json.dumps({
                        "label": "Lokalny Patriota",
                        "description": f"Często interweniuje w sprawach okręgu ({district_name}).",
                        "value": f"{local_count} interpelacji"
                    })
                ))

            # 4. Badge: Specjalizacja Sektorowa
            titles_text = " ".join([i.title.lower() for i in mp_interpellations if i.title])
            for category, keywords in EXPERTISE_KEYWORDS.items():
                match_count = sum(1 for kw in keywords if kw in titles_text)
                # Heuristic: If meaningful number of matches relative to total activity
                if match_count > 5 and len(mp_interpellations) > 0:
                     stats_to_add.append(MPStat(
                        mp_id=mp.id,
                        stat_key="badge_expert",
                        stat_value=json.dumps({
                            "label": category,
                            "description": f"Wysoka aktywność w tematyce: {category.split(' ')[1]}.",
                            "value": f"Słowa kluczowe wykryte {match_count} razy"
                        })
                    ))
                    
            # 5. Badge: Konfrontacyjny
            confrontation_count = sum(1 for kw in CONFRONTATION_KEYWORDS if kw in titles_text)
            if confrontation_count > 5:
                  stats_to_add.append(MPStat(
                    mp_id=mp.id,
                    stat_key="badge_confrontational",
                    stat_value=json.dumps({
                        "label": "Śledczy",
                        "description": "Zadaje trudne pytania o nieprawidłowości.",
                        "value": f"{confrontation_count} interpelacji kontrolnych"
                    })
                ))
            
            # 6. Badge: Inactive (Niska aktywność)
            if len(mp_interpellations) == 0 and mp.active:
                 # Check term length? If term just started, don't badge. 
                 # Assuming term is ongoing.
                 # Check speeches too? Don't have them easily here yet.
                 # Let's be gentle.
                 pass

        print(f"Assigning {len(stats_to_add)} badges...")
        db.add_all(stats_to_add)
        db.commit()
        print("Done.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    calculate_badges()
