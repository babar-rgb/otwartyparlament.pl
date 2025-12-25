# 🗂️ Przewodnik porukturze Skryptów

Po sprzątaniu, katalog `scripts/` został podzielony tematycznie:

- **`scripts/analysis/`**: Analiza AI, kategoryzacja, wzbogacanie danych (`enrich_`, `tag_`).
- **`scripts/etl/`**: Skrypty transformujące dane (`etl_`, `incremental_etl`).
- **`scripts/import/`**: Pobieranie danych (`download_`, `import_`, `fetch_`).
- **`scripts/maintenance/`**: Utrzymanie i cykliczne zadania (`nightly_`, `calculate_`, `cleanup_`).
- **`scripts/reports/`**: Audyty i inspekcje (`audit_`, `inspect_`, `gap_analysis`).
- **`scripts/verification/`**: Testy spójności (`verify_`, `check_`).
- **`scripts/` (Root)**: Tylko kluczowe skrypty operacyjne (backup, restore, scheduler).

Wszystkie stare i zbędne pliki trafiły do `archive/legacy_scripts/`.
