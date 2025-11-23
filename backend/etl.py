import requests
import schedule
import time
from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from . import models

# Sejm API endpoints (examples)
SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

def fetch_mps():
    print("Fetching MPs...")
    # Real implementation would hit: f"{SEJM_API_URL}/MP"
    # For now, let's seed some dummy data if empty
    db = SessionLocal()
    if db.query(models.MP).count() == 0:
        mps_data = [
            {"first_name": "Jan", "last_name": "Kowalski", "club": "KO", "district": "Warszawa", "photo_url": "https://api.sejm.gov.pl/sejm/term10/MP/1/photo"},
            {"first_name": "Anna", "last_name": "Nowak", "club": "PiS", "district": "Kraków", "photo_url": "https://api.sejm.gov.pl/sejm/term10/MP/2/photo"},
            {"first_name": "Piotr", "last_name": "Wiśniewski", "club": "Lewica", "district": "Gdańsk", "photo_url": "https://api.sejm.gov.pl/sejm/term10/MP/3/photo"},
        ]
        for mp_data in mps_data:
            mp = models.MP(**mp_data)
            db.add(mp)
        db.commit()
        print("Seeded MPs.")
    else:
        print("MPs already exist.")
    db.close()

def fetch_votes():
    print("Fetching Votes...")
    db = SessionLocal()
    if db.query(models.Vote).count() == 0:
        # Seed dummy votes
        import datetime
        votes_data = [
            {"date": datetime.date(2023, 11, 13), "title": "Głosowanie nad wyborem Marszałka Sejmu", "topic": "Polityka", "importance": 10, "kind": "Głosowanie personalne"},
            {"date": datetime.date(2023, 11, 14), "title": "Ustawa o finansowaniu in vitro", "topic": "Zdrowie", "importance": 8, "kind": "Ustawa"},
        ]
        for vote_data in votes_data:
            vote = models.Vote(**vote_data)
            db.add(vote)
        db.commit()
        print("Seeded Votes.")
    else:
        print("Votes already exist.")
    db.close()

def run_etl():
    fetch_mps()
    fetch_votes()

if __name__ == "__main__":
    # Run once immediately
    run_etl()
    
    # Schedule daily
    schedule.every().day.at("06:00").do(run_etl)
    
    while True:
        schedule.run_pending()
        time.sleep(1)
