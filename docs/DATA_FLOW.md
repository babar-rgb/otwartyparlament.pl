# 🛤️ Podróż Danych: Od Sejmu do Twojego Ekranu

> Ten dokument opowiada historię o tym, jak to wszystko działa. Bez trudnego żargonu programistycznego.

---

## ⏰ Krok 1: Budzik (Godzina 06:00)

Wyobraź sobie, że nasz system to sumienny pracownik. Codziennie rano o **6:00** (oraz po południu o **14:00**) dzwoni mu budzik.
Tym budzikiem jest **Scheduler** (Harmonogram).

Kiedy pracownik wstaje, zadaje sobie jedno pytanie:
> *"Czy w Sejmie wydarzyło się coś nowego od wczoraj?"*

---

## 📡 Krok 2: Wyprawa po Dane (Wszystko co pobieramy)

Nasz pracownik (skrypt `Incremental ETL`) idzie do źródła, czyli API Sejmu.
Ma ze sobą długą listę rzeczy do sprawdzenia. Oto **WSZYSTKO**, co może pobrać:

| Co pobieramy? | Endpoint API | Opis "po ludzku" |
|---------------|--------------|------------------|
| **Posłowie** | `/term10/MP` | Pełna lista posłów, ich kluby, daty urodzenia. |
| **Zdjęcia** | `/term10/MP/{id}/photo` | Portrety posłów widoczne na stronie. |
| **Posiedzenia** | `/term10/proceedings` | Kalendarz: kiedy Sejm obradował. |
| **Głosowania** | `/term10/votings/{nr}` | Wyniki: kto był za, kto przeciw, jaki był temat. |
| **Interpelacje** | `/term10/interpellations` | Pytania posłów do ministrów (np. "Gdzie są pieniądze?"). |
| **Treść Interpelacji** | `/term10/interpellations/{id}/body` | Dokładna treść pytania i odpowiedź ministra. |
| **Druki Sejmowe** | `/term10/prints` | Projekty ustaw i uchwał (dokumenty w PDF). |
| **Proces Legislacyjny** | `/term10/processes` | Ścieżka ustawy (Sejm -> Senat -> Prezydent). |
| **Komisje** | `/term10/committees` | Lista wszystkich komisji (np. Finansów Publicznych). |
| **Składy Komisji** | `/term10/committees/{kod}` | Kto zasiada w danej komisji. |
| **Stenogramy** | `/term10/proceedings/.../transcripts` | Zapis słowo w słowo tego, co mówiono na sali. |
| **Wideo** | `/term10/videos` | Linki do nagrań wideo z obrad. |

**Ważne:** Pracownik jest sprytny. Nie bierze wszystkiego od 1989 roku. Bierze tylko to, co jest **nowe** od jego ostatniej wizyty.

---

## 🧠 Krok 3: Analiza i Tłumaczenie (Wszystkie Skrypty)

Dane z Sejmu są surowe i trudne. Trafiają więc do konkretnych działów (skryptów), które je mielą i układają na półkach w bazie.
Oto **PEŁNA LISTA** maszyn (skryptów), które biorą w tym udział:

### A. Główna Linia Produkcyjna (Automatyczna)
Te skrypty działają codziennie w tle, bez udziału człowieka.

1.  **`backend.etl.incremental`** (Szef Zmiany)
    *   **Zadanie**: Zarządza pobieraniem posłów, posiedzeń i podstawowych wyników głosowań.
2.  **`backend.etl.heuristics`** (Mózg)
    *   **Zadanie**: Analizuje tytuły głosowań, nadaje im kategorie (np. "Gospodarka") i ocenia ważność.
3.  **`import_interpellations.py`**
    *   **Zadanie**: Pobiera listę nowych interpelacji.
4.  **`fix_interpellations.py`**
    *   **Zadanie**: "Doczytuje" treść interpelacji, jeśli w pierwszym rzucie jej brakowało.
5.  **`fetch_sejm_prints.py`**
    *   **Zadanie**: Pobiera nowe druki sejmowe (ustawy).
6.  **`etl_committees.py`**
    *   **Zadanie**: Aktualizuje składy komisji (kto doszedł, kto odszedł).

### B. Działy Specjalne (Analityczne)
Te skrypty zajmują się głębszą analizą tekstu i AI.

7.  **`generate_heuristic_analysis.py`**
    *   **Zadanie**: Generuje uproszczone podsumowania ("Simplest Summary") dla trudnych ustaw.
8.  **`import_transcripts.py`**
    *   **Zadanie**: Pobiera stenogramy i przypisuje wypowiedzi do konkretnych posłów.
9.  **`analyze_speech.py`**
    *   **Zadanie**: Liczy sentyment (pozytywny/negatywny) wypowiedzi posłów.
10. **`scan_bill_projects.py`**
    *   **Zadanie**: Skanuje treść projektów ustaw (często PDF) w poszukiwaniu kluczowych zmian.
11. **`vote_intelligence.py`**
    *   **Zadanie**: Prototyp, który uczy się przewidywać zachowania posłów (ML).
12. **`humanize_laws.py`**
    *   **Zadanie**: Próbuje przepisać prawniczy język ustawy na "ludzki".

### C. Ekipa Sprzątająca (Naprawcza)
Te skrypty wchodzą do akcji, gdy coś się rozsypie.

13. **`nightly_cleaner.py`**
    *   **Zadanie**: Usuwa śmieci, stare logi i duplikaty (uruchamiany w nocy).
14. **`repair_vote_results.py`**
    *   **Zadanie**: Sprawdza, czy liczba głosów (Za+Przeciw+Wstrz) zgadza się z liczbą posłów.
15. **`fix_mp_attendance.py`**
    *   **Zadanie**: Przelicza od nowa frekwencję każdego posła, by była aktualna.

