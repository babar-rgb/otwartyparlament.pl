#!/bin/bash
# Stability Shield: Cloud Sync v1.0
# Synchronizacja lokalnych backupów SQL na Google Drive za pomocą rclone.

set -e

# --- KONFIGURACJA ---
BACKUP_DIR="/Users/kajtek/sejm/git/parlament/backend/backups" # Zmień na /app/backend/backups na VPS jeśli rclone w dockerze, lub ścieżkę absolutną na hoście
REMOTE_NAME="gdrive"
REMOTE_DIR="backups/parlament_vps"
LOG_FILE="/Users/kajtek/sejm/git/parlament/backend/backups/cloud_sync.log"
RETENTION_DAYS=7

echo "☁️  [Cloud Backup] Rozpoczynam synchronizację z Google Drive..." | tee -a "$LOG_FILE"

# 1. Sprawdź czy rclone jest zainstalowany
if ! command -v rclone &> /dev/null; then
    echo "❌ Błąd: rclone nie jest zainstalowany na tym systemie." | tee -a "$LOG_FILE"
    exit 1
fi

# 2. Wykonaj synchronizację
# 'copy' jest bezpieczniejszy niż 'sync' (nie usuwa plików na zdalnym dysku jeśli znikną lokalnie)
# Jeśli chcesz lustrzane odbicie, użyj 'sync'
echo "📤 Przesyłanie nowych plików..." | tee -a "$LOG_FILE"
rclone copy "$BACKUP_DIR" "$REMOTE_NAME:$REMOTE_DIR" \
    --include "*.sql" \
    --verbose \
    --log-file="$LOG_FILE"

# 3. Czyszczenie starych plików lokalnie (opcjonalne)
echo "🧹 Sprzątanie lokalnych backupów starszych niż $RETENTION_DAYS dni..." | tee -a "$LOG_FILE"
find "$BACKUP_DIR" -name "*.sql" -type f -mtime +$RETENTION_DAYS -delete

echo "✅ [Cloud Backup] Synchronizacja zakończona pomyślnie." | tee -a "$LOG_FILE"
