# ⚡ Boleśnie Szczery Audyt Infrastruktury i Bezpieczeństwa

**Data**: 2025-12-25
**Cel**: Znalezienie bomb zegarowych w systemie.

Kod jest czysty ("wierzch góry lodowej"), ale pod wodą mamy problemy, które położą system przy pierwszym większym obciążeniu.

## 🛑 1. Anarchia w Bazie Danych (Brak Migracji)
Plik `scripts/db_migrate.sh` to myląca nazwa. To skrypt do **kopiowania** serwera, a nie zarządzania zmianami w bazie.
**Fakt**: Nie masz systemu migracji (np. Alembic, Flyway).
**Ryzyko**: Jeśli jutro będziesz chciał dodać kolumnę `age` do tabeli `mps`:
1. Zrobisz to ręcznie na produkcji (`ALTER TABLE...`).
2. Twój kolega (lub Ty za miesiąc) postawi deweloperską bazę od zera i... aplikacja nie ruszy, bo nikt nie zapisał, że tę kolumnę trzeba dodać.
**Werdykt**: Projekt jest "nieodtwarzalny" z kodu. Jesteś uzależniony od backupu `.sql`.

## 💣 2. Wydajność Bazy Danych (Connection Handling)
Plik `backend/core/db.py` tworzy **nowe połączenie** dla każdego zapytania!
```python
conn = psycopg2.connect(**self.conn_params) # Otwiera
...
conn.close() # Zamyka
```
**Ryzyko**: Nawiązywanie połączenia SSL to najdroższa operacja. Przy 50 użytkownikach (lub szybkim ETL) baza "klęknie" od samego witania się z klientem.
**Rozwiązanie**: Musisz użyć **Puli Połączeń** (`ConnectionPool`).

## 🛡️ 3. Bezpieczeństwo (RLS?)
Projekt używa Supabase/PostgREST, co jest super, ale nie znalazłem plików `.sql` definiujących polityki bezpieczeństwa (Row Level Security).
**Ryzyko**: Jeśli PostgREST jest wystawiony publicznie, każdy może czytać (a może i pisać?) do Twoich tabel.

## 🏁 Podsumowanie

System jest "czysty w środku", ale stoi na glinianych nogach.
1.  **Brak Historii Bazy**: Nie wiesz jak powstała Twoja baza (brak migracji).
2.  **Wąskie Gardło**: Baza padnie przy małym ruchu przez brak puli połączeń.

**Plan Ratunkowy**:
1.  Wprowadzić `ConnectionPool` w `backend/core/db.py` (łatwe).
2.  Zrobić zrzut obecnej bazy (`pg_dump --schema-only`) i zapisać jako `migrations/001_initial_schema.sql` (średnie).
