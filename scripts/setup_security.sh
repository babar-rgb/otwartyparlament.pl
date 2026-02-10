#!/bin/bash
# 🛡️ Otwarty Parlament - VPS Security Lockdown Script
# Ten skrypt zabezpiecza dostęp do serwera (SSH + Firewall)

if [ "$EUID" -ne 0 ]; then 
  echo "❌ Proszę uruchom ten skrypt jako root (sudo)!"
  exit
fi

echo "🚀 Rozpoczynam procedurę zabezpieczania (Lockdown)..."

# 1. Firewall (UFW)
echo "🔥 Konfiguruję UFW (Firewall)..."
if ! command -v ufw &> /dev/null; then
    apt-get update && apt-get install -y ufw
fi

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
echo "y" | ufw enable

# 2. SSH Hardening
echo "🔒 Blokuję dostęp hasłem w SSH..."
SSHD_CONFIG="/etc/ssh/sshd_config"

# Backup starej konfiguracji
cp $SSHD_CONFIG "$SSHD_CONFIG.bak.$(date +%F_%T)"

# Zmiana ustawień
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' $SSHD_CONFIG
sed -i 's/#PasswordAuthentication no/PasswordAuthentication no/' $SSHD_CONFIG
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' $SSHD_CONFIG
sed -i 's/#PermitRootLogin/PermitRootLogin/' $SSHD_CONFIG

# Przeładowanie SSH
systemctl reload ssh || systemctl reload sshd

echo "----------------------------------------------------"
echo "✅ SUKCES: Serwer został zablokowany!"
echo "❌ Logowanie hasłem: WYŁĄCZONE"
echo "❌ Logowanie na root: WYŁĄCZONE"
echo "✅ Firewall: AKTYWNY (Dozwolone: SSH, HTTP, HTTPS)"
echo "----------------------------------------------------"
echo "⚠️  UWAGA: Nie zamykaj tej sesji SSH, dopóki nie sprawdzisz"
echo "    w nowym oknie, że Twój klucz SSH nadal działa!"
