# 🕵️‍♂️ Finalny Ekspercki Audyt Projektu

**Werdykt Ogólny**: Projekt jest w **Bardzo Dobrym** stanie (A-). Struktura jest czysta (`src`, `backend`, `scripts`), zależności są minimalne.

Jednak jako ekspert widzę **3 ukryte problemy (Luki)**, które mogą zemścić się w przyszłości.

---

## 🛑 Problem 1: "Rozdwojenie Jaźni" ETL (Code Duplication)

Masz dwa systemy pobierania danych, które ze sobą konkurują:
1.  **Modern**: `backend/etl/` (używany przez `scheduler.py`). Pliki: `incremental.py`, `europarl.py`.
2.  **Legacy/Manual**: `scripts/etl/` (uruchamiane z ręki?). Pliki: `incremental_etl.py`, `etl_europarl_votes.py`.

**Dowód**: `scripts/etl/incremental_etl.py` i `backend/etl/incremental.py` robią to samo (~7kb kodu każdy). Jeśli poprawisz błąd w jednym, drugi nadal będzie zepsuty.

**Rekomendacja**:
- **Natychmiast usunąć** duplikat `scripts/etl/incremental_etl.py`.
- Docelowo przenieść resztę (komisje, oświadczenia) z `scripts/etl/` do `backend/etl/` i podpiąć pod Schedulera.

---

## 🚧 Problem 2: TODO w Schedulerze

Plik `backend/services/scheduler.py` ma zakomentowane kluczowe funkcje:
```python
# 3. Europarl (TODO: migrate)
# 4. Interpellations (TODO: migrate)
```
Oznacza to, że automat **nie pobiera** danych z UE ani Interpelacji. Te systemy stoją.

**Rekomendacja**: Skopiować logikę z `scripts/import/import_interpellations.py` do nowego modułu `backend/etl/interpellations.py` i odkomentować w schedulerze.

---

## 🗑️ Problem 3: Zbędne Zależności w `scripts/`

W `scripts/etl/` masz skrypty takie jak:
- `etl_legislation_body.py`
- `etl_proceedings_agendas.py`
To brzmi jak eksperymenty. Czy one są używane? W `DATA_FLOW.md` nie widzę ich jako kluczowych.

---

## ✅ Co jest Super?

- **Frontend (`src/`)**: Zero uwag. Struktura `components/pages/hooks` jest książkowa.
- **Czystość Roota**: Po naszym sprzątaniu jest perfekcyjnie.
- **Docker/Deploy**: `DEPLOYMENT.md` i `postgrest.conf` wyglądają na gotowe do boju.

---

## 📉 Plan Naprawczy "Last Mile":

1.  ⚔️ **Kill Duplicate**: Usunąć `scripts/etl/incremental_etl.py`.
2.  🔗 **Link Scheduler**: Podpiąć Interpelacje do Schedulera (przenieść kod).

Czy mam wykonać ten ostateczny szlif (punkt 1 - usunięcie duplikatu)?
