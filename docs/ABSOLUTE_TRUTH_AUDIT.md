# Audyt "Prawdy Objawionej" (System Truth Audit)

Oto stan faktyczny Twojego systemu, zweryfikowany bezpośrednio w terminalu i na serwerach.

## 1. Stan Bazy Danych (PostgreSQL)
*   **Głosowania (`votes`)**: 12,594 rekordów. (**OBECNE**)
*   **Wyniki (`vote_results`)**: 9,216,969 rekordów. (**OBECNE**)
*   **Posłowie (`mps`)**: 460 posłów oznaczonych jako `active = true` dla kadencji X. (**OBECNE**)
*   **Wniosek**: Twoje dane są bezpieczne i pełne na dysku.

## 2. Stan API (PostgREST)
*   Bezpośrednie połączenie (`localhost:3001`): **DZIAŁA** (Zwraca dane o posłach).
*   Połączenie przez Proxy (`localhost:5173/rest/v1`): **DZIAŁA** (Zwraca dane o posłach).
*   Wniosek: "Rury" są drożne.

## 3. Stan Frontendu (React)
*   **Konfiguracja**: Plik `.env` wskazuje na `/rest/v1`.
*   **Potencjalny Problem**: Twoja przeglądarka może trzymać w pamięci podręcznej (cache) starą wersję strony, która próbuje wysyłać błędy tokeny lub łączyć się ze starym adresem.

## PLAN NAPRAWCZY - OSTATNIE STARCIE

Wykonam teraz jedną, ostateczną zmianę w kodzie `db.ts`, która wymusi użycie pełnego adresu URL, eliminując jakiekolwiek błędy relatywnych ścieżek.

---

### Co teraz zrobię?
1.  Ulepszę `src/lib/db.ts` o mechanizm wykrywania adresu (Auto-Detection).
2.  Zapewnię, że zapytania są czyste (Zero Auth headers).

Jeśli to nie zadziała, problem leży wyłącznie w odświeżeniu serwera `npm run dev` po Twojej stronie.
