# 🚀 Poradnik Wdrożenia (Self-Hosted Deployment)

> Dokumentacja opisuje, jak uruchomić system "Otwarty Parlament" na własnym serwerze (VPS/Linux) oraz jak aktualizować go o nowe wersje.

---

## 🛠️ Wymagania Wstępne

1.  **Serwer VPS**: System Linux (Ubuntu 22.04 LTS lub nowszy).
2.  **Zasoby**: Min. 2 vCPU, 4GB RAM (zalecane 8GB dla ETL).
3.  **Domeny**: Np. `api.twojadomena.pl` (Backend) i `twojadomena.pl` (Frontend).
4.  **Oprogramowanie**:
    *   Docker & Docker Compose
    *   Git
    *   Nginx (jako Reverse Proxy)

---

## 🏗️ Architektura Wdrożenia (Docker Compose)

Najprostszym i najczystszym sposobem jest konteneryzacja całej aplikacji. Stworzymy plik `docker-compose.yml`, który uruchomi 3 kontenery:

1.  **db**: Baza danych PostgreSQL 17.
2.  **api**: Serwer PostgREST.
3.  **worker**: Kontener Python wykonujący ETL i Scheduler (to, co teraz robi Twój komputer w tle).
4.  *(Opcjonalnie)* **frontend**: Serwer Nginx serwujący pliki React (lub możesz użyć Vercel/Netlify dla prostoty).

---

## 👣 Krok 1: Konfiguracja Serwera

Zaloguj się na serwer i przygotuj środowisko:

```bash
# update
sudo apt update && sudo apt upgrade -y

# install docker
curl -fsSL https://get.docker.com | sh
```

Sklonuj repozytorium:
```bash
git clone https://github.com/twoj-user/parlament.git /opt/parlament
cd /opt/parlament
```

---

## 👣 Krok 2: Docker Compose (`docker-compose.yml`)

## 👣 Krok 2: Uruchomienie (`docker-compose.prod.yml`)

W repozytorium znajduje się już przygotowany plik `docker-compose.prod.yml`. Aby uruchomić aplikację:

1. Stwórz plik `.env` na serwerze (na bazie `.env.example`) i uzupełnij sekretne dane:
   ```bash
   cp .env.example .env
   nano .env
   ```
   **Ważne:** Ustaw `VITE_POSTGREST_URL` na swój publiczny adres API (np. `https://api.mojadomena.pl`) oraz zmień `POSTGRES_PASSWORD`.

2. Uruchom kontenery:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

Domyślnie `frontend` będzie dostępny na porcie `80`. Baza danych i API są schowane w wewnętrznej sieci Docker i nie są wystawione na świat (bezpieczeństwo).

---

## 👣 Krok 3: Konfiguracja Bezpieczeństwa (Nginx i SSL)

Zalecamy postawienie **Nginx** bezpośrednio na hostingu (poza Dockerem) jako Reverse Proxy, aby obsłużyć SSL (Let's Encrypt).

Przykładowa konfiguracja `/etc/nginx/sites-available/parlament`:

```nginx
server {
    server_name mojadomena.pl;

    location / {
        proxy_pass http://localhost:80; # Frontend (Docker)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    server_name api.mojadomena.pl;

    location / {
        # Musisz wystawić API w docker-compose.prod.yml na np. 3001, jeśli chcesz mieć do niego dostęp publiczny.
        # W sekcji 'api' w docker-compose.prod.yml dodaj:
        # ports:
        #   - "3001:3000"
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }
}
```

Następnie:
```bash
sudo certbot --nginx -d mojadomena.pl -d api.mojadomena.pl
```

---

## 🔄 Jak Aktualizować?

Prosty skrypt update'ujący:

```bash
#!/bin/bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f # Usuń stare obrazy
```

