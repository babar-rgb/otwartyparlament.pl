# Raport Stanu Bazy Danych (Local Data Fortress)

## Status Ogólny
Baza danych jest **lokalna**, **pełna** i **niezależna**.
System działa w oparciu o silnik PostgreSQL zainstalowany natywnie na Twoim macOS (Port 5432).

## Statystyki Danych (Hard Data)

| Tabela | Liczba Rekordów | Rozmiar na Dysku | Opis |
| :--- | :--- | :--- | :--- |
| `vote_results` | **9,216,969** | ~1.3 GB | Indywidualne głosy posłów (Historia) |
| `votes` | **12,594** | 27 MB | Głosowania (Nagłówki) |
| `mps` | **973** | 1.1 MB | Posłowie (Obecni i byli) |
| `speeches` | **933** | 790 MB | Wystąpienia (Transkrypcje) |
| `euro_vote_results` | 193,230 | 32 MB | Głosowania w Europarlamencie |

Całkowity rozmiar bazy: **~2.2 GB**

## Architektura Połączenia
Aplikacja (Frontend + Backend) działa w kontenerach Docker, ale korzysta z tzw. "tunelu" (`host.docker.internal`), aby dostać się do tych danych na Twoim dysku.
Dzięki temu masz wydajność Dockera, ale trwałość danych lokalnych.

## Czystość (Debranding)
Klient bazy danych w kodzie (`src/lib/db.ts`) został zanonimizowany jako `postgrest-client`. Nie ma zależności od chmury.

## Wnioski
Masz jedną z najbardziej kompletnych lokalnych baz danych polskiego parlamentaryzmu. To potężne zasoby.
