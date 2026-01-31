#!/bin/bash
# Script to migrate LOCAL database to VPS
# Usage: ./migrate_db.sh

VPS_IP="173.212.213.229"
VPS_USER="root"
LOCAL_DB="otwarty_parlament"
REMOTE_CONTAINER="app-db-1"
REMOTE_DB="otwarty_parlament"
REMOTE_USER="kajtek"

echo "🚀 Starting Database Migration: Local ($LOCAL_DB) -> VPS ($VPS_IP)..."
echo "ℹ️  Method: Streaming (No temp files)"

# Check and Find Container
echo "🔍 Searching for DB container on VPS..."
echo "👉 Please enter VPS password when prompted to find the container ID:"
SSH_OUTPUT=$(ssh -o ConnectTimeout=10 $VPS_USER@$VPS_IP "docker ps -qf name=db | head -n 1" 2>&1)
SSH_EXIT_CODE=$?

if [ $SSH_EXIT_CODE -ne 0 ]; then
    echo "❌ SSH Connection Failed:"
    echo "$SSH_OUTPUT"
    echo "💡 Check your password and internet connection."
    exit 1
fi

REMOTE_CONTAINER_ID=$(echo "$SSH_OUTPUT" | tr -d '\r')

if [ -z "$REMOTE_CONTAINER_ID" ]; then
    echo "⚠️  Running container not found. Checking stopped containers..."
    REMOTE_CONTAINER_ID=$(ssh $VPS_USER@$VPS_IP "docker ps -aqf name=db | head -n 1" | tr -d '\r')
    
    if [ -z "$REMOTE_CONTAINER_ID" ]; then
        echo "❌ Error: Could not find ANY container (running or stopped) with 'db' in name."
        echo "   Debug info: $(ssh $VPS_USER@$VPS_IP 'docker ps -a')"
        exit 1
    else
        echo "⚠️  Found STOPPED container: $REMOTE_CONTAINER_ID. Creating dump anyway (might fail if specific DB is needed running)..."
        # Actually usually we need it running to psql into it.
        echo "❌ Error: Database container is STOPPED. Please restart it via GitHub Actions (Deploy) or SSH."
        exit 1
    fi
fi

echo "✅ Found Container ID: $REMOTE_CONTAINER_ID"
echo "🔐 You will be asked for VPS Password AGAIN for the data transfer pipeline."

# The Magic Pipeline
# 1. pg_dump local stats
# 2. gzip (compress for transfer speed)
# 3. ssh to VPS
# 4. gunzip
# 5. docker exec psql
pg_dump -h localhost -U kajtek -d $LOCAL_DB | gzip | ssh $VPS_USER@$VPS_IP "gunzip -c | docker exec -i $REMOTE_CONTAINER_ID psql -U $REMOTE_USER -d $REMOTE_DB"


if [ $? -eq 0 ]; then
    echo "🎉 MIGRATION SUCCESS! Database synced."
else
    echo "❌ Migration Failed."
fi
