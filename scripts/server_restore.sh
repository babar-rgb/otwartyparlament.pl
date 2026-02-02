#!/bin/bash
set -e

# Find project dir (simple guess or default)
PROJECT_DIR=$(find /root -name docker-compose.yml -exec dirname {} \; | head -n 1)
cd $PROJECT_DIR
echo "📂 Katalog projektu: $PROJECT_DIR"

# Verify Image in docker-compose.yml
echo "🔍 Weryfikacja obrazu w docker-compose.yml..."
if grep -q "pgvector" docker-compose.yml; then
  echo "✅ Wykryto obraz pgvector!"
else
  echo "⚠️ OSTRZEŻENIE: Nie widzę 'pgvector' w docker-compose.yml! Czy na pewno plik się nadpisał?"
  echo "📄 Zawartość (pierwsze 10 linii):"
  head -n 10 docker-compose.yml
fi

echo "☢️  INICJALIZACJA TRYBU NUCLEARNEGO (PEŁNY RESET) ☢️"
echo "🧨 Zatrzymuję i usuwam WSZYSTKIE kontenery..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

echo "🧹 Czyszczę system (obrazy, cache, wolumeny)..."
docker system prune -a --volumes -f 

# Find project dir (simple guess or default)
PROJECT_DIR=$(find /root -name docker-compose.yml -exec dirname {} \; | head -n 1)
# Ensure we have a place to work
if [ -z "$PROJECT_DIR" ]; then 
    mkdir -p /root/app
    PROJECT_DIR="/root/app"
fi
cd $PROJECT_DIR
echo "📂 Katalog projektu: $PROJECT_DIR"

# Verify Image in docker-compose.yml (if file exists, logic ok)
echo "🔍 Weryfikacja obrazu w docker-compose.yml..."
if [ -f docker-compose.yml ]; then
    if grep -q "pgvector" docker-compose.yml; then
      echo "✅ Wykryto obraz pgvector!"
    else
      echo "⚠️ OSTRZEŻENIE: Nie widzę 'pgvector' w docker-compose.yml!"
      head -n 10 docker-compose.yml
    fi
else
    echo "⚠️ Brak pliku docker-compose.yml w $PROJECT_DIR! (Skrypt lokalny powinien go wrzucić)"
fi

# Pull new image (Fresh Pull)
echo "⬇️  Pobieram świeży obraz pgvector..."
docker compose pull db
# Start db
docker compose up -d db
echo '⏳ Czekam 20s na start czystej bazy...'
sleep 20

echo '📚 Krok 4b: Instalacja słowników PL w kontenerze...'
# Copy dictionaries from host to container
DB_ID=$(docker compose ps -q db)
# Ensure files exist where we expect them
if [ -f /root/pl_pl.aff ]; then
    docker cp /root/pl_pl.aff $DB_ID:/usr/share/postgresql/15/tsearch_data/pl_pl.aff
    docker cp /root/pl_pl.dict $DB_ID:/usr/share/postgresql/15/tsearch_data/pl_pl.dict
    # Fix permissions
    docker exec -u 0 $DB_ID chown postgres:postgres /usr/share/postgresql/15/tsearch_data/pl_pl.aff
    docker exec -u 0 $DB_ID chown postgres:postgres /usr/share/postgresql/15/tsearch_data/pl_pl.dict
    echo "✅ Słowniki zainstalowane."
fi

# Get Container ID again
DB_ID=$(docker ps -qf name=db | head -n 1)

echo '🔧 Krok 5: Fix Usera (Emergency)...'
docker exec $DB_ID psql -U postgres -c "CREATE USER kajtek WITH SUPERUSER PASSWORD 'password';" 2>/dev/null || true
docker exec $DB_ID psql -U postgres -c "ALTER USER kajtek WITH SUPERUSER;" 2>/dev/null || true
docker exec $DB_ID psql -U postgres -c "CREATE DATABASE otwarty_parlament OWNER kajtek;" 2>/dev/null || true

echo '▶️  Krok 7: IMPORT (STREAMING - Oszczędzamy Dysk)...'
# Use streaming (zcat | psql) to avoid unzipping to disk (saves ~15GB space)
# We trust SWAP to handle the memory overhead
zcat /root/dump.sql.gz | docker exec -i -e PGPASSWORD=password $DB_ID psql -U kajtek -d otwarty_parlament > /root/restore.log 2>&1 || echo "⚠️ Import zgłosił błędy, sprawdź log..."

echo '✅ ODPALANIE RESZTY...'
docker compose up -d

echo '🎉 SKOŃCZONE! Sprawdź logi: /root/restore.log'