---

## 🖥️ Krok 4: Wyświetlenie (Twoja Przeglądarka)

Gdy wchodzisz na stronę *Otwarty Parlament*:

1.  Twoja przeglądarka (Frontend) puka do naszego serwera.
2.  Nasz serwer (PostgREST) działa jak recepcjonista - sprawdza, czy masz klucz (autoryzację) i bezpiecznie podaje dane z bazy.
3.  Aplikacja na Twoim ekranie bierze te dane i rysuje ładne wykresy, mapy myśli i karty posłów.

### Podsumowując:
System to wielka fabryka. Codziennie rano:
1.  **Dostawcy** (Sejm API) przywożą surowiec.
2.  **15 różnych maszyn** (Skrypty) przerabia go, mieli, tłumaczy i układa.
3.  Na końcu Ty dostajesz **gotowy produkt** na stronie.

---

## 🚀 Nowe Funkcje do Wdrożenia

Planujemy rozbudowę systemu o następujące możliwości w przyszłości:

1.  **Generator Grafik na Social Media**
    *   **Funkcja:** Przycisk "Pobierz Grafikę" dostępny pod każdą ustawą i głosowaniem.
    *   **Działanie:** Automatycznie generuje estetyczny plik obrazkowy (PNG/JPG), który zawiera:
        *   Tytuł głosowania (w wersji uproszczonej przez AI).
        *   Wynik głosowania (duże "PRZYJĘTO" lub "ODRZUCONO").
        *   **Logo i nazwę strony "Otwarty Parlament"** (znak wodny).
    *   **Cel:** Ułatwienie użytkownikom dzielenia się informacjami na Instagramie/Twitterze.

2.  **Zaawansowane AI (Gemini 1.5 Pro)**
    *   **Funkcja:** Integracja z potężnymi modelami Google Gemini (wymaga kluczy API).
    *   **Działanie:**
        *   Analiza **całych dokumentów** PDF (projektów ustaw), a nie tylko tytułów.
        *   Wykrywanie "wrzutek legislacyjnych" (niebezpiecznych zapisów ukrytych w dużych ustawach).
        *   Tłumaczenie skomplikowanego języka prawniczego na prosty język ("Explain like I'm 5").
    
# 🗺️ Roadmapa Rozwoju (To-Do)

> Lista zadań, usprawnień i planów rozwoju projektu "Otwarty Parlament".

---

## 📢 Marketing i Zasięgi

- [ ] **Social Media Start**: Utworzenie profili (Instagram, X/Twitter, TikTok).
- [ ] **Strategia Marketingowa**: Opracowanie spójnego planu komunikacji i promocji projektu.

## 🎨 Design i UX

- [ ] **Jasny Motyw (Light Mode)**: Zaprojektowanie i wdrożenie profesjonalnego, czytelnego trybu jasnego (obecnie dominuje ciemny).
- [ ] **Optymalizacja Zdjęć Posłów**: Zmniejszenie rozmiaru/wagi zdjęć w sekcji "Posłowie" (poprawa rozdzielczości/wydajności, by nie "raziły w oczy").
- [ ] **Teksty "O Projekcie"**: Przeredagowanie sekcji "O projekcie". Nowy tekst ma być:
    - Merytoryczny i profesjonalny.
    - Przystępny ("popularny"), ale mniej infantylny.

## 🏛️ Funkcje: Profil Posła

Ulepszenia w panelu szczegółów posła (`MPDetails`):

- [ ] **Historia Głosowań**:
    - Wyświetlanie listy *ostatnich* głosowań bezpośrednio w panelu.
    - Przycisk "Rozwiń / Pokaż wszystkie", otwierający pełną historię.
- [ ] **Archiwum Wypowiedzi**:
    - Wyświetlanie *ostatnich* wypowiedzi z mównicy.
    - Możliwość przejścia do pełnej listy wszystkich stenogramów danego posła.
- [ ] **Kontakt**: Dodanie oficjalnych danych kontaktowych (biuro poselskie, email, social media posła).

## 🗳️ Funkcje: Edukacja i Dane

- [ ] **Test Wyborczy (Latarnik)**: Kompleksowe ulepszenie algorytmu i pytań w teście dopasowania politycznego.
- [ ] **Interpelacje (Pełna Treść)**: Dokończenie wdrażania pobierania treści *wszystkich* interpelacji (obecnie pobierana jest lista, treść czasem wymaga dociągnięcia).

## 🔍 Funkcje: Lupa (Wyszukiwarka Globalna)

Stworzenie potężnej wyszukiwarki znającej kontekst i przeszukującej całą bazę.

- [ ] **Backend Wyszukiwarki**: Implementacja logiki przeszukiwania wielu tabel jednocześnie (głosowania, ustawy, posłowie, interpelacje).
- [ ] **Filtrowanie**: "Zaprzęgnięcie do działania" istniejących filtrów UI:
    - *Ostatni tydzień*.
    - *Tylko ustawy*.
    - *Kontrowersyjne* (close votes).
- [ ] **Kontekstowość**: Wyszukiwarka ma "rozumieć" synonimy i kontekst (np. "szpitale" -> szuka też w ustawach zdrowotnych).

## 🖼️ UI: Panel Głosowania (`VoteDetails`)

Kosmetyka i UX w widoku konkretnego głosowania.

- [ ] **Powiązany Druk Sejmowy**:
    - Przesunięcie i zmniejszenie segmentu.
    - Lepsza integracja wizualna z resztą strony (subtelniejszy wygląd).
- [ ] **Mapa Myśli (Mind Map)**:
    - Poprawa layoutu (obecnie "rozjechany", niespójny).
    - Stylizacja przycisku "Zobacz mapę myśli", aby pasował do designu strony.
