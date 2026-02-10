# 🛡️ Database Backup & Restore Guide

Aby uniknąć utraty danych, regularnie wykonuj backup.

## 1. Jak zrobić backup?

Uruchom przygotowany skrypt:

```bash
./scripts/backup_db.sh
```

- Skrypt utworzy folder `backups/` w głównym katalogu projektu.
- Utworzy plik `.sql` z aktualną datą, np. `backups/otwarty_parlament-2026-01-14_13-45-00.sql`.
- Wyświetli rozmiar pliku.

Możesz też dodać to do Crona, aby robiło się samo (np. codziennie o 3:00):
`0 3 * * * /Users/kajtek/sejm/git/parlament/scripts/backup_db.sh`

---

## 2. Jak przywrócić dane?

Jeśli kiedyś baza zniknie lub coś uszkodzisz, wykonaj:

### Krok A: Upewnij się, że baza istnieje (i jest pusta)
Jeśli bazy nie ma:
```bash
createdb otwarty_parlament
```

### Krok B: Wczytaj backup
Podaj ścieżkę do pliku backupu, który chcesz przywrócić:

```bash
psql otwarty_parlament < backups/otwarty_parlament-TWOJA-DATA.sql
```

✅ To przywróci wszystkie tabele i dane do stanu z momentu backupu.
