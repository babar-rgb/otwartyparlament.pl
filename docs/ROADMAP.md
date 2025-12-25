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
