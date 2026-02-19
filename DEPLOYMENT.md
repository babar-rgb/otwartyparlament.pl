# Instrukcja Przenoszenia Projektu (Migration Guide)

## 1. Przygotowanie na obecnym komputerze (Mac A)

### Krok 1: Eksport bazy danych
Uruchom przygotowany skrypt, aby zapisać całą zawartość bazy (w tym nowe głosowania) do pliku SQL:

```bash
chmod +x export_db.sh
./export_db.sh
```

To utworzy plik np. `otwarty_parlament_dump_20260219_1200.sql`.

### Krok 2: Pakowanie plików
Skopiuj cały folder `parlament` na dysk zewnętrzny lub wyślij go na nowy komputer.
**Ważne:** Upewnij się, że plik `.sql` z punktu 1 znajduje się wewnątrz tego folderu.

---

## 2. Instalacja na nowym komputerze (Mac B)

### Krok 1: Wymagania wstępne
Upewnij się, że masz zainstalowane:
- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL** (np. przez `brew install postgresql`)

### Krok 2: Instalacja zależności

W folderze projektu uruchom terminal i wpisz:

```bash
# Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

### Krok 3: Import bazy danych
Uruchom skrypt importujący, podając nazwę pliku zrzutu:

```bash
chmod +x import_db.sh
./import_db.sh otwarty_parlament_dump_20260219_1200.sql
```

### Krok 4: Uruchomienie
Projekt jest gotowy do działania!

```bash
# Terminal 1 (Backend)
source venv/bin/activate
uvicorn backend.main:app --reload

# Terminal 2 (Frontend)
cd frontend
npm run dev
```
