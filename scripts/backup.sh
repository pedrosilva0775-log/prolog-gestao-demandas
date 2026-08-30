#!/usr/bin/env sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_DIR:=/backup}"
mkdir -p "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$BACKUP_DIR/prolog-$stamp.dump"
pg_dump --format=custom --no-owner --no-acl --dbname="$DATABASE_URL" --file="$target"
pg_restore --list "$target" >/dev/null
sha256sum "$target" >"$target.sha256"
printf '%s\n' "$target"
