#!/usr/bin/env sh
set -eu
: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL is required}"
: "${RESTORE_UPLOAD_DIR:?RESTORE_UPLOAD_DIR is required}"
: "${BACKUP_BUNDLE:?BACKUP_BUNDLE is required}"

for required in database.dump uploads.tar.gz SHA256SUMS manifest.json; do
  if [ ! -f "$BACKUP_BUNDLE/$required" ]; then
    printf 'Incomplete backup bundle: missing %s\n' "$required" >&2
    exit 2
  fi
done
if [ -d "$RESTORE_UPLOAD_DIR" ] && [ -n "$(find "$RESTORE_UPLOAD_DIR" -mindepth 1 -maxdepth 1 -print -quit)" ]; then
  printf 'RESTORE_UPLOAD_DIR must be empty: %s\n' "$RESTORE_UPLOAD_DIR" >&2
  exit 3
fi

(cd "$BACKUP_BUNDLE" && sha256sum -c SHA256SUMS)
mkdir -p "$RESTORE_UPLOAD_DIR"
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" "$BACKUP_BUNDLE/database.dump"
tar --extract --gzip --file="$BACKUP_BUNDLE/uploads.tar.gz" --directory="$RESTORE_UPLOAD_DIR"
psql "$RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "SELECT COUNT(*) AS users FROM users" \
  -c "SELECT COUNT(*) AS demands FROM demands" \
  -c "SELECT COUNT(*) AS attachment_files FROM attachment_files"
