#!/bin/bash
# ============================================
# PostgreSQL Database Restore Script
# Usage: ./db_restore.sh <backup_file>
# ============================================

set -e

# Check argument
if [ -z "$1" ]; then
    echo "Usage: ./db_restore.sh <backup_file.sql[.gz]>"
    exit 1
fi

BACKUP_FILE="$1"

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuration (from env or defaults)
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-otwarty_parlament}"
DB_USER="${POSTGRES_USER:-postgres}"

echo "╔════════════════════════════════════════════╗"
echo "║  PostgreSQL Database Restore               ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📍 Host: $DB_HOST:$DB_PORT"
echo "📦 Database: $DB_NAME"
echo "👤 User: $DB_USER"
echo "📄 Backup: $BACKUP_FILE"
echo ""

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql not found. Install PostgreSQL client tools."
    exit 1
fi

# Warning
echo "⚠️  WARNING: This will DROP and recreate the database!"
echo "   All existing data in '$DB_NAME' will be DELETED."
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Decompress if gzipped
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📦 Decompressing backup..."
    gunzip -k "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

# Drop and recreate database
echo "🗑️  Dropping existing database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

echo "📦 Creating new database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"

# Restore
echo "🔄 Restoring data..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"

echo ""
echo "✅ Restore complete!"
echo ""
echo "Next steps:"
echo "  1. Start PostgREST: postgrest postgrest.conf"
echo "  2. Verify: curl http://localhost:3001/mps?limit=1"
