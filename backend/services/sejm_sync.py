import requests
from sqlalchemy.orm import Session
from backend.models.mp import MP
from backend.models.vote import Vote
from backend.models.mp_vote import MPVote
from backend.core.database import SessionLocal
from datetime import datetime

SEJM_API_BASE = "https://api.sejm.gov.pl/sejm/term10"

class SejmSyncService:
    def __init__(self, db: Session):
        self.db = db

    def sync_mps(self):
        print(">>> Synchronizacja posłów...")
        response = requests.get(f"{SEJM_API_BASE}/MP")
        if response.status_code != 200: return

        mps_data = response.json()
        for m in mps_data:
            full_name = f"{m.get('firstName')} {m.get('lastName')}"
            mp = MP(
                id=m.get('id'),
                first_name=m.get('firstName'),
                last_name=m.get('lastName'),
                name=full_name,
                club=m.get('club'),
                photo_url=f"{SEJM_API_BASE}/MP/{m.get('id')}/photo",
                active=True
            )
            self.db.merge(mp)
        self.db.commit()
        print(f"Zsynchronizowano {len(mps_data)} posłów.")

    def sync_votings(self, limit_votings=20):
        print(">>> Synchronizacja głosowań i głosów poszczególnych posłów...")
        # 1. Szukamy ostatniego posiedzenia
        resp = requests.get(f"{SEJM_API_BASE}/votings")
        if resp.status_code != 200: return
        
        sittings = resp.json()
        unique_proceedings = sorted(list({s.get('proceeding') for s in sittings if s.get('proceeding')}))
        last_sitting = unique_proceedings[-1]
        
        # 2. Pobieramy listę głosowań z tego posiedzenia
        v_resp = requests.get(f"{SEJM_API_BASE}/votings/{last_sitting}")
        if v_resp.status_code != 200: return
        
        votings = v_resp.json()
        # Bierzemy X ostatnich głosowań, żeby nie przeciążać bazy na start
        for v in votings[-limit_votings:]:
            v_num = v.get('votingNumber')
            vote_id = v_num + (last_sitting * 1000)
            v_date = v.get('date')
            clean_date = datetime.strptime(v_date.split('T')[0], "%Y-%m-%d").date()
            
            # Zapisujemy ogólne głosowanie
            vote = Vote(
                id=vote_id,
                date=clean_date,
                title=v.get('title'),
                verdict="PRZYJĘTO" if "przyjęto" in v.get('title', '').lower() else "NIE ROZSTRZYGNIĘTO",
                results_json={"yes": v.get('yes', 0), "no": v.get('no', 0), "abstain": v.get('abstain', 0)}
            )
            self.db.merge(vote)
            
            # 3. POBIERAMY DETALE (Kto jak głosował)
            details_resp = requests.get(f"{SEJM_API_BASE}/votings/{last_sitting}/{v_num}")
            if details_resp.status_code == 200:
                details = details_resp.json()
                for mp_v in details.get('votes', []):
                    # Zapisujemy indywidualny głos posła
                    m_vote = MPVote(
                        id=f"{mp_v.get('MP')}_{vote_id}",
                        mp_id=mp_v.get('MP'),
                        vote_id=vote_id,
                        choice=mp_v.get('vote')
                    )
                    self.db.merge(m_vote)
            
            print(f"  - Przetworzono głosowanie nr {v_num} (ID: {vote_id})")

        self.db.commit()
        print(f"Zakończono. Pobrano {limit_votings} głosowań i głosy wszystkich posłów.")

if __name__ == "__main__":
    db = SessionLocal()
    sync_service = SejmSyncService(db)
    sync_service.sync_mps()
    sync_service.sync_votings(limit_votings=50) # Zdejmujemy limit, żeby objąć wszystkie 39 głosowań
    db.close()
