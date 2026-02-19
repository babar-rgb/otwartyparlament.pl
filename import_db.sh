#!/bin/bash
# import_db.sh
# Imports the database from a file

if [ -z "$1" ]; then
    echo "Usage: ./import_db.sh <dump_file.sql>"
    exit 1
fi

echo "📦 Importing database from '$1'..."

# Create DB if not exists (ignore error if exists)
createdb -h 127.0.0.1 -U kajtek otwarty_parlament 2>/dev/null

# Import
psql -h 127.0.0.1 -U kajtek -d otwarty_parlament < "$1"

if [ $? -eq 0 ]; then
    echo "✅ Database imported successfully!"
else
    echo "❌ Error importing database."
fi
