#!/bin/bash
set -e

# ONLY the primary backend (uvicorn) manages the database schema
# This prevents race conditions when both backend and orchestrator start simultaneously
if [ "$1" = "uvicorn" ]; then
    echo "🚀 [Database] Stability Shield: Initiating pre-migration sequence..."
    
    # 1. Create Safety Backup
    echo "💾 [Backup] Creating safety restore point..."
    mkdir -p /app/backend/backups
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    # Ensure backups are persistent by mounting /app/backend/backups in docker-compose
    PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER $POSTGRES_DB > /app/backend/backups/pre_migration_$TIMESTAMP.sql || echo "⚠️ Backup failed, proceeding with caution..."
    
    # 2. Run Migrations
    echo "🔄 [Database] Syncing schema (Alembic)..."
    cd /app/backend && alembic upgrade head
    cd /app
    
    echo "🌐 [Backend] Starting FastAPI..."
    exec "$@"
elif [ "$1" = "--status" ]; then
    # Direct status check
    exec python3 backend/orchestrator.py "$@"
else
    # Orchestrator worker or other scripts
    # It will wait for backend to be healthy (which means migrations are done) 
    # due to depends_on in docker-compose.yml
    echo "🧠 [Orchestrator] Starting worker (schema managed by backend)..."
    exec python3 backend/orchestrator.py "$@"
fi
