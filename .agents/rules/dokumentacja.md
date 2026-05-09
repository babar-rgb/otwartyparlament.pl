---
trigger: always_on
---

Architektura Projektu
Projekt podzielony jest na prosty, oparty na Vanilla JS frontend oraz backend w Pythonie z wykorzystaniem frameworka FastAPI.

1. Frontend (Vanilla JS)
Frontend to architektonicznie czysta aplikacja Single Page Application (SPA), która nie korzysta z ciężkich frameworków jak React, opierając się na natywnym JavaScripcie, HTML i CSS ("Transplant Mode").

index.html: Główny plik struktury. Zawiera:
Mega menu nawigacyjne (kategorie tematyczne: Finanse, Bezpieczeństwo, Sądownictwo, itp.).
Nagłówek z logo i paskiem wyszukiwania.
Główny układ (main-layout) dzielący się na obszar zawartości (content-area) oraz pasek boczny (sidebar).
main.js: Serce logiki klienckiej. Odpowiada za:
Zarządzanie stanem (state): Przechowuje pobrane z API artykuły, posłów (mps), głosowania (votes), procesy legislacyjne (processes) i tematy z mediów (trending).
Routing (handleRoute): Obsługuje zmianę widoków bez przeładowania strony w oparciu o hash w adresie URL (np. #glosowania, #ustawy, #poslowie/{klub}).
Pobieranie danych (init): Kontaktuje się z backendem (domyślnie http://localhost:8002/api). Gdy API nie odpowiada, łagodnie przechodzi na mockowane dane z pliku data.json.
Renderowanie (templates i helpery): Generuje kod HTML dynamicznych widoków (karty posłów, listy głosowań). Zachowuje zasadę, gdzie kod HTML generowany jest wyłącznie przez helpery (np. renderLedgerItem).
style.css: Potężny plik odpowiedzialny za "surowy, architektoniczny minimalizm". Przestrzega zasady "Layout jest nienaruszalny", dba o estetykę prestiżowego magazynu i całkowicie omija domyślne style przeglądarek.
data.json: Statyczna baza danych, używana jako fallback w razie niedostępności backendu.
2. Backend (Python / FastAPI)
Backend odpowiedzialny jest za agregację i wystawianie "twardych danych" dla frontendu.

backend/main.py: Główny punkt wejścia do API (uruchamiany na ogół przez Uvicorn na porcie 8002). Rejestruje wszystkie routingi.
Endpointy (pod prefiksem /api):
/api/trending – Dane o tym, co obecnie pojawia się w mediach.
/api/mps – Rejestr posłów.
/api/votes – Księga głosowań.
/api/legislative_processes – Projekty ustaw (procesy legislacyjne).
/api/wealth – Rankingi majątkowe.
/api/editor – Narzędzia redakcyjne.
Architektura modułowa: Poszczególne grupy endpointów są wydzielone do osobnych plików w folderze backend/routers/.
3. Komponenty Pomocnicze
Scrapery (news scraper/news_sync.py, backend/news_sync.py): Służą prawdopodobnie do zasilania bazy i sprawdzania, czym żyją aktualnie media informacyjne (w celu zestawienia ich ze stanem faktycznym - "Filter Spokoju").
AI_MANIFESTO.md: Kodeks wyznaczający cele i zachowanie modelu w projekcie.
Kluczowe Zasady Pracy (Przypomnienie)
Edycja sekwencyjna: Nigdy nie modyfikujemy naraz JS i CSS. Jedna zmiana, jeden plik.
Brak opinii: Prezentujemy surowe dane z wiarygodnych źródeł. AI tłumaczy zawiłości legislacyjne, ale nie dodaje komentarza.
Layout jest święty: Jakiekolwiek nowe funkcjonalności muszą wpisywać się w obecny, oszczędny i elegancki styl wizualny, nie niszcząc struktury index.html.