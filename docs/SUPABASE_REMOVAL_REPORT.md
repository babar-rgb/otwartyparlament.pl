# Raport Usuwania Zależności Supabase

Na wyraźne życzenie usunięto bibliotekę SDK Supabase (`@supabase/supabase-js`) z projektu.

## Wykonane Operacje

1.  **Odinstalowanie SDK**: Pakiet `@supabase/supabase-js` (4MB+) został całkowicie usunięty.
2.  **Instalacja Klienta PostgREST**: Zainstalowano lekki, generyczny klient `@supabase/postgrest-js` (30KB), który służy wyłącznie do komunikacji REST API z bazą danych, bez funkcji Auth/Realtime/Storage.
3.  **Refaktoryzacja Kodu**:
    *   Zmodyfikowano 22 pliki w katalogu `src/`.
    *   Wszystkie wywołania `supabase.*` zamieniono na `db.*`.
    *   Usunięto importy z `lib/supabase`.
    *   Skonfigurowano klienta w `src/lib/db.ts` jako czystego klienta REST.
4.  **Weryfikacja**:
    *   Projekt zbudował się poprawnie (`vite build` success).
    *   Nie ma błędów typowania.

## Stan Końcowy
Aplikacja jest teraz:
1.  **Lżejsza**: Mniejszy bundle JS.
2.  **Czysta**: Brak zależności od usług chmurowych Supabase (Auth, Storage).
3.  **Lokalna**: Połączona z Twoją lokalną bazą PostgreSQL na porcie 5432.
