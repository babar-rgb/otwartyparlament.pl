from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.poza_kadrem import PozaKadrem

router = APIRouter()

@router.get("/")
def lista_raportow(db: Session = Depends(get_db)):
    """Pobiera listę wszystkich raportów śledczych"""
    return db.query(PozaKadrem).all()

@router.get("/{raport_id}")
def szczegoly_raportu(raport_id: str, db: Session = Depends(get_db)):
    """Pobiera pełne dane konkretnego raportu"""
    wynik = db.query(PozaKadrem).filter(PozaKadrem.id == raport_id).first()
    if not wynik:
        raise HTTPException(status_code=404, detail="Nie znaleziono raportu w archiwum Poza Kadrem")
    return wynik

@router.post("/aktualizuj-baze-demo")
def seed_poza_kadrem(db: Session = Depends(get_db)):
    """Zasila bazę danymi początkowymi (Kobalt i Edukacja)"""
    db.query(PozaKadrem).delete()
    
    raporty = [
        PozaKadrem(
            id="kobalt",
            tytul="ANALIZA ŁAŃCUCHA DOSTAW KOBALTU",
            podtytul="RAPORT 01 / 2026",
            okladka="brain/0ad6d0e8-294a-4318-bca4-9f5af2ac0597/kobalt_mine_brutalism_1778603263113.png",
            struktura_json={
                "spis_tresci": [
                    {"id": "sec-1", "label": "GENEZA I TRANSFORMACJA ENERGETYCZNA"},
                    {"id": "sec-2", "label": "MECHANIZMY REGULACYJNE UE"},
                    {"id": "sec-3", "label": "RZECZYWISTOŚĆ WYDOBYWCZA (DR KONGA)"},
                    {"id": "sec-4", "label": "UZALEŻNIENIE GEOPOLITYCZNE I WNIOSKI"}
                ],
                "sekcje": [
                    {"id": "sec-1", "tytul": "01 / GENEZA", "tekst": "Porozumienie Paryskie wyznaczyło kierunek. Dekarbonizacja transportu stała się priorytetem."},
                    {"id": "sec-2", "tytul": "02 / REGULACJA", "tekst": "Pakiet \"Fit for 55\" przyspieszył popyt na baterie."},
                    {"id": "sec-3", "tytul": "03 / FAKTY", "tekst": "70% kobaltu pochodzi z Konga. Analiza 1420 dokumentów wykazuje nieprawidłowości."},
                    {"id": "sec-4", "tytul": "04 / WNIOSKI", "tekst": "Uzależnienie od Rosji zamieniamy na uzależnienie od Chin."}
                ],
                "drugi_plan": {
                    "tytul": "DRUGI PLAN",
                    "opis": "Zestawienie oficjalnych kampanii UE z rzeczywistością kopalń.",
                    "obrazek": "brain/0ad6d0e8-294a-4318-bca4-9f5af2ac0597/kobalt_mine_brutalism_1778603263113.png"
                }
            }
        ),
        PozaKadrem(
            id="edukacja",
            tytul="REFORMA SZKOLNICTWA: MODERNIZACJA CZY FASADA?",
            podtytul="RAPORT 02 / 2026",
            okladka="https://images.unsplash.com/photo-1503676260728-1c00da096a0b?q=80&w=1200&auto=format&fit=crop",
            struktura_json={
                "spis_tresci": [
                    {"id": "sec-1", "label": "GENEZA: CYFROWA SZKOŁA 2026"},
                    {"id": "sec-2", "label": "MECHANIZMY: ZMIANY PROGRAMOWE"},
                    {"id": "sec-3", "label": "FAKTY: KRYZYS KADROWY"},
                    {"id": "sec-4", "label": "WNIOSKI: KOSZT ZMIANY"}
                ],
                "sekcje": [
                    {"id": "sec-1", "tytul": "01 / GENEZA", "tekst": "Rządowy program \"Cyfrowa Szkoła 2026\" zakładał pełną digitalizację."},
                    {"id": "sec-2", "tytul": "02 / REGULACJA", "tekst": "Nowelizacja ustawy wprowadziła cięcia w podstawie programowej."},
                    {"id": "sec-3", "tytul": "03 / FAKTY", "tekst": "W Polsce brakuje obecnie 20 000 nauczycieli."},
                    {"id": "sec-4", "tytul": "04 / WNIOSKI", "tekst": "Inwestycje w sprzęt dominują nad inwestycją w ludzi."}
                ],
                "drugi_plan": {
                    "tytul": "DRUGI PLAN",
                    "opis": "Wizja cyfrowej szkoły vs rzeczywistość wakatów.",
                    "obrazek": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=500&auto=format&fit=crop"
                }
            }
        )
    ]
    
    db.add_all(raporty)
    db.commit()
    return {"status": "sukces", "wiadomosc": "Archiwum Poza Kadrem zostało zasilone danymi."}
