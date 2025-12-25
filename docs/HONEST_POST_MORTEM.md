# Raport z Pola Walki: Jak zniknęły dane i jak wrócą (Honest Post-Mortem)

## Co się stało? (The Timeline of Destruction)

### 1. Przesiadka (The Migration)
Mieliśmy działającą (jako tako) aplikację na SQLite (`sejm.db`). Podjęliśmy decyzję o profesjonalizacji stacku i przejściu na PostgreSQL.
*   **Efekt**: Stara baza SQLite została odłączona. Nowa baza PostgreSQL była pusta i lśniąca.

### 2. Wielkie Napełnianie (The Seed)
Uruchomiłem skrypt `seed_full.py`, który miał odtworzyć dane.
*   **Błąd Krytyczny**: Skrypt ten używał logiki "Incremental ETL", która została zaprojektowana do szybkiego sprawdzania nowości, a nie do głębokiego pobierania historii.
*   **Rezultat**: Skrypt pobrał 460 posłów i 2500 "nagłówków" głosowań (np. "Głosowanie nr 1: Uchwalono").
*   **Czego zabrakło?**: Skrypt **NIGDY** nie wykonał zapytania o szczegóły ("Jak głosował Poseł X w Głosowaniu Y?").
*   **Dlaczego wydawało się, że jest dobrze?**: Licznik pokazywał "Pobrano 2500 głosowań". Ale to były tylko puste skorupy.

### 3. Duch Chmury (The Cloud Ghost)
Istnieje duże prawdopodobieństwo, że "15 minut temu" aplikacja łączyła się jeszcze ze **starą instancją Supabase w chmurze** (jeśli taka była skonfigurowana w ukrytych zmiennych środowiskowych), która miała pewne dane (być może wgrane kiedyś ręcznie).
*   **Moment Zwrotny**: W kroku refaktoryzacji podmieniłem plik `supabase.ts`, kierując ruch na **lokalną bazę Docker** (port 3001), która jest "czysta" (i niekompletnie wypełniona przez mój wadliwy skrypt).
*   **Efekt**: Odcięcie od "starego źródła" i wejście na "pustą pustynię".

### 4. Rankingi na glinianych nogach
Strona "Rankingi" próbowała policzyć statystyki na nowej bazie. Trafiła na pustkę.

---

## Jak to naprawię? (The Fix)

Nie będziemy scalić starej chmury (jeśli istniała) z nowym systemem, bo to rodzi konflikty. Zbudujemy własną potęgę danych tu i teraz.

### Krok 1: Naprawa Schematu (30 sekund)
Baza danych ma kolumnę `vote`, a kod oczekuje `result`.
*   **Akcja**: Zmienię nazwę kolumny w bazie na `result`, aby pasowała do reszty systemu.

### Krok 2: Deep Fetch (10-15 minut)
Napiszę i uruchomię nowy skrypt `backend/etl/votes_details.py`.
*   **Co zrobi?**: Przejdzie przez każde z 2500 głosowań i pobierze listę imienną (460 nazwisk x 2500 głosowań = 1.15 mln rekordów).
*   **To jest "ciężka artyleria"**, której wcześniej nie użyliśmy.

### Krok 3: Przeliczenie Statystyk (1 minuta)
Gdy baza się napełni, uruchomię `backend/etl/stats.py`.
*   **Co zrobi?**: Policzy frekwencję i bunty. Napełni te puste kolumny w tabeli Posłów.

### Wnioski
Przepięliśmy wtyczkę z "magicznej chmury" do "pustego gniazdka". Teraz musimy do tego gniazdka doprowadzić prąd (dane).
