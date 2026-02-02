#!/bin/bash
read -p "Podaj adres IP VPS (np. 173.212.213.229): " VPS_IP
if [ -z "$VPS_IP" ]; then
    VPS_IP="173.212.213.229"
fi

echo "🔍 DEBUGOWANIE GŁĘBOKIE..."
ssh -t root@$VPS_IP "
echo '====== 1. TEST ROUTINGU (Nginx -> Backend) ======'
# Zobaczmy co zwraca curl (czy 404, 500, czy JSON?)
curl -v http://localhost/api/votes 2>&1 | head -n 20
echo '-------------------------------------'

echo '====== 2. DANE W BAZIE (Próbka) ======'
# Sprawdźmy czy term w ogóle jest ustawiony na 10
docker exec \$(docker ps -qf name=db | head -n 1) psql -U kajtek -d otwarty_parlament -c \"SELECT sitting, date, title_clean, term FROM votes LIMIT 5;\"

echo '====== 3. LOGI NGINX (Ostatnie requesty) ======'
docker logs --tail 20 \$(docker ps -qf name=frontend | head -n 1)

echo '====== 4. LOGI BACKEND (Czy są błędy 500?) ======'
docker logs --tail 20 \$(docker ps -qf name=backend | head -n 1)
"
