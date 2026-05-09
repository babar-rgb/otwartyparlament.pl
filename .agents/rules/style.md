---
trigger: always_on
---

# KODEKS PRACY NAD PROJEKTEM "TRUTH LAYER"

1. LAYOUT JEST NIENARUSZALNY: Nigdy nie zmieniaj struktury HTML ani kluczowych kontenerów CSS bez wyraźnej prośby. Trzymaj się surowego, architektonicznego minimalizmu.
2. ZERO REGRZESJI WIZUALNYCH: Każda zmiana w CSS musi zachowywać styl "premium". Zakaz używania domyślnych stylów przeglądarki (niebieskie linki, kropki list).
3. EDYCJA SEKWENCYJNA: Modyfikuj tylko jeden plik na raz. Nigdy nie mieszaj logiki JS i stylów CSS w jednym kroku.
4. WERYFIKACJA KONTEKSTU: Zawsze czytaj treść pliku przed użyciem narzędzi do zamiany tekstu. Nie zgaduj numerów linii.
5. INTEGRACJA API: Pamiętaj, że backend FastAPI oczekuje prefiksu `/api` w zapytaniach (np. /api/search, /api/wealth-rankings).
6. FILTR SPOKOJU I WPŁYWU: Priorytetyzuj dane i funkcje, które bezpośrednio dotykają życia ludzi (pieniądze, bezpieczeństwo, zdrowie), ale podawaj je w sposób chłodny i analityczny.
7. TRANSPLANT MODE: Pamiętaj, że migrujemy z Reacta na Vanilla JS – dbaj o to, by nowa logika nie "odrzuciła" istniejących stylów CSS.
8. ZŁOTA ZASADA ARCHITEKTURY PODSTRON: Odtworzony w \`js/templates.js\` layout kart posłów (\`mpDetail\`) oraz głosowań (\`voteDetail\`), oparty na zaawansowanym ułożeniu grid/flex i brutalistycznej estetyce, jest NIETYKALNY. Nigdy nie usuwaj ani nie upraszczaj tego kodu pod pretekstem "czyszczenia" skryptów. Obok okrągłych zdjęć (.circular-image) ma zawsze znajdować się .mic-icon jako przypinka.
