#!/bin/bash

# Configuration
DB_NAME="otwarty_parlament"
BACKUP_DIR="$(pwd)/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="$BACKUP_DIR/$DB_NAME-$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup using pg_dump
echo "📦 Backing up database '$DB_NAME'..."
if pg_dump "$DB_NAME" > "$FILENAME"; then
  SIZE=$(du -h "$FILENAME" | cut -f1)
  echo "✅ Backup successful!"
  echo "📂 File: $FILENAME"
  echo "💾 Size: $SIZE"
else
  echo "❌ Backup failed!"
  rm -f "$FILENAME"
  exit 1
fi
