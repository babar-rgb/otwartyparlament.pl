#!/bin/bash
read -p "Podaj adres IP VPS (np. 173.212.213.229): " VPS_IP
if [ -z "$VPS_IP" ]; then
    VPS_IP="173.212.213.229"
fi

echo "🔍 Sprawdzam config Nginx wewnątrz kontenera..."
ssh -t root@$VPS_IP "
FRONTEND_ID=\$(docker ps -qf name=frontend | head -n 1)
if [ -n \"\$FRONTEND_ID\" ]; then
    echo \"Kontener ID: \$FRONTEND_ID\"
    echo \"--------------------------------\"
    docker exec \$FRONTEND_ID cat /etc/nginx/conf.d/default.conf
else
    echo \"❌ Nie znaleziono kontenera frontend!\"
fi
"
