# 🕵️ Audyt Wewnętrzny Folderów

Przejrzałem zawartość folderów `src/`, `backend/` i `scripts/`. Oto wnioski:

## 1. Frontend (`src/`) - ✅ WZOROWY
Struktura jest bardzo czysta:
- `components/` - komponenty UI.
- `pages/` - widoki.
- `hooks/`, `context/`, `lib/` - logika.
- Pojedyncze pliki (`App.tsx`, `main.tsx`) są tam, gdzie powinny być.

## 2. Backend (`backend/`) - 🆗 DOBRY
Głównie podzielony na moduły (`core`, `etl`, `services`).
- Pojedyncze pliki: `models.py`, `database.py` - to standard w małych aplikacjach FastAPI/Python. Nie ruszałbym tego na siłę.

## 3. Skrypty (`scripts/`) - ⚠️ WYMAGA DALSZEGO SPRZĄTANIA
Mimo pierwszego czyszczenia, nadal jest tu tłoczno. 
Zauważyłem grupę plików `etl_*.py` (np. `etl_committees.py`, `etl_content.py`) oraz skrypty weryfikujące.

**Propozycja Deep Clean:**
1.  Stworzyć folder **`scripts/etl_legacy/`** (lub `operations`) i przenieść tam wszystkie luźne `etl_*.py`.
2.  Stworzyć folder **`scripts/verification/`** i przenieść tam `verify_*.py`.
3.  Stworzyć folder **`scripts/maintenance/`** dla `calculate_*.py`, `nightly_*.py`.

Dzięki temu w `scripts/` zostaną tylko 3-4 pliki (głównie te startowe, jeśli ich nie przeniosłeś).

Czy mam wykonać to ostateczne grupowanie w `scripts/`?
