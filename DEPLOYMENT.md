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

Stwórz plik `docker-compose.prod.yml` na serwerze (lub w repozytorium):

```yaml
version: '3.8'

services:
  # 1. BAZA DANYCH
  db:
    image: postgres:17
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: otwarty_parlament
    volumes:
      - pgdata:/var/lib/postgresql/data

  # 2. API (PostgREST)
  api:
    image: postgrest/postgrest
    restart: always
    environment:
      PGRST_DB_URI: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/otwarty_parlament
      PGRST_DB_SCHEMA: public
      PGRST_DB_ANON_ROLE: ${POSTGRES_USER}
      PGRST_JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3001:3000"
    depends_on:
      - db

  # 3. WORKER (ETL & Scheduler)
  worker:
    build: 
      context: .
      dockerfile: Dockerfile.worker
    restart: always
    environment:
      POSTGRES_HOST: db
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    depends_on:
      - db

volumes:
  pgdata:
```

---

## 👣 Krok 3: Pliki Dockerfile

Musisz dodać `Dockerfile.worker` do repozytorium, aby zbudować obraz Pythona:

```dockerfile
# Dockerfile.worker
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y libpq-dev gcc

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy logic
COPY backend/ backend/
COPY scripts/ scripts/

# Start Scheduler
CMD ["python3", "-m", "backend.services.scheduler"]
```

---

## 👣 Krok 4: Frontend (Opcje)

Masz dwie drogi:

**Opcja A: Static Hosting (Zalecane)**
Zbuduj aplikację lokalnie (`npm run build`) i wrzuć folder `dist/` na serwer Nginx, albo podepnij repo pod Vercel/Netlify.
*   Zaleta: CDN, szybkość, zero konfiguracji serwera.
*   Konfiguracja: Ustaw `VITE_POSTGREST_URL=https://api.twojadomena.pl` w panelu Vercel.

**Opcja B: Docker na serwerze**
Dodaj kontener Nginx do `docker-compose`, który serwuje pliki z `dist`.

---

## 🔄 Deployment Workflow (CI/CD)

Jak wdrażać zmiany? Zdefiniujmy **Github Actions** (`.github/workflows/deploy.yml`):

1.  **Push to main**: Kiedy wrzucasz kod na GitHub.
2.  **Build**: GitHub buduje obrazy Dockera.
3.  **Deploy**: GitHub łączy się z Twoim serwerem przez SSH i wykonuje:

```bash
cd /opt/parlament
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Prosty skrypt `deploy.sh` na serwerze:
Jeśli nie chcesz pełnego CI/CD, stwórz skrypt na serwerze:

```bash
#!/bin/bash
echo "🚀 Updating..."
cd /opt/parlament
git pull
docker compose -f docker-compose.prod.yml up -d --build worker
# Restart API on config change (optional)
docker compose -f docker-compose.prod.yml restart api
echo "✅ Done!"
```

Wystarczy, że zalogujesz się i wpiszesz `./deploy.sh`.

---

## 🛡️ Bezpieczeństwo (Reverse Proxy)

Nie wystawiaj portu 3001 bezpośrednio! Użyj **Nginx** i **Certbot** (SSL).

Konfiguracja Nginx (`/etc/nginx/sites-available/api.twojadomena.pl`):

```nginx
server {
    server_name api.twojadomena.pl;

    location / {
        proxy_pass http://localhost:3001; # PostgREST
        proxy_set_header Host $host;
    }
}
```

Uruchom `sudo certbot --nginx` aby dodać HTTPS.

---

## 🧩 Podsumowanie

1.  **Baza i API**: W kontenerach Docker (stabilność).
2.  **Logika**: Kontener `worker` z Pythonem (automatyczne ETL).
3.  **Frontend**: Vercel/Netlify (najprościej) lub Nginx.
4.  **Aktualizacje**: `git pull && docker compose up -d`.
