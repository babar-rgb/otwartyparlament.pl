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
REMOTE_CONTAINER_ID=$(ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP "docker ps -qf name=db | head -n 1")

if [ -z "$REMOTE_CONTAINER_ID" ]; then
    echo "❌ Error: Could not find any running container with 'db' in name on VPS."
    echo "   Please check if the deployment on GitHub is 'Green' (Active)."
    exit 1
fi

echo "✅ Found Container ID: $REMOTE_CONTAINER_ID"
echo "🔐 You will be asked for VPS Password ($VPS_USER@$VPS_IP) TWICE (once for ID, once for transfer)"

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
