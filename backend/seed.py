import requests
from backend.main import SessionLocal, MP, Vote, engine, Base
from datetime import datetime

# URL API SEJMU
SEJM_API = "https://api.sejm.gov.pl/sejm/term10"

def clear_db():
    print("Czyszczenie bazy danych...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def seed_from_api():
    db = SessionLocal()
    
    # 1. POBIERANIE POSŁÓW
    print("Pobieranie posłów z Sejm API...")
    resp = requests.get(f"{SEJM_API}/MP")
    if resp.status_code == 200:
        mps_data = resp.json()
        for m in mps_data[:100]: # Na początek bierzemy 100 dla szybkości
            name = f"{m.get('firstName')} {m.get('lastName')}"
            mp = MP(
                id=m.get('id'),
                name=name,
                club=m.get('club'),
                photo_url=f"{SEJM_API}/MP/{m.get('id')}/photo",
                active=True
            )
            db.merge(mp)
        print(f"Zasilono bazę {len(mps_data[:100])} posłami.")
    
    # 2. POBIERANIE GŁOSOWAŃ (Ostatnie posiedzenie)
    print("Pobieranie ostatnich głosowań...")
    # Najpierw pobieramy listę posiedzeń, żeby znaleźć ostatnie
    resp = requests.get(f"{SEJM_API}/votings")
    if resp.status_code == 200:
        sittings = resp.json()
        if sittings:
            # Wyciągamy ostatni unikalny numer posiedzenia (proceeding)
            unique_proceedings = sorted(list({s.get('proceeding') for s in sittings if s.get('proceeding')}))
            sitting_num = unique_proceedings[-1]
            
            # Pobieramy głosowania z tego posiedzenia
            v_url = f"{SEJM_API}/votings/{sitting_num}"
            print(f"Pobieranie szczegółów z: {v_url}")
            v_resp = requests.get(v_url)
            
            if v_resp.status_code == 200:
                try:
                    votings = v_resp.json()
                    for v in votings[:20]: # Bierzemy 20 ostatnich
                        # Mapowanie werdyktu
                        verdict = "PRZYJĘTO" if "przyjęto" in v.get('title', '').lower() else "NIE ROZSTRZYGNIĘTO"
                        
                        v_date = v.get('date')
                        # Sejm API zwraca daty z milisekundami i Z, odcinamy to dla bezpieczeństwa
                        clean_date = v_date.split('T')[0]
                        
                        vote = Vote(
                            id=v.get('votingNumber') + (sitting_num * 1000), # Unikalny ID dla SQLite
                            date=datetime.strptime(clean_date, "%Y-%m-%d").date(),
                            title_clean=v.get('title'),
                            topic="SEJM",
                            verdict=verdict,
                            importance=5,
                            details_json={
                                "yes": v.get('yes', 0),
                                "no": v.get('no', 0)
                            }
                        )
                        db.merge(vote)
                    print(f"Dodano {len(votings[:20])} realnych głosowań z posiedzenia nr {sitting_num}.")
                except Exception as e:
                    print(f"Błąd przetwarzania JSON głosowań: {e}")
            else:
                print(f"Błąd API Sejmu (Głosowania): Status {v_resp.status_code}")

    db.commit()
    db.close()

if __name__ == "__main__":
    clear_db()
    seed_from_api()
