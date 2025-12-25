# 📊 Raport Napełniania Danych (Data Fill Audit)

**Data**: 2025-12-25
**Cel**: Identyfikacja danych wymaganych przez Frontend i weryfikacja gotowości ETL.

## 1. Wymagania Frontendu

| Ekran / Komponent | Wymagane Dane | Źródło w Sejm API | Status ETL |
| :--- | :--- | :--- | :--- |
| **Pulpit / Dashboard** | Nowe Głosowania, Najbliższe Posiedzenie | `/votings/{sitting}`, `/term10/proceedings` | ✅ `IncrementalETL` |
| **Posłowie (Lista)** | Lista Posłów (Imie, Nazwisko, Klub, Zdjęcie) | `/term10/MP` | ✅ `IncrementalETL` |
| **Szczegóły Posła** | Statystyki, Oświadczenia, Przynależność | `/term10/MP/{id}`, `/declarations` | ⚠️ Cześciowo (Brak powiązania API ID?) |
| **Głosowania (Lista)** | Tytuł, Wynik, Data, Numer | `/votings/{sitting}` | ✅ `IncrementalETL` |
| **Komisje** | Lista Komisji, Skład Osobowy | `/committees` | ❌ **BŁĄD SQL** (Patrz niżej) |
| **Projekty Ustaw** | Lista Procesów Legislacyjnych | `/processes` | ❌ **BRAK ETL** (Niezaimplementowane) |

## 2. Znalezione Błędy w ETL

### 🚨 Błąd 1: Import w `seed_full.py`
Skrypt importuje `SejmETL`, ale klasa w pliku `backend/etl/incremental.py` nazywa się `IncrementalETL`.
**Naprawa**: Trywialna (zmiana nazwy w imporcie).

### 🚨 Błąd 2: Komisje vs Posłowie (`api_id`)
Skrypt `committees.py` próbuje łączyć członków komisji z posłami używając kolumny `api_id`:
```sql
SELECT ... FROM mps WHERE api_id = %s
```
Jednak tabela `mps` (wg `incremental.py` i `models.py`) używa kolumny `id` jako identyfikatora z API. Nie ma kolumny `api_id`.
**Skutek**: ETL Komisji wywali się błędem "column api_id does not exist" lub nie powiąże nikogo (jeśli kolumna istnieje ale jest pusta).
**Naprawa**: Zmiana zapytania w `committees.py` na `WHERE id = %s`.

### 🚨 Błąd 3: Brak Procesów Legislacyjnych
Nie mamy skryptu pobierającego "Projekty Ustaw" (Druki sejmowe). Sekcja "Projekty" na stronie będzie pusta.

## 3. Plan Naprawczy (Ready to Exec)

1.  **Naprawić `committees.py`**: Zamienić `api_id` na `id`.
2.  **Naprawić `seed_full.py`**: Poprawić import klasy.
3.  **Uruchomić Seed**: Pobrać Posłów, Głosowania i Komisje.
4.  **Zostawić Projekty**: Na później (wymaga nowego modułu `backend/etl/bills.py`).
