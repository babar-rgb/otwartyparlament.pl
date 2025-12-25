# 🪞 Autokrytyka: Rozszczepienie Bazy Danych

**Data**: 2025-12-25
**Znalezisko**: Krytyczna niespójność architektoniczna.

## Diagnoza
Mamy obecnie **dwie różne bazy danych** działające równolegle:
1.  **PostgreSQL** (Główna): Używana przez ETL (pobieranie danych) oraz Frontend (przez PostgREST).
2.  **SQLite** (`sejm.db`): Używana przez Python API (`fastapi` w `backend/main.py`).

**Dowód**:
Plik `backend/core/orm_db.py` (używany przez API) ma na sztywno wpisane:
```python
SQLALCHEMY_DATABASE_URL = "sqlite:///./sejm.db"
```
Podczas gdy `backend/core/db.py` (używany przez ETL) czyta config `.env` (Postgres).

## Skutek
Jeśli uruchomisz `backend/main.py` (FastAPI), zwróci on **puste dane** (lub stare z pliku `sejm.db`), mimo że ETL właśnie pobrał gigabajty danych do Postgresa.
To klasyczny "Brain Split".

## Plan Naprawczy
Należy natychmiast przepisać `backend/core/orm_db.py`, aby korzystał z tej samej konfiguracji co reszta systemu (Postgres).
Wtedy API i ETL będą widzieć te same dane.
