#!/usr/bin/env bash
set -euo pipefail

# Backup do banco Postgres da stack de producao local/VPS.
# Uso:
#   bash scripts/db_backup.sh

DB_CONTAINER="${DB_CONTAINER:-infra-db-1}"
DB_USER="${DB_USER:-admin_casadapaz}"
DB_NAME="${DB_NAME:-casadapaz_db}"
OUTPUT_DIR="${OUTPUT_DIR:-./backups}"

mkdir -p "$OUTPUT_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="$OUTPUT_DIR/casadapaz-db-$STAMP.sql.gz"

echo "Gerando backup em: $OUT_FILE"
docker exec -i "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$OUT_FILE"
echo "Backup concluido."
