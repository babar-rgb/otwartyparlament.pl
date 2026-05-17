"""
articles_seed.py — Jednorazowy skrypt migracji artykułów z main.js do SQLite.

Uruchomienie (z katalogu głównego projektu):
    python -m backend.services.articles_seed

Skrypt jest idempotentny: jeśli artykuł z danym slug już istnieje, pomija go.
"""

import sys
import os

# Dodaj katalog główny projektu do ścieżki, żeby importy działały
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.core.database import SessionLocal, engine, Base
from backend.models.article import Article

# Upewnij się że tabela istnieje
Base.metadata.create_all(bind=engine)

# -----------------------------------------------------------------------
# DANE ŹRÓDŁOWE — skopiowane z frontend/js/main.js (linie 26-142)
# Po pomyślnej migracji te dane zostaną usunięte z main.js.
# -----------------------------------------------------------------------
ARTICLES_DATA = [
    {
        "slug": "manifesto",
        "category": "MISJA",
        "image": "https://images.unsplash.com/photo-1555848962-6e79363ec58f?q=80&w=500&auto=format&fit=crop",
        "date": "MAJ 2026",
        "title": "Warstwa Prawdy: Informuj bez rujnowania dnia.",
        "excerpt": "Demokracja to nie tylko emocje, to przede wszystkim dane. Naszym celem jest dostarczenie Ci surowych faktów w sposób spokojny i prestiżowy.",
        "votes_yes": 460,
        "votes_no": 0,
        "verdict": "MISJA PRZYJĘTA",
        "results_json": [
            {"name": "PRAWO I SPRAWIEDLIWOŚĆ", "yes": 190, "no": 0, "abstain": 0},
            {"name": "KOALICJA OBYWATELSKA", "yes": 157, "no": 0, "abstain": 0},
            {"name": "POLSKA 2050 - TRZECIA DROGA", "yes": 33, "no": 0, "abstain": 0},
            {"name": "PSL - TRZECIA DROGA", "yes": 32, "no": 0, "abstain": 0},
            {"name": "LEWICA", "yes": 26, "no": 0, "abstain": 0},
            {"name": "KONFEDERACJA", "yes": 18, "no": 0, "abstain": 0},
            {"name": "KUKIZ'15", "yes": 4, "no": 0, "abstain": 0},
            {"name": "WOLNI REPUBLIKANIE", "yes": 4, "no": 0, "abstain": 0},
            {"name": "KOŁO POSŁÓW RAZEM", "yes": 5, "no": 0, "abstain": 0},
            {"name": "NIEZRZESZENI", "yes": 1, "no": 0, "abstain": 0},
        ],
    },
    {
        "slug": "border-law",
        "category": "BEZPIECZEŃSTWO",
        "image": "https://images.unsplash.com/photo-1555848960-8c3ed4cf32a0?q=80&w=500&auto=format&fit=crop",
        "date": "10 MAJA 2026",
        "title": "Kto ma prawo pociągnąć za spust?",
        "excerpt": "Sejm przyjął ustawę o wsparciu działań żołnierzy na granicy. Nowe przepisy zmieniają zasady użycia broni w sytuacjach zagrożenia życia, co budzi skrajne emocje wśród prawników i obrońców praw człowieka.",
        "votes_yes": 231,
        "votes_no": 189,
        "verdict": "PRZYJĘTO",
        "results_json": [
            {
                "name": "KOALICJA OBYWATELSKA", "yes": 155, "no": 1, "abstain": 1,
                "rebels": [
                    {"id": "sterczewski", "name": "F. Sterczewski", "vote": "PRZECIW", "photo": "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png"},
                    {"id": "zielinska", "name": "U. Zielińska", "vote": "WSTRZYMAŁA SIĘ", "photo": "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png"},
                ]
            },
            {
                "name": "PRAWO I SPRAWIEDLIWOŚĆ", "yes": 12, "no": 168, "abstain": 10,
                "rebels": [
                    {"id": "macierewicz", "name": "A. Macierewicz", "vote": "ZA", "photo": "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png"},
                ]
            },
            {"name": "POLSKA 2050 - TRZECIA DROGA", "yes": 33, "no": 0, "abstain": 0},
            {"name": "PSL - TRZECIA DROGA", "yes": 32, "no": 0, "abstain": 0},
            {
                "name": "LEWICA", "yes": 15, "no": 11, "abstain": 0,
                "rebels": [
                    {"id": "biejat", "name": "M. Biejat", "vote": "PRZECIW", "photo": "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png"},
                ]
            },
            {"name": "KONFEDERACJA", "yes": 0, "no": 18, "abstain": 0},
            {"name": "KUKIZ'15", "yes": 4, "no": 0, "abstain": 0},
            {"name": "WOLNI REPUBLIKANIE", "yes": 4, "no": 0, "abstain": 0},
            {"name": "KOŁO POSŁÓW RAZEM", "yes": 0, "no": 5, "abstain": 0},
            {"name": "NIEZRZESZENI", "yes": 1, "no": 0, "abstain": 0},
        ],
    },
    {
        "slug": "energy-prices",
        "category": "FINANSE",
        "image": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=500&auto=format&fit=crop",
        "date": "08 MAJA 2026",
        "title": "Ile kosztuje Twoja kawa?",
        "excerpt": "Posłowie zdecydowali o przedłużeniu zamrożenia cen energii dla gospodarstw domowych do końca roku. To decyzja, która bezpośrednio dotknie portfela każdego obywatela, stabilizując koszty utrzymania w dobie inflacji.",
        "votes_yes": 412,
        "votes_no": 15,
        "verdict": "PRZYJĘTO",
        "results_json": [
            {"name": "PRAWO I SPRAWIEDLIWOŚĆ", "yes": 170, "no": 0, "abstain": 20},
            {"name": "KOALICJA OBYWATELSKA", "yes": 157, "no": 0, "abstain": 0},
            {"name": "POLSKA 2050 - TRZECIA DROGA", "yes": 33, "no": 0, "abstain": 0},
            {"name": "PSL - TRZECIA DROGA", "yes": 32, "no": 0, "abstain": 0},
            {"name": "LEWICA", "yes": 26, "no": 0, "abstain": 0},
            {"name": "KONFEDERACJA", "yes": 5, "no": 13, "abstain": 0},
            {"name": "KUKIZ'15", "yes": 4, "no": 0, "abstain": 0},
            {"name": "NIEZRZESZENI", "yes": 1, "no": 0, "abstain": 0},
        ],
    },
    {
        "slug": "justice-reform",
        "category": "SĄDOWNICTWO",
        "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=500&auto=format&fit=crop",
        "date": "05 MAJA 2026",
        "title": "Czy sędzia jest sędzią?",
        "excerpt": "Projekt ustawy o statusie neosędziów został odrzucony w pierwszym czytaniu. Spór o praworządność wkracza w fazę impasu, pozostawiając tysiące wyroków w stanie niepewności prawnej.",
        "votes_yes": 190,
        "votes_no": 245,
        "verdict": "ODRZUCONO",
        "results_json": [
            {"name": "KOALICJA OBYWATELSKA", "yes": 157, "no": 0, "abstain": 0},
            {"name": "PRAWO I SPRAWIEDLIWOŚĆ", "yes": 0, "no": 190, "abstain": 0},
            {"name": "POLSKA 2050 - TRZECIA DROGA", "yes": 33, "no": 0, "abstain": 0},
            {"name": "PSL - TRZECIA DROGA", "yes": 32, "no": 0, "abstain": 0},
            {"name": "LEWICA", "yes": 0, "no": 26, "abstain": 0},
            {"name": "KONFEDERACJA", "yes": 0, "no": 18, "abstain": 0},
            {"name": "KUKIZ'15", "yes": 0, "no": 4, "abstain": 0},
            {"name": "WOLNI REPUBLIKANIE", "yes": 0, "no": 4, "abstain": 0},
            {"name": "NIEZRZESZENI", "yes": 0, "no": 1, "abstain": 0},
        ],
    },
    {
        "slug": "edukacja-investigation",
        "category": "EDUKACJA",
        "image": "https://images.unsplash.com/photo-1503676260728-1c00da096a0b?q=80&w=500&auto=format&fit=crop",
        "date": "12 MAJA 2026",
        "title": "Reforma Szkolnictwa: Modernizacja czy fasada?",
        "excerpt": 'Śledztwo w sprawie programu "Cyfrowa Szkoła 2026" oraz narastającego kryzysu kadrowego w polskich placówkach oświatowych.',
        "votes_yes": 231,
        "votes_no": 220,
        "verdict": "W TOKU",
        "results_json": [],
    },
]


def seed():
    db = SessionLocal()
    added = 0
    skipped = 0

    try:
        for data in ARTICLES_DATA:
            exists = db.query(Article).filter(Article.slug == data["slug"]).first()
            if exists:
                print(f"  [POMINIĘTO]  '{data['slug']}' — już istnieje w bazie.")
                skipped += 1
                continue

            article = Article(**data)
            db.add(article)
            print(f"  [DODANO]     '{data['slug']}' — {data['title'][:50]}")
            added += 1

        db.commit()
        print(f"\n✅ Migracja zakończona: {added} dodano, {skipped} pominięto.")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Błąd migracji: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print(">>> Migracja artykułów: main.js → SQLite\n")
    seed()
