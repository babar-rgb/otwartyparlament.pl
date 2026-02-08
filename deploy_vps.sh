#!/bin/bash
# Stability Shield VPS Deploy v1.1
# Skrypt do „pancernego” wdrażania zmian.

set -e # Przerwij natychmiast, jeśli dowolna komenda zawiedzie

echo "🛡️ [Stability Shield] Rozpoczynam procedurę bezpiecznego wdrożenia..."

# 1. Pre-flight Check
echo "🔍 [Pre-flight] Sprawdzanie środowiska..."
if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Błąd: Nie znaleziono docker-compose ani docker compose."
    exit 1
fi
echo "✅ Używam: $DOCKER_COMPOSE"

# 2. Pull latest code
echo "📥 [Git] Pobieranie zmian..."
git pull origin main

# 3. Build images
echo "🏗️ [Docker] Budowanie obrazów (w tle)..."
$DOCKER_COMPOSE build --pull

# 4. Deploy
echo "🔄 [Docker] Aktualizacja kontenerów..."
$DOCKER_COMPOSE up -d --remove-orphans

echo "⏳ [System] Oczekiwanie na inicjację bazy i start API (15s)..."
sleep 15

# 5. Final Audit
echo "🏥 [Health Check] Weryfikacja stanu systemu..."

$DOCKER_COMPOSE ps

# Deep Health Check (Backend + DB Connection)
echo "🌐 Sprawdzanie API Backend..."
ATTEMPTS=0
MAX_ATTEMPTS=3
while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    HEALTH=$(curl -s http://localhost:8000/health | grep -c "ok" || echo 0)
    if [ "$HEALTH" -eq "1" ]; then
        echo "✅ API Backend: STABILNE (Połączenie z DB poprawne)"
        break
    else
        echo "⏳ API jeszcze nie odpowiada, próba $((ATTEMPTS+1))/$MAX_ATTEMPTS..."
        sleep 5
        ATTEMPTS=$((ATTEMPTS+1))
    fi
done

if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
    echo "❌ [ALERT] Backend nie przeszedł testu zdrowia! Sprawdź logi: $DOCKER_COMPOSE logs backend"
    exit 1
fi

# Orchestrator Health
echo "🧠 Sprawdzanie Orchestrator..."
OS_STATUS=$($DOCKER_COMPOSE exec -T orchestrator python3 backend/orchestrator.py --status | grep -c "HEALTHY" || echo 0)
if [ "$OS_STATUS" -eq "1" ]; then
    echo "✅ Orchestrator: STABILNY (Heartbeat OK)"
else
    echo "⚠️ [Ostrzeżenie] Orchestrator nie zgłosił jeszcze gotowości, ale kontener działa."
fi

echo "🚀 [SUCCESS] System wdrożony i zweryfikowany pod osłoną Stability Shield."
