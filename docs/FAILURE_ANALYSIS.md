# Audyt Awarii Systemu (Post-Mortem)

## 1. Diagnoza Stanu (Co "jebło"?)

System posiada trzy krytyczne dziury, które doprowadziły do wyświetlania pustych rankingów i błędów w logach.

### A. Brak Danych Szczegółowych (Największy Problem)
Mimo że mamy w bazie listę 2000 głosowań (`votes`), **nie mamy ani jednego głosu posła** (`vote_results`).
- **Przyczyna**: Skrypt `incremental.py` pobiera tylko "nagłówki" głosowań (kto wygrał, ile głosów za), ale **nie wchodzi głębiej** w endpoint `/votings/{sitting}/{voting}`, który zwraca listę imienną.
- **Efekt**: Tabela `vote_results` jest pusta. Nie da się policzyć frekwencji ani buntu, bo dla systemu nikt nie głosował.

### B. Rozjazd Nazewnictwa (Schema Mismatch)
Kod analityczny (`stats.py`) i kod bazy danych używają różnych nazw dla tej samej kolumny:
- Baza danych (tabela `vote_results`): kolumna nazywa się **`vote`** (TEXT).
- Skrypt analityczny: szuka kolumny **`result`**.
- Model SQLAlchemy (`models.py`): definiuje kolumnę jako `result`.
- **Efekt**: Nawet gdyby dane były, skrypt wywaliłby się na błędzie `column "result" does not exist`.

### C. Duch Supabase (Legacy Code)
W plikach frontendowych (`useRankings.ts`, `useSejmPrints.ts`) pozostawiono odwołania do zmiennej globalnej `supabase`, która została usunięta podczas rebrandingu na `db`.
- **Efekt**: Frontend "kręci się" w nieskończoność lub sypie błędami w konsoli przeglądarki, bo nie może połączyć się z bazą.

---

## 2. Plan Naprawczy (Recovery Plan)

Aby to naprawić, musimy wykonać sekwencję "Deep Dive":

1.  **Naprawa Schematu**: Ujednolicenie nazwy kolumny w bazie (`vote` -> `result`).
2.  **ETL Głębinowy (Deep Fetch)**: Napisanie/aktualizacja skryptu, który przejdzie przez wszystkie ~2500 głosowań i pobierze **listy imienne** (to będzie ok. 460 * 2500 = 1.15 mln rekordów). To potrwa kilka-kilkanaście minut.
3.  **Rekalkulacja**: Ponowne uruchomienie poprawionego `stats.py` na napełnionej bazie.

Dopiero wtedy rankingi ożyją. Obecnie system "udaje", że ma dane, ale w środku jest pusty.
