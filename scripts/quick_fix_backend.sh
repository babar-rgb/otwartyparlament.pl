#!/bin/bash
read -p "Podaj adres IP VPS (np. 173.212.213.229): " VPS_IP
if [ -z "$VPS_IP" ]; then
    VPS_IP="173.212.213.229"
fi

echo "🩹 Szybki FIX Backend (bez resetowania bazy)..."
echo "📂 Wysyłam poprawiony docker-compose.yml..."

# Determine correct remote path (we know it's /root/app from magic_restore)
scp docker-compose.yml root@$VPS_IP:/root/app/docker-compose.yml

echo "🔄 Restartuję Backend z nową konfiguracją..."
ssh -t root@$VPS_IP "
cd /root/app
docker compose up -d backend
echo '✅ Backend zrestartowany. Czekam 10s...'
sleep 10
echo '📜 Sprawdzam logi...'
docker logs --tail 20 \$(docker ps -qf name=backend | head -n 1)
"
