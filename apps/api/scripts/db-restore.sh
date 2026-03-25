#!/usr/bin/env bash
set -euo pipefail

FILE="${1:-}"

if [ -z "$FILE" ]; then
  echo "Usage: ./scripts/db-restore.sh <backup_file>"
  echo ""
  echo "Available backups:"
  ls -la backups/*.sql 2>/dev/null || echo "  (none)"
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE"
  exit 1
fi

echo "Restoring from $FILE..."
docker compose -f docker/docker-compose.yaml exec -T postgres \
  psql -U dbadmin -d boilerworks < "$FILE"

echo "Restore complete."
