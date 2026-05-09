# Strategia AI: "Truth Layer" (otwartyparlament.pl)
**Podejście: Chirurgiczna precyzja, minimalne koszty, maksymalna wiarygodność.**

## 1. PROBLEM: "Linguistic Gap" (Luka Językowa)
Media używają języka emocjonalnego i potocznego (np. "Kłótnia o aborcję", "Podwyżki dla budżetówki"). Sejm używa języka prawnego (np. "Zmiana ustawy o planowaniu rodziny", "Nowelizacja ustawy o płacach w sferze budżetowej"). Keyword matching (słowa kluczowe) nie jest w stanie połączyć tych dwóch światów.

## 2. CHIRURGICZNE ZASTOSOWANIE AI (3 Poziomy)

### POZIOM A: Inteligentny Tagger (Klasyfikacja Newsów)
- **Kiedy**: Raz na godzinę, po pobraniu RSS.
- **Zadanie**: AI (Gemini Flash) dostaje listę nagłówków i przypisuje im stałe kategorie Sejmowe (np. `BEZPIECZEŃSTWO`, `ZDROWIE`, `FINANSE`).
- **Dlaczego**: Dzięki temu od razu wiemy, w której części bazy SQL szukać dowodów.
- **Koszt**: Pomijalny (batch processing).

### POZIOM B: Semantic Bridge (Most Semantyczny)
- **Kiedy**: Podczas generowania szkieletu artykułu.
- **Zadanie**: Wykorzystanie wektorów (Embeddings) do znalezienia "bliskości" między newsami a głosowaniami. 
- **Skalpel**: System nie szuka słowa "Magyar", szuka *sensu* "zmiana władzy na Węgrzech".
- **Technologia**: `text-embedding-004` (Google) – najtańszy i najszybszy sposób na łączenie danych bez generowania tekstu.

### POZIOM C: Editorial Brief (Szkielet Redakcyjny)
- **Kiedy**: Na żądanie redaktora.
- **Zadanie**: Synteza danych. AI nie pisze artykułu, AI "wyciąga mięso" z surowych tabel SQL.
- **Output**: JSON z leadem, liczbami i źródłami.
- **Zasada**: Zero przymiotników, zero opinii. Tylko twarda struktura.

## 3. EKONOMIA I WYDAJNOŚĆ
1. **Darmowe Embeddingi**: Tabela `votes` musi mieć wygenerowane embeddingi raz na zawsze (skrypt `generate_embeddings.py`).
2. **Batching**: Nie pytamy AI o każdy news osobno. Pytamy o 100 newsów naraz.
3. **Cold Storage**: Dane Sejmowe są stałe. Raz przetworzone przez AI, zostają w bazie na zawsze.

## 4. NASTĘPNE KROKI (CHIRURGICZNE)
1. **Uruchomienie `generate_embeddings.py`** dla bazy Sejmu (X kadencja).
2. **Aktualizacja `news_sync.py`** o moduł `Categorizer` (przypisanie kategorii Sejmowych do nagłówków w locie).
3. **Wdrożenie Semantic Search** w endpoincie `/api/generate-article-brief`, aby AI wiedziało o czym pisze, nawet jeśli słowa kluczowe się nie zgadzają.
