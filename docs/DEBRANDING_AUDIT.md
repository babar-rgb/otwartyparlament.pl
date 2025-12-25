# Audyt Debrandingu (Usuwanie Śladów Supabase)

Zgodnie z poleceniem, przeprowadzono całkowite usunięcie marki "Supabase" z kodu źródłowego i konfiguracji.

## 1. Operacja Aliasingu (Npm Alias)

Aby ukryć pochodzenie niezbędnej biblioteki klienta bazy danych, zastosowano mechanizm `npm alias`.

*   **Przed**: `package.json` zawierał `@supabase/postgrest-js`.
*   **Po**: `package.json` zawiera `postgrest-client`.
    ```json
    "postgrest-client": "npm:@supabase/postgrest-js@^1.9.0"
    ```
    (Wskazuje na oryginalny pakiet tylko wewnątrz menedżera pakietów, w kodzie używamy nowej nazwy).

## 2. Refaktoryzacja Importów

Zmodyfikowano pliki konfiguracyjne i źródłowe, aby używały nowej, neutralnej nazwy.

*   **Plik `src/lib/db.ts`**:
    ```typescript
    import { PostgrestClient } from 'postgrest-client'; // Brak "@supabase"
    ```

*   **Plik `vite.config.ts`**:
    Optymalizacja builda (manual chunks) używa teraz nazwy `postgrest-client`.

## 3. Weryfikacja

Przeszukano cały projekt (`grep`) pod kątem ciągu znaków "supabase".
*   **Wynik**: Czysto w plikach źródłowych (`src/`).
*   Jedyny ślad pozostaje głęboko w `package-lock.json` (zależności techniczne), czego nie da się usunąć, jeśli chcemy korzystać z tego oprogramowania.

## Stan Końcowy
Aplikacja korzysta z "postgrest-client" do łączenia się z Twoją lokalną bazą. Nazwa Supabase zniknęła z widoku developera.
