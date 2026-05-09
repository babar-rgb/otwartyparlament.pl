---
trigger: always_on
---

# Refactor: Dług techniczny — dzial zagraniczny (2026-05-09)

## main.js

### 1. Wydzielone 3 helper functions (przed `const state`)
- `renderLedgerItem(v)` — renderuje jeden wiersz głosowania (ledger item)
- `renderClubItem(club)` — renderuje jeden kafelek klubu
- `renderMpCard(mp)` — renderuje kartę posła (mp-card-minimal)

**Zasada**: HTML komponentów żyje WYŁĄCZNIE w helperze. Template i input handler
wywołują helper — nigdy nie inline'ują HTML samodzielnie.

### 2. Naprawiono inicjalizację state
`state.filters.voteSearch` nie był zainicjalizowany — dodano `voteSearch: ''`.

### 3. Naprawiono getCategoryIcon
Funkcja ignorowała argument `type`. Teraz używa mapy ikon:
`security`, `finance`, `health`, `law` → własne SVG. Fallback: `security`.

### 4. Lepszy error handling w fetchProcessDetails
Dodano `console.error()` + sensowny komunikat zamiast ogólnego 'Błąd ładowania.'

## index.html

### 5. Naprawiono martwe linki w mega menu
Sekcje SĄDOWNICTWO i EKOLOGIA miały `<li>` bez `<a>`.
Wszystkie linki kierują teraz do `#szukaj/{fraza}`.
