#!/bin/bash
read -p "Podaj adres IP VPS (np. 173.212.213.229): " VPS_IP
if [ -z "$VPS_IP" ]; then
    VPS_IP="173.212.213.229"
    echo "Używam domyślnego IP: $VPS_IP"
fi

echo "🕵️‍♂️ Diagnostyka Backend (dlaczego nie widzi danych?)..."
ssh -t root@$VPS_IP "
echo '--------------------------------'
echo '🐳 Status kontenerów:'
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo ''
echo '--------------------------------'
echo '📜 Logi Backend (ostatnie 50 linii):'
echo '--------------------------------'
# Find backend container dynamically
BACKEND_ID=\$(docker ps -qf name=backend | head -n 1)
if [ -n \"\$BACKEND_ID\" ]; then
    docker logs --tail 50 \$BACKEND_ID
else
    echo '❌ Nie znaleziono kontenera Backend!'
fi

echo ''
echo '--------------------------------'
echo '🌐 Test wewnętrznego API (z poziomu serwera):'
echo '--------------------------------'
# Try to curr localhost:8000 where backend is mapped
echo 'Test GET http://localhost:8000/api/votes ...'
curl -I -m 5 http://localhost:8000/api/votes || echo '❌ Curl failed'

echo ''
echo 'Test GET http://localhost:8000/docs ...'
curl -I -m 5 http://localhost:8000/docs || echo '❌ Curl failed'
"
