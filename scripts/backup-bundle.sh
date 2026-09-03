#!/usr/bin/env sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${UPLOAD_DIR:?UPLOAD_DIR is required}"
: "${BACKUP_DIR:?BACKUP_DIR is required}"

if [ ! -d "$UPLOAD_DIR" ]; then
  printf 'UPLOAD_DIR does not exist: %s\n' "$UPLOAD_DIR" >&2
  exit 2
fi

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
bundle="$BACKUP_DIR/prolog-$stamp"
mkdir -p "$bundle"
pg_dump --format=custom --no-owner --no-acl --dbname="$DATABASE_URL" --file="$bundle/database.dump"
pg_restore --list "$bundle/database.dump" >/dev/null
tar --create --gzip --file="$bundle/uploads.tar.gz" --directory="$UPLOAD_DIR" .
(
  cd "$bundle"
  sha256sum database.dump uploads.tar.gz > SHA256SUMS
)
printf '{"formatVersion":1,"createdAt":"%s","database":"database.dump","uploads":"uploads.tar.gz"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$bundle/manifest.json"
printf '%s\n' "$bundle"
