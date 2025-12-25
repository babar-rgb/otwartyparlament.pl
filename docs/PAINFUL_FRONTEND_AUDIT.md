# ⚡ Boleśnie Szczery Audyt Frontendu i Bezpieczeństwa

**Data**: 2025-12-25
**Cel**: Znalezienie bomb w React i kluczach API.

## 🔑 1. Hardcoded Secrets (Klucz w Kodzie)
Plik `src/lib/supabase.ts` zawiera zahardkodowany `ANON_KEY`:
```typescript
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```
**Problem**:
1. Jeśli zmienisz sekret w `postgrest.conf`, musisz **przebudować frontend**, żeby wygenerować nowy token i wkleić go do kodu.
2. Token jest widoczny w repozytorium (Git history).

**Rozwiązanie**: Przenieś to do `.env` jako `VITE_SUPABASE_ANON_KEY`.

## 📦 2. Nadmiarowość Bibliotek (Bloat)
W `package.json` widzę:
- `@tremor/react` (zawiera Recharts)
- `recharts` (osobno)
- `reactflow` (ciężka biblioteka do grafów)
- `framer-motion` (ciężka biblioteka do animacji)

Czy na pewno używasz `recharts` bezpośrednio? Jeśli nie, to ściągasz tę samą bibliotekę dwa razy (raz w Tremorze, raz osobno). To **zwiększa rozmiar bundle'a**.

## 🚀 3. Deployment (Brak Konteneryzacji)
Twoje "wdrożenie" to skrypt `db_migrate.sh`, który robi `rsync`.
To średniowiecze.
W nowoczesnym świecie powinieneś mieć `Dockerfile`, który buduje frontend i backend w izolacji.
Obecnie: Jeśli na serwerze jest inna wersja Node.js niż u Ciebie, `npm install` może zadziałać inaczej i wywalić aplikację.

## 🏁 Podsumowanie

Frontend jest "sklejony taśmą":
1.  **Klucze**: W kodzie.
2.  **Build**: Zależny od wersji Node na maszynie developera.
3.  **Biblioteki**: Potencjalnie nadmiarowe.

**Plan Ratunkowy**:
1.  Wyniesienie `ANON_KEY` do `.env`.
2.  Stworzenie `Dockerfile` (frontend + backend).
