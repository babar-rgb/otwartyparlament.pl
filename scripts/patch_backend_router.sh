#!/bin/bash
read -p "Podaj adres IP VPS (np. 173.212.213.229): " VPS_IP
if [ -z "$VPS_IP" ]; then
    VPS_IP="173.212.213.229"
fi

echo "🩹 Patchowanie routingu Backend (main.py)..."
echo "📂 Wysyłam backend/main.py..."

# Upload main.py to the correct location inside app
scp backend/main.py root@$VPS_IP:/root/app/backend/main.py

echo "🔄 Restartuję Backend..."
ssh -t root@$VPS_IP "
cd /root/app
# Volume is NOT mounted, so we must copy file INTO container or rebuild.
# Rebuild takes too long, so hot-patching via docker cp
BACKEND_ID=\$(docker ps -qf name=backend | head -n 1)
if [ -n \"\$BACKEND_ID\" ]; then
    echo \"Patcher: Kopiuję main.py do kontenera \$BACKEND_ID...\"
    docker cp backend/main.py \$BACKEND_ID:/app/backend/main.py
    
    echo \"Patcher: Restartuję kontener...\"
    docker restart \$BACKEND_ID
    echo '✅ Backend zrestartowany z NOWYM kodem. Czekam 5s...'
    sleep 5
else
    echo '❌ Nie znaleziono kontenera backend!'
fi
"
