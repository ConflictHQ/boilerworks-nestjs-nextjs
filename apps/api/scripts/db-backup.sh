#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-./backups}"
FILENAME="boilerworks_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "Backing up database..."
docker compose -f docker/docker-compose.yaml exec -T postgres \
  pg_dump -U dbadmin -d boilerworks --clean --if-exists \
  > "$BACKUP_DIR/$FILENAME"

echo "Backup saved: $BACKUP_DIR/$FILENAME ($(wc -c < "$BACKUP_DIR/$FILENAME" | tr -d ' ') bytes)"
