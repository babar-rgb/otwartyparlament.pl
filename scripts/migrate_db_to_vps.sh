#!/bin/bash

# ==========================================
# 📦 Otwarty Parlament - DB Migration Tool
# ==========================================
# Skrypt do przenoszenia całej bazy danych z Twojego komputera na serwer VPS.
# Użycie: bash scripts/migrate_db_to_vps.sh <USER>@<IP_SERWERA>
# Np.:    bash scripts/migrate_db_to_vps.sh root@123.456.78.90
# ==========================================

if [ -z "$1" ]; then
    echo "❌ Błąd: Podaj adres serwera."
    echo "Użycie: bash migrate_db_to_vps.sh uzytkownik@ip-serwera"
    exit 1
fi

REMOTE_HOST=$1
DUMP_FILE="parlament_dump_$(date +%F).sql"
REMOTE_DIR="~/parlament"

echo "=========================================="
echo "🐘 KROK 1: Eksport lokalnej bazy danych..."
echo "=========================================="

# Zakładamy, że lokalnie baza działa w Dockerze (lub natywnie)
# Sprawdzamy czy kontener db działa
if docker ps | grep -q "parlament-db"; then
    echo "📦 Wykryto Docker. Robię zrzut z kontenera..."
    # Zrzut danych (z pominięciem właściciela tabel, żeby uniknąć błędów uprawnień)
    docker exec parlament-db pg_dump -U kajtek -d otwarty_parlament --no-owner --clean > $DUMP_FILE
else
    echo "📦 Próba zrzutu z lokalnego Postgresa (port 5432)..."
    PGPASSWORD=password pg_dump -h localhost -U kajtek -d otwarty_parlament --no-owner --clean > $DUMP_FILE
fi

if [ ! -f "$DUMP_FILE" ]; then
    echo "❌ Błąd: Nie udało się utworzyć pliku $DUMP_FILE"
    exit 1
fi

echo "✅ Zrzut gotowy: $DUMP_FILE ($(du -h $DUMP_FILE | cut -f1))"

echo "=========================================="
echo "🚀 KROK 2: Wysyłanie na serwer ($REMOTE_HOST)..."
echo "=========================================="
scp $DUMP_FILE $REMOTE_HOST:$REMOTE_DIR/$DUMP_FILE

echo "=========================================="
echo "📥 KROK 3: Importowanie na serwerze..."
echo "=========================================="

ssh $REMOTE_HOST << EOF
    set -e
    cd $REMOTE_DIR
    
    echo "🛑 Zatrzymywanie backendu (żeby nikt nie psuł danych)..."
    docker compose -f docker-compose.prod.yml stop backend

    echo "♻️  Przywracanie bazy danych (Może to chwilę potrwać)..."
    # Kopiujemy plik do kontenera
    docker cp $DUMP_FILE $(docker compose -f docker-compose.prod.yml ps -q db):/tmp/dump.sql
    
    # Wykonujemy import
    docker compose -f docker-compose.prod.yml exec -T db psql -U admin -d otwarty_parlament -f /tmp/dump.sql

    echo "🚀 Uruchamianie backendu..."
    docker compose -f docker-compose.prod.yml start backend
    
    # Sprzątanie
    rm $DUMP_FILE
    echo "✅ Gotowe! Twoja lokalna baza jest teraz na produkcji."
EOF

# Sprzątanie lokalne
rm $DUMP_FILE
echo "🎉 Operacja zakończona sukcesem!"
