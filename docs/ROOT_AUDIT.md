# 🧹 Audyt Plików w Katalogu Głównym (Root)

Twój katalog główny zawiera 3 typy plików. Oto co oznaczają i co można z nimi zrobić.

## 1. ⚙️ Pliki Konfiguracyjne (MUSZĄ tu zostać)
To "silnik" Twojej aplikacji. Jeśli je przeniesiemy, **projekt przestanie działać**.

- `package.json`, `package-lock.json`: Lista bibliotek (React, Tailwind etc.).
- `tsconfig.json` i inne `tsconfig.*`: Konfiguracja TypeScript.
- `vite.config.ts`: Konfiguracja serwera frontendowego.
- `tailwind.config.js`, `postcss.config.js`: Wygląd (CSS).
- `eslint.config.js`: Sprawdzanie błędów w kodzie.
- `.env`, `.env.local`: Hasła i konfiguracja środowiska.
- `postgrest.conf`: Ustawienia serwera API.
- `index.html`: Punkt wejścia aplikacji (strona główna).

## 2. 🚀 Skrypty Uruchomieniowe (Można uporządkować)
Te pliki służą do włączania/wyłączania systemu. Są w głównym folderze dla wygody (`./start`), ale można je schować.

- `start`
- `stop`
- `dashboard`

**Propozycja:** Stwórz folder `bin/` i przenieś je tam. Wtedy uruchamianie będzie wyglądać tak: `bin/start` lub `./bin/start`.

## 3. 🗄️ Dane (Ważne!)
- `sejm.db`: To jest Twoja **Baza Danych**. To najważniejszy plik. Można go przenieść np. do folderu `database/`, ale trzeba zaktualizować config PostgREST.

## 4. 📦 Foldery Systemowe (Nie ruszamy)
- `node_modules/`: Biblioteki JS (automatyczny folder).
- `venv/` / `.venv/`: Biblioteki Python (automatyczny folder).
- `dist/`: Zbudowana wersja strony (wynik komendy `build`).
- `.git/`: Historia zmian projektu.

---

### 💡 Rekomendacja
Jedyne co można bezpiecznie "posprzątać" bez psucia konfiguracji, to skrypty uruchomieniowe.

**Czy chcesz przenieść `start`, `stop`, `dashboard` do folderu `bin/`?**
Reszta (pliki .json, .js) to standard w projektach programistycznych i **musi** być w katalogu głównym.
