#!/bin/bash
# ============================================
# PostgreSQL Database Backup Script
# Usage: ./db_backup.sh [output_file]
# ============================================

set -e

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuration (from env or defaults)
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-otwarty_parlament}"
DB_USER="${POSTGRES_USER:-postgres}"

# Output file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="${1:-backup_${DB_NAME}_${TIMESTAMP}.sql}"

echo "╔════════════════════════════════════════════╗"
echo "║  PostgreSQL Database Backup                ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📍 Host: $DB_HOST:$DB_PORT"
echo "📦 Database: $DB_NAME"
echo "👤 User: $DB_USER"
echo "📄 Output: $OUTPUT_FILE"
echo ""

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo "❌ Error: pg_dump not found. Install PostgreSQL client tools."
    exit 1
fi

# Create backup
echo "🔄 Creating backup..."
pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-acl \
    --format=plain \
    --file="$OUTPUT_FILE"

# Compress if over 10MB
FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE")
if [ "$FILE_SIZE" -gt 10000000 ]; then
    echo "📦 Compressing backup..."
    gzip -f "$OUTPUT_FILE"
    OUTPUT_FILE="${OUTPUT_FILE}.gz"
fi

echo ""
echo "✅ Backup complete!"
echo "📂 File: $OUTPUT_FILE"
echo "📊 Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo ""
echo "To restore on new server:"
echo "  ./db_restore.sh $OUTPUT_FILE"
