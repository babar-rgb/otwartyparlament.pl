#!/bin/bash

# ==========================================
# 🚀 Otwarty Parlament - VPS Auto-Setup Script
# ==========================================
# Uruchom ten skrypt na świeżym serwerze Ubuntu 22.04/24.04
# bash deploy_vps.sh
# ==========================================

set -e # Zatrzymaj skrypt jeśli wystąpi błąd

echo "📦 Aktualizacja systemu..."
sudo apt update && sudo apt upgrade -y

echo "🐳 Instalacja Docker & Docker Compose..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker zainstalowany."
else
    echo "✅ Docker już jest zainstalowany."
fi

echo "📂 Pobieranie kodu (Git)..."
# Upewnij się, że masz token lub klucz SSH, jeśli repo jest prywatne
if [ ! -d "parlament" ]; then
    # ZAMIENZ_URL_NA_SWOJE_REPO
    echo "⚠️  Podaj URL do repozytorium GitHub (np. https://github.com/twoj-login/parlament.git):"
    read REPO_URL
    git clone $REPO_URL parlament
else
    echo "✅ Katalog 'parlament' już istnieje. Pomijam klonowanie."
fi

cd parlament

echo "⚙️ Konfiguracja .env (Produkcja)..."
if [ ! -f .env.prod ]; then
    echo "Tworzę plik .env.prod..."
    cat <<EOT >> .env.prod
# Baza Danych
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=otwarty_parlament
POSTGRES_USER=admin
POSTGRES_PASSWORD=$(openssl rand -hex 12)

# Frontend
VITE_API_BASE_URL=https://api.twojadomena.pl
VITE_API_ANON_KEY=
GEMINI_API_KEY=
EOT
    echo "⚠️  STWORZONO .env.prod! MUSISZ GO EDYTOWAĆ PRZED STARTEM: nano .env.prod"
    echo "   (Wpisz klucze API i popraw domenę)"
else
    echo "✅ Plik .env.prod już istnieje."
fi

echo "🚀 Uruchamianie Aplikacji..."
# Używamy konfigu produkcyjnego
docker compose -f docker-compose.prod.yml up -d --build

echo "=========================================="
echo "✅ WDROŻENIE ZAKOŃCZONE!"
echo "=========================================="
echo "Twoja aplikacja powinna wstać za kilka minut."
echo "1. Sprawdź logi: docker compose logs -f"
echo "2. Pamiętaj, aby skonfigurować domenę w pliku 'Caddyfile'!"
