#!/bin/bash
# ============================================
# Full Server Migration Script
# Transfers database + app to new server
# Usage: ./db_migrate.sh user@new-server
# ============================================

set -e

if [ -z "$1" ]; then
    echo "Usage: ./db_migrate.sh user@new-server [remote_path]"
    echo "Example: ./db_migrate.sh root@192.168.1.100 /var/www/parlament"
    exit 1
fi

REMOTE_HOST="$1"
REMOTE_PATH="${2:-/opt/parlament}"

echo "╔════════════════════════════════════════════╗"
echo "║  Full Server Migration                     ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📍 Target: $REMOTE_HOST:$REMOTE_PATH"
echo ""

# Step 1: Create backup
echo "═══════════════════════════════════════════"
echo "STEP 1: Creating database backup"
echo "═══════════════════════════════════════════"
./scripts/db_backup.sh migration_backup.sql
BACKUP_FILE="migration_backup.sql"
[ -f "${BACKUP_FILE}.gz" ] && BACKUP_FILE="${BACKUP_FILE}.gz"

# Step 2: Build frontend
echo ""
echo "═══════════════════════════════════════════"
echo "STEP 2: Building frontend"
echo "═══════════════════════════════════════════"
npm run build

# Step 3: Transfer files
echo ""
echo "═══════════════════════════════════════════"
echo "STEP 3: Transferring files to server"
echo "═══════════════════════════════════════════"

ssh "$REMOTE_HOST" "mkdir -p $REMOTE_PATH/{dist,backend,scripts,supabase}"

# Transfer files
rsync -avz --progress dist/ "$REMOTE_HOST:$REMOTE_PATH/dist/"
rsync -avz --progress backend/ "$REMOTE_HOST:$REMOTE_PATH/backend/"
rsync -avz --progress scripts/db_restore.sh "$REMOTE_HOST:$REMOTE_PATH/scripts/"
rsync -avz --progress "$BACKUP_FILE" "$REMOTE_HOST:$REMOTE_PATH/"
rsync -avz --progress postgrest.conf "$REMOTE_HOST:$REMOTE_PATH/"
rsync -avz --progress .env.example "$REMOTE_HOST:$REMOTE_PATH/"

echo ""
echo "✅ Files transferred!"
echo ""
echo "═══════════════════════════════════════════"
echo "NEXT STEPS ON REMOTE SERVER ($REMOTE_HOST)"
echo "═══════════════════════════════════════════"
echo ""
echo "1. SSH to server:"
echo "   ssh $REMOTE_HOST"
echo ""
echo "2. Setup environment:"
echo "   cd $REMOTE_PATH"
echo "   cp .env.example .env"
echo "   nano .env  # Configure PostgreSQL credentials"
echo ""
echo "3. Install PostgreSQL & PostgREST:"
echo "   apt install postgresql postgresql-contrib"
echo "   # Download PostgREST from GitHub releases"
echo ""
echo "4. Restore database:"
echo "   chmod +x scripts/db_restore.sh"
echo "   ./scripts/db_restore.sh $BACKUP_FILE"
echo ""
echo "5. Start PostgREST:"
echo "   postgrest postgrest.conf &"
echo ""
echo "6. Serve frontend (nginx example):"
echo "   ln -s $REMOTE_PATH/dist /var/www/html/parlament"
