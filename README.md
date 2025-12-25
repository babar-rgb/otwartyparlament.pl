# Otwarty Parlament

Transparentna, niekomercyjna platforma dla demokracji i odpowiedzialności politycznej. Śledź każde głosowanie w Sejmie, sprawdzaj jak głosują Twoi posłowie i porównuj partie.

## Demo

Wersja live:https://open-parliament-sejm-nikn.bolt.host/               LATER[otwartyparlament.pl](https://otwartyparlament.pl)

## Funkcjonalności

- **Przeszukiwanie posłów** - Znajdź pełne profile posłów z historią głosów, projektów ustaw i aktywności
- **Baza głosowań** - Przeglądaj wszystkie głosowania sejmowe z zaawansowanym filtrowaniem
- **Profile partii** - Porównuj partie pod względem spójności i aktywności
- **Rankingi** - Najaktywniejsi posłowie w różnych kategoriach
- **Test wyborczy** - Dowiedz się, z którą partią Twoje poglądy są najbardziej zbieżne
- **Zaawansowane wykresy** - Wizualizacja danych z Recharts
- **Responsywny design** - Działa na mobile, tablet i desktop

## Technologia

- **Frontend**: React 18 + TypeScript + TailwindCSS
- 🏗️ **Architektura**: [Audyt Architektury](docs/ARCHITECTURE_AUDIT.md)
- 🔄 **Przepływ Danych**: [Data Flow](docs/DATA_FLOW.md)
- ⚙️ **Skrypty**: [Przewodnik po Skryptach](docs/SCRIPTS_GUIDE.md)
- 🚀 **Wdrożenie**: [Deployment Guide](DEPLOYMENT.md)
- 🗺️ **Plany**: [Roadmapa](docs/ROADMAP.md)
- **Build tool**: Vite
- **Routing**: React Router v7
- **Wykresy**: Recharts
- **Icons**: Lucide React
- **Data**: Mock data (gotowe do integracji z API Sejmu)

## Setup lokalny

```bash
# Klonuj repo
git clone https://github.com/Kajtman/otwartyparlament.git
cd otwartyparlament

# Zainstaluj zależności
npm install

# Uruchom dev server
npm run dev

# Otwórz w przeglądarce
# http://localhost:5173
```

## Build dla produkcji

```bash
npm run build
npm run preview
```

## Struktura projektu

```
src/
├── pages/              # Główne strony aplikacji
│   ├── Home.tsx
│   ├── Poslowie.tsx
│   ├── MpProfile.tsx
│   ├── Glosowania.tsx
│   ├── VoteDetail.tsx
│   ├── Partie.tsx
│   ├── PartyProfile.tsx
│   ├── Rankingi.tsx
│   ├── TestWyborczy.tsx
│   └── OProjekcie.tsx
├── components/         # Reusable componenty
│   ├── Navigation.tsx
│   ├── Footer.tsx
│   ├── StatCard.tsx
│   ├── VoteCard.tsx
│   └── MpCard.tsx
├── data/              # Mock data
│   └── mockData.ts
├── types/             # TypeScript types
│   └── index.ts
└── App.tsx           # Root component
```

## Strony

### 🏠 Home
Strona główna z najważniejszymi głosowaniami, statystykami, najaktywniejszymi posłami i wykresami.

### 👥 Posłowie
Przeszukiwalna lista 460+ posłów z filtrowaniem po partii i sortowaniem. Każdy poseł ma szczegółowy profil z:
- Historią głosów
- Projektami ustaw
- Wskaźnikami aktywności i obecności
- Analizą zgodności z linią partii

### 🗳️ Głosowania
Baza 2800+ głosowań sejmowych z zaawansowanym filtrowaniem po:
- Tytule i opisie
- Kategorii (Prawo, Gospodarka, Zdrowie, itd.)
- Ważności
- Wyniku (przyjęto/odrzucono)

### 🎭 Partie
Profile 5 głównych klubów poselskich z:
- Wskaźnikami spójności i aktywności
- Porównaniem między partiami
- Listą najaktywniejszych posłów w partii

### 📊 Rankingi
Cztery kategorie rankingów:
1. Aktywność - najbardziej zaangażowani posłowie
2. Głosowania - najczęściej biorący udział
3. Obecność - najczęściej obecni
4. Projekty ustaw - najaktywniejsi legislacyjnie

### 🧪 Test wyborczy
Interaktywny quiz 10 pytań oparty na rzeczywistych głosowaniach. Po ukończeniu pokazuje, z którą partią Twoje poglądy są najbardziej zbieżne.

### ℹ️ O Projekcie
Opis misji, technologii, źródeł danych i planu na przyszłość.

## Integracja z danymi

Aplikacja używa mock data, ale jest gotowa do integracji z:
- **API Sejmu** - `api.sejm.gov.pl`
- **Publicznych zbiorów danych** - `dane.gov.pl`

Aby zintegrować rzeczywiste dane:
1. Zamień funkcje w `src/data/mockData.ts`
2. Dodaj fetch'owanie z API
3. Dodaj error handling i caching

## Development

```bash
# Lint kodu
npm run lint

# Type checking
npm run typecheck

# Build
npm run build
```

## Deployment

### Vercel

```bash
vercel
```

### GitHub Pages

```bash
npm run build
# Skopiuj zawartość `dist/` na branch `gh-pages`
```

## Źródła danych

Wszystkie dane pochodzą z publicznych, oficjalnych źródeł:
- [Sejm RP API](https://api.sejm.gov.pl)
- [Otwarte dane publiczne](https://dane.gov.pl)
- Media i prasa

## Licencja

MIT - Otwarty Parlament to projekt open source. Możesz go używać, modyfikować i rozpowszechniać.

## Wkład

Szukamy współtwórców! Jeśli chcesz wspomóc projekt:
1. Fork'nij repo
2. Stwórz feature branch (`git checkout -b feature/AmazingFeature`)
3. Commituj zmiany (`git commit -m 'Add some AmazingFeature'`)
4. Push do brancha (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

## Kontakt

- Email: info@otwartyparlament.pl
- GitHub: [@Kajtman](https://github.com/Kajtman)

## Podziękowania

Projekt dedykowany przejrzystości polskiego systemu parlamentarnego i każdemu obywatelowi, któremu zależy na demokracji.

---

**Otwarty Parlament** - Przejrzystość dla demokracji 🇵🇱
