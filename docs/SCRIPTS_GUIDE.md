# Przewodnik po Skryptach i Operacjach

> Dokumentacja wszystkich skryptów w repozytorium (wersja PL).

---

## 🚀 Główne Operacje (Katalog Główny)

Skrypty służące do codziennego zarządzania serwerem.

| Skrypt | Komenda | Opis |
|--------|---------|------|
| **Start** | `./bin/start` | Uruchamia pełny stos: PostgreSQL Service → PostgREST → Vite. |
| **Stop** | `./bin/stop` | Zatrzymuje PostgREST i Docker Desktop. |
| **Dashboard** | `./bin/dashboard` | Otwiera konsolę zarządzania (`tmux`). |

---

## 📦 Migracja i Zarządzanie Bazą (`scripts/`)

Kluczowe skrypty do zarządzania serwerem produkcyjnym.

| Skrypt | Komenda | Opis |
|--------|---------|------|
| **db_backup.sh** | `./scripts/db_backup.sh` | Tworzy backup bazy danych (gzip). |
| **db_restore.sh** | `./scripts/db_restore.sh` | Przywraca bazę danych z backupu (kasuje istniejącą!). |
| **db_migrate.sh** | `./scripts/db_migrate.sh` | Automatyzuje proces migracji na nowy serwer. |

---

## ⚙️ Backend i ETL (`backend/`)

Nowoczesny kod w Pythonie, na którym opiera się aplikacja.

| Skrypt | Uruchomienie | Opis |
|--------|--------------|------|
| **Scheduler** | `python3 -m backend.services.scheduler` | Demon uruchamiający zadania o 06:00 i 14:00. |
| **Obsługa Bazy** | `backend/core/db.py` | Moduł łączący z bazą danych (Context Manager). |
| **Konfiguracja** | `backend/core/config.py` | Moduł czytający konfigurację z `.env`. |
| **ETL Sejm** | `backend/etl/incremental.py` | Pobieranie nowych danych z API Sejmu (posiedzenia, głosy). |
| **ETL Europarl** | `backend/etl/europarl.py` | Pobieranie danych z Parlamentu Europejskiego. |
| **ETL Heurystyka** | `backend/etl/heuristics.py` | Analiza głosowań przez AI (uproszczenia). |

---

## � Pełny Indeks Skryptów (`scripts/`)

Poniżej znajduje się kompletna lista wszystkich skryptów pomocniczych, prototypów i narzędzi legacy.

### 🔍 Audyt i Debuggowanie
Skrypty służące do jednorazowego sprawdzania stanu danych lub szukania błędów.

| Plik | Opis |
|------|------|
| `analyze_consistency.py` | Sprawdza spójność danych między tabelami. |
| `analyze_db_size.py` | Analizuje wielkość bazy danych. |
| `audit_data.py` | Ogólny audyt wierszy w tabelach. |
| `audit_env.py` | Sprawdza zmienne środowiskowe. |
| `audit_runner.py` | Uruchamia zestaw audytów. |
| `audit_search_logic.py` | Testuje logikę wyszukiwarki. |
| `audit_tables.py` | Sprawdza istnienie tabel kluczowych. |
| `audit_vote_results.py` | Weryfikuje poprawność wyników głosowań. |
| `audit_wealth_rankings.py` | Audyt danych o oświadczeniach majątkowych. |
| `check_db_tables.py` | Listuje tabele w bazie. |
| `check_euro_columns.py` | Sprawdza kolumny w tabelach Europarlamentu. |
| `check_euro_db.py` | Sprawdza połączenie z bazą pod kątem Europarlamentu. |
| `check_euro_results_count.py` | Liczy wyniki głosowań europosłów. |
| `check_interpellations_schema.py` | Walidacja schematu interpelacji. |
| `check_justice_votes.py` | Analiza głosowań dotyczących sądownictwa. |
| `check_linked_mps.py` | Sprawdza powiązania między posłami a partiami. |
| `check_missing_sittings.py` | Szuka brakujących numerów posiedzeń. |
| `check_morning_stats.py` | Raport poranny (statystyki). |
| `check_mp.py` | Sprawdza dane konkretnego posła. |
| `check_mps_data.py` | Weryfikacja kompletności danych posłów. |
| `check_public_access.py` | Sprawdza uprawnienia (RLS) do danych publicznych. |
| `check_schema.py` | Walidacja schematu bazy danych. |
| `check_speech_count.py` | Liczy przemówienia. |
| `check_speeches.py` | Weryfikuje tabelę przemówień. |
| `check_term_ids.py` | Sprawdza ID kadencji. |
| `check_votes_schema.py` | Walidacja tabeli głosowań. |
| `check_wealth_data.py` | Sprawdza dane o majątkach. |
| `comprehensive_audit.ts` | Skrypt TS do pełnego audytu (frontend). |
| `db_status.py` | Wyświetla status bazy. |
| `debug_*.py` (30+ plików) | **[Zarchiwizowany]** Skrypty do analizy konkretnych błędów. |
| `inspect_api.py` | Pomocniczy skrypt do podglądu odpowiedzi API Sejmu. |
| `inspect_declarations.py` | Inspekcja oświadczeń majątkowych. |
| `list_models.py` | Listuje modele LLM (jeśli używane). |
| `lookup_mp.py` | Wyszukiwanie posła po ID/Nazwisku. |
| `master_data_audit.py` | Główny skrypt audytujący dane bazowe. |
| `monitor_data_quality.py` | Monitoring jakości danych. |
| `verify_data.py` | Podstawowa weryfikacja danych. |
| `verify_env.py` | Weryfikacja zmiennych .env. |

