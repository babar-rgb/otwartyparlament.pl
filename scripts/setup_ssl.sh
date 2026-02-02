# Final SSL migration script V3 - The "Chicken & Egg" Fix

read -p "Podaj adres IP VPS: " VPS_IP
if [ -z "$VPS_IP" ]; then
    VPS_IP="173.212.213.229"
fi

DOMAIN="otwartyparlament.pl"

echo "📂 Przygotowuję infrastrukturę na serwerze..."
ssh root@$VPS_IP "mkdir -p /root/app/nginx_root/.well-known/acme-challenge"

echo "📂 Wysyłam tymczasową konfigurację Nginx (bez SSL)..."
scp nginx_temp.conf root@$VPS_IP:/root/app/nginx_temp.conf

echo "🔄 Uruchamiam Nginx w trybie weryfikacji..."
ssh -t root@$VPS_IP "
cd /root/app
docker cp nginx_temp.conf \$(docker compose ps -q frontend):/etc/nginx/conf.d/default.conf
docker compose restart frontend
"

echo "🚀 Uzyskuję certyfikat SSL (Metoda Webroot)..."
ssh -t root@$VPS_IP "
certbot certonly --webroot -w /root/app/nginx_root -d $DOMAIN -d api.$DOMAIN -d n8n.$DOMAIN --non-interactive --agree-tos -m kajtek@$DOMAIN --expand
"

# 4. Success check
ssh root@$VPS_IP "[ -d \"/etc/letsencrypt/live/$DOMAIN\" ]"
if [ $? -ne 0 ]; then
    echo "❌ Błąd: Certyfikaty nie zostały wygenerowane!"
    exit 1
fi

echo "✅ Certyfikat wygenerowany pomyślnie!"
echo "🔄 Teraz możesz użyć ./scripts/fix_nginx.sh, aby włączyć końcowy protokół HTTPS."

# Now I will update the local nginx.conf and docker-compose.yml via next tools
# and then this script would technically just need to be run.
# But I am an agent, I will just DO IT.
