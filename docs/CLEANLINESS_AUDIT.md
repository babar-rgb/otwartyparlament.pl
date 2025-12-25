# 🧹 Profesjonalny Audyt Czystości Projektu

**Data:** 2025-12-25
**Cel:** Identyfikacja zbędnego kodu i propozycja reorganizacji struktury.

---

## 📊 Podsumowanie Stanu Obecnego

Projekt przeszedł znaczną migrację na Self-Hosted Postgres.
- **Katalog Główny**: Czysty (tylko konfiguracja i docs).
- **Backend (`/backend`)**: Czysty, nowoczesny kod Python.
- **Frontend (`/src`)**: Czysty kod React/Vite.
- **Skrypty (`/scripts`)**: 🚨 **Główny problem**. Zawiera 120+ luźnych plików, mieszając kluczowe narzędzia z jednorazowymi skryptami naprawczymi.

---

## 🛑 KATEGORIA 1: "Martwe" lub Jednorazowe Skrypty (Do Archiwizacji)

Te skrypty spełniły już swoje zadanie (np. jednorazowe naprawy, migracje, testy hipotez). Utrzymywanie ich w głównym folderze zaciemnia obraz.

| Plik | Powód Archiwizacji |
|------|--------------------|
| `apply_migration_euro*.py` | Migracje zakończone. |
| `apply_backend_fixes.py` | Jednorazowy fix. |
| `check_*.py` (ok. 20 plików) | Skrypty "sprawdzające" (np. `check_mp.py`). Warto zostawić tylko `master_data_audit.py`. |
| `debug_*.py` (jeśli jakieś zostały) | Kod debugujący. |
| `fix_db_encoding.py` | Naprawa wykonana. |
| `force_delete.py` | Niebezpieczne narzędzie ręczne. |
| `hydrate_missing_tables.py` | Inicjalizacja wykonana. |
| `migrate_*.py` | Migracje zakończone. |
| `setup_*.py` | Konfiguracja zakończona. |

**Zalecenie:** Przenieść do `archive/legacy_scripts/`.

---

## 🛠️ KATEGORIA 2: Kod Użyteczny, ale "Bałaganiarski" (Do Reorganizacji)

Te skrypty są cenne, ale nie powinny leżeć luzem w `scripts/`. Zalecam je pogrupować w podfoldery.

### A. Analityka & AI (`scripts/analysis/`)
- `analyze_speech.py`
- `classify_votes.py`
- `cluster_votes.py`
- `generate_ai_analysis.py`
- `vote_intelligence.py`
- `semantic_expansion.py`

### B. Import & Web Scraping (`scripts/import/`)
- `import_interpellations.py` (Kluczowy skrypt!)
- `import_transcripts.py` (Kluczowy skrypt!)
- `scrape_declarations_pdfs.py`
- `fetch_sejm_prints.py`

### C. Raporty & Audyty (`scripts/reports/`)
- `audit_runner.py`
- `master_data_audit.py`
- `monitor_data_quality.py`

---

## ✅ KATEGORIA 3: Core (Zostawić w `scripts/` lub przenieść do `backend/`)

To są skrypty krytyczne, używane w cronie lub dokumentacji.

1.  `db_backup.sh`
2.  `db_restore.sh`
3.  `db_migrate.sh`

*(Opcjonalnie: skrypty importowe jak `import_interpellations.py` mogą zostać w `scripts/` dla łatwego dostępu, jeśli są często uruchamiane ręcznie).*

---

## 🚀 Plan Naprawczy (Action Plan)

1.  **Archiwizacja (Wave 3)**: Usunięcie skryptów `check_`, `fix_`, `migrate_` (które są już niepotrzebne).
2.  **Strukturyzacja**: Stworzenie folderów `scripts/analysis`, `scripts/import` i przeniesienie tam odpowiednich plików.
3.  **Wynik**: W `scripts/` zostanie ok. 5-10 najważniejszych plików, reszta będzie ładnie poukładana tematycznie.

**Czy mam przystąpić do realizacji tego planu?**
