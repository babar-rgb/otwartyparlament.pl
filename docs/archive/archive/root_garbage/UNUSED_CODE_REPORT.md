# 🧹 Raport: Co można usunąć?

W związku z migracją na Self-Hosted, wiele plików stało się zbędnych. Oto lista kandydatów do usunięcia.

## 1. Skrypty Konfiguracji Chmury (`scripts/`)
Te skrypty zostały przeniesione do `archive/legacy_2025/`.

## 2. Pliki Tymczasowe i Debuggowania
Debugi i testy manualne zostały przeniesione do `archive/legacy_2025/`.

## 3. Stare Importy (Legacy)
Te skrypty są zastępowane przez nowoczesny moduł `backend.etl.incremental`. Można je bezpiecznie zarchiwizować:

- `etl_sejm.py` (stara wersja, zastąpiona przez backend/etl/sejm.py)
- `etl_europarl.py` (stara wersja)
- `import_votes.py` (zastąpione przez Incremental ETL)
- `import_mps.py` (zastąpione przez Incremental ETL)
- `import_mps_term9.py` (dotyczy starej kadencji, jeśli nie potrzebujesz 9. kadencji, archiwizuj)
- `script/etl_speeches.py` (stara wersja)
- `script/etl_legislation.py` (stara wersja)

### Skrypty, które WARTO ZACHOWAĆ (używane w DATA_FLOW.md):
- `import_interpellations.py`
- `import_transcripts.py`
- `import_bills.py` (chyba że `fetch_sejm_prints.py` to zastępuje w pełni)

## 4. Tymczasowe Pliki Danych (`*.json`)
Przeniesione do `archive/data_dumps/`.

---

### ⚠️ Zalecenie
Wykonaj drugą turę czyszczenia (Legacy ETL).

```bash
# Archiwizacja starych wersji ETL
mv scripts/etl_sejm.py scripts/etl_europarl.py scripts/import_votes.py scripts/import_mps.py scripts/import_mps_term9.py scripts/etl_speeches.py scripts/etl_legislation.py scripts/archive/legacy_2025/
```
