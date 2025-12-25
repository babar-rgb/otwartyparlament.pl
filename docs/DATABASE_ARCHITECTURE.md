# 🏛️ Architektura Bazy Danych i Przyczyna Pustki

## 🚨 Dlaczego "nie działa"? (Puste Ekrany)
Widzisz "0 Komisji" i "Brak Głosowań" nie dlatego, że kod jest zepsuty.
Kod działa poprawnie.
Powód jest prozaiczny: **Przełączyliśmy się na nową, profesjonalną bazę danych (Postgres), która jest PUSTA.**

Wcześniej korzystałeś z pliku `sejm.db` (SQLite), który miał jakieś dane.
Teraz korzystamy z potężnego PostgreSQL. Ale on jest czysty jak łza.
Musimy go **napełnić** (uruchomić ETL).

## 🧩 Elementy Układanki (Wyjaśnienie Chaosu)

Masz rację, że nazewnictwo jest mylące. Uporządkujmy to raz na zawsze.

### 1. PostgreSQL (Baza Danych) 🗄️
To jest "mózg". Tutaj fizycznie leżą dane (tabela poslowie, glosowania itp.).
- **Gdzie jest?**: W kontenerze Docker (`db`).
- **Rola**: Trzyma dane. Tylko tyle.

### 2. PostgREST (Bramkarz, API) 🚪
To jest "tłumacz". PostgreSQL gada po SQLu. Przeglądarka gada po HTTP (JSON).
PostgREST stoi pomiędzy nimi.
- **Działanie**: Zamienia zapytanie `GET /mps` na `SELECT * FROM mps`.
- **Dlaczego go mamy?**: Żeby frontend (React) mógł pobierać dane bez pisania backendu.

### 3. @supabase/supabase-js (Klient w React) 📡
To "pilot" do telewizora.
Mimo nazwy "Supabase", to po prostu biblioteka JavaScript, która bardzo wygodnie rozmawia z PostgRESTem.
- **Rola**: Zamiast pisać ręcznie `fetch('http://api/mps?select=*')`, piszesz `db.from('mps').select('*')`.
- **Zmiana**: Przemianowaliśmy importy na `db`, żeby nie mylić z chmurą Supabase.

### 4. Backend Python (ETL i Scheduler) 🐍
To jest "robotnik".
Jego zadaniem nie jest wyświetlanie danych, ale ich **zdobywanie**.
- **Co robi?**: Codziennie w nocy łączy się z API Sejmu, pobiera nowe głosowania i wstawia je do odwiedzonego w pkt 1 PostgreSQL.

---

## 🗺️ Schemat Przepływu Danych

```mermaid
graph TD
    SejmAPI[Sejm.gov.pl] -->|Pobieranie Danych (ETL)| PythonBackend
    PythonBackend -->|Zapis SQL| PostgreSQL[(Baza PostgreSQL)]
    
    Uzytkownik((Użytkownik)) -->|Klika w Przeglądarce| ReactFrontend
    ReactFrontend -->|Zapytanie db.from...| PostgREST
    PostgREST -->|Zapytanie SQL| PostgreSQL
    PostgreSQL -->|Wyniki JSON| PostgREST
    PostgREST -->|Wyniki JSON| ReactFrontend
```

## 🚑 Plan Ratunkowy (Jak odzyskać dane?)

Skoro baza jest pusta, musimy ją nakarmić. Mamy świetne skrypty ETL, które napisałeś.
Wystarczy je uruchomić raz, a baza zapełni się danymi z obecnej kadencji.

**Komenda do naprawy:**
Obecnie system jest spójny, ale pusty.
Należy uruchomić: `python backend/etl/run_all_initial.py` (lub odpalić poszczególne ETL ręcznie), żeby zaciągnąć dane.