### 📥 Import i ETL (Legacy)
Stare skrypty importujące, zastąpione w większości przez `backend/etl/`.

| Plik | Opis |
|------|------|
| `download_assets.py` | Pobiera zdjęcia posłów. |
| `download_declaration_pdfs.py` | Pobiera PDFy oświadczeń majątkowych. |
| `import_bills.py` | Import projektów ustaw. |
| `import_declarations.py` | Import oświadczeń majątkowych. |
| `import_interpellations.py` | Import interpelacji. |
| `import_transcripts.py` | Import stenogramów. |
| `quick_vote_results_etl.py` | Szybki import wyników głosowań. |
| ~~`etl_sejm.py`~~ | **[Zarchiwizowany]** Stara wersja głównego ETL. |
| ~~`etl_europarl.py`~~ | **[Zarchiwizowany]** Stara wersja ETL Europarlamentu. |
| ~~`etl_speeches.py`~~ | **[Zarchiwizowany]** Import przemówień. |
| ~~`etl_legislation.py`~~ | **[Zarchiwizowany]** Import procesów legislacyjnych. |
| ~~`import_mps.py`~~ | **[Zarchiwizowany]** Zastąpione przez Incremental ETL. |
| ~~`import_votes.py`~~ | **[Zarchiwizowany]** Zastąpione przez Incremental ETL. |
| ~~`sync_committees_to_supabase.py`~~ | **[Zarchiwizowany]** Synchronizacja składów komisji. |

### 🤖 AI i Analiza
Skrypty związane z przetwarzaniem języka naturalnego i ML.

| Plik | Opis |
|------|------|
| `analyze_speech.py` | Analiza sentymentu/treści przemówień. |
| `batch_analyze_speeches.py` | Masowa analiza przemówień. |
| `categorize_bills.py` | Kategoryzacja projektów ustaw. |
| `classify_votes.py` | Klasyfikacja głosowań (ML). |
| `cluster_votes.py` | Grupowanie głosowań tematycznie. |
| `expand_keywords.py` | Rozszerzanie słów kluczowych (synonimy). |
| `fill_topic_tag.py` | Przypisywanie tagów tematycznych. |
| `generate_ai_analysis.py` | Generowanie analiz AI. |
| `generate_heuristic_analysis*.py` | Różne wersje generowania podsumowań (expert, pro). |
| `generate_vote_analyses.py` | Generowanie analiz dla głosowań. |
| `humanize_laws.py` | Upraszczanie tekstów prawnych. |
| `keyword_map.py` | Mapa słów kluczowych. |
| `mine_search_phrases.py` | Wydobywanie fraz wyszukiwania. |
| `semantic_expansion.py` | Rozszerzanie semantyczne zapytań. |
| `simplify_titles*.py` | Skrypty do skracania tytułów ustaw. |
| `vote_intelligence.py` | Prototyp silnika inteligencji głosowań. |

### 🔧 Narzędzia Naprawcze (Fix)
Jednorazowe skrypty uruchamiane w celu naprawy błędnych danych.

| Plik | Opis |
|------|------|
| `apply_backend_fixes.py` | Aplikuje poprawki w backendzie. |
| `cleanup_bad_votes.py` | Usuwa uszkodzone rekordy głosowań. |
| `fix_db_encoding.py` | Naprawia kodowanie znaków w bazie. |
| `fix_interpellations.py` | Naprawia i pobiera brakującą treść interpelacji. |
| `fix_mp_attendance.py` | Przelicza statystyki obecności. |
| `fix_speech_mp_links.py` | Naprawia powiązania przemówienie-poseł. |
| `force_delete.py` | Wymuszone usuwanie rekordów. |
| `hydrate_missing_tables.py` | Uzupełnia puste tabele. |
| `nightly_cleaner.py` | Czyści bazę ze śmieci (uruchamiany w nocy). |
| `recalc_importance.py` | Przelicza wagi ważności głosowań. |
| `repair_vote_results.py` | Naprawia niespójne wyniki głosowań. |

---

> **Wskazówka**: Jeśli szukasz konkretnego skryptu, użyj `Ctrl+F` w tym dokumencie. Jeśli nie jesteś pewien, czy skrypt jest nadal potrzebny, sprawdź czy korzysta z `backend.core.*` (nowy standard) czy łączy się bezpośrednio z bazą (legacy).
