#!/bin/bash
# export_db.sh
# Dumps the local database to a file for migration

echo "📦 Exporting database 'otwarty_parlament'..."

# Get current date for filename
DATE=$(date +"%Y%m%d_%H%M")
FILENAME="otwarty_parlament_dump_$DATE.sql"

# Dump structure and data
pg_dump -h 127.0.0.1 -U kajtek otwarty_parlament > "$FILENAME"

if [ $? -eq 0 ]; then
    echo "✅ Database exported successfully to: $FILENAME"
    echo "ℹ️  To restore on new Mac, run:"
    echo "   createdb otwarty_parlament"
    echo "   psql -d otwarty_parlament < $FILENAME"
else
    echo "❌ Error exporting database."
fi
