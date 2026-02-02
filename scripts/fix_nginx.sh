#!/bin/bash
read -p "Podaj adres IP VPS (np. 173.212.213.229): " VPS_IP
if [ -z "$VPS_IP" ]; then
    VPS_IP="173.212.213.229"
fi

echo "🔌 Synchronizuję konfigurację z VPS..."
# Upload files
scp -o ConnectTimeout=10 nginx.conf root@$VPS_IP:/root/app/nginx.conf
scp -o ConnectTimeout=10 docker-compose.yml root@$VPS_IP:/root/app/docker-compose.yml

echo "🔄 Restartuję stos Docker (up -d)..."
ssh -o ConnectTimeout=15 root@$VPS_IP "cd /root/app && docker compose up -d"

echo "🔄 Aktualizuję Nginx wewnątrz kontenera..."
ssh -o ConnectTimeout=15 root@$VPS_IP "
cd /root/app
FRONTEND_ID=\$(docker ps -qf name=frontend | head -n 1)
if [ -n \"\$FRONTEND_ID\" ]; then
    echo \"📂 Kopiuję nginx.conf do kontenera \$FRONTEND_ID...\"
    docker cp nginx.conf \$FRONTEND_ID:/etc/nginx/conf.d/default.conf
    echo \"🔄 Przeładowuję Nginx...\"
    docker exec \$FRONTEND_ID nginx -s reload
    echo \"✅ Gotowe! Sprawdź stronę.\"
else
    echo \"❌ BŁĄD: Nie znaleziono kontenera frontend!\"
    docker ps
fi
"
