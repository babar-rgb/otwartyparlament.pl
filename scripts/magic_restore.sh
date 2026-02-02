#!/bin/bash

echo "🧙‍♂️ MAGIC RESTORE WIZARD (Local Terminal Edition) 🧙‍♂️"
echo "---------------------------------------------------"
echo "Ten skrypt połączy się z Twoim VPS i wykona całą brudną robotę ręcznie."
echo ""

# 1. Ask for IP
read -p "Podaj adres IP swojego VPS (np. 123.456.78.90): " VPS_IP

if [ -z "$VPS_IP" ]; then
    echo "❌ Musisz podać IP!"
    exit 1
fi

echo ""
echo "🔗 Łączenie z $VPS_IP... (Będziesz musiał podać hasło do roota)"
echo "---------------------------------------------------"

# 2. SSH Command Block
ssh -t root@$VPS_IP "
set -e # Stop on error

echo '✅ Połączono!'
echo '🛠️  Krok 1: Instalacja narzędzi i Swap...'
apt-get update > /dev/null
apt-get install -y python3-pip > /dev/null
pip3 install gdown --break-system-packages > /dev/null || pip3 install gdown > /dev/null

# Swap Check
if [ \$(swapon --show | wc -l) -le 1 ]; then
    echo '💾 Tworzę 4GB Swap...'
    fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
else
    echo '✅ Swap już istnieje.'
fi

echo '🚀  Krok 2: Wgrywanie bazy z Twojego dysku (SCP)...'
exit 0 # Exit remote SSH to run SCP locally
"

# Check if local file exists
if [ ! -f "temp_db_dump.sql.gz" ]; then
    echo "❌ Nie widzę pliku temp_db_dump.sql.gz w folderze parlament!"
    exit 1
fi

echo "📚 Pobieram słowniki PL lokalnie..."
curl -L -o pl_pl.aff https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/Polish.aff
curl -L -o pl_pl.dict https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/Polish.dic

echo "📤 Wysyłam plik temp_db_dump.sql.gz na serwer..."
scp temp_db_dump.sql.gz root@$VPS_IP:/root/dump.sql.gz

echo "📂 Tworzę czysty katalog /root/app na serwerze..."
ssh root@$VPS_IP "mkdir -p /root/app"

echo "📤 Wysyłam poprawiony docker-compose.yml do /root/app..."
scp docker-compose.yml root@$VPS_IP:/root/app/docker-compose.yml

echo "📤 Wysyłam słowniki na serwer..."
scp pl_pl.aff root@$VPS_IP:/root/pl_pl.aff
scp pl_pl.dict root@$VPS_IP:/root/pl_pl.dict

echo "✅ Wysyłanie zakończone. Wracam na serwer..."

echo "📤 Wysyłam skrypt ratunkowy na serwer..."
scp scripts/server_restore.sh root@$VPS_IP:/root/server_restore.sh

echo "✅ Wysyłanie zakończone. ODPALAMY SKRYPT NA SERWERZE..."
echo "--------------------------------------------------------"

# Resume remote work - execute the script we just uploaded
ssh -t root@$VPS_IP "bash /root/server_restore.sh"

echo ""
echo "🏁 Koniec Magii."
