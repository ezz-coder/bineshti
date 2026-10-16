#!/bin/sh
# سكربت إقلاع الحاوية: يجهز مجلدات البيانات ويفحص سلامة قاعدة SQLite
# قبل تشغيل Node، حتى لا تسقط العملية على ملف تالف فوق الـ Volume.
set -e

DB_FILE="${DATABASE_PATH:-/data/realEstate.db}"
DATA_DIR="$(dirname "$DB_FILE")"
UPLOADS_DIR="${UPLOADS_DIR:-/data/uploads}"

mkdir -p "$DATA_DIR" "$UPLOADS_DIR"

# تنظيف ملفات WAL/SHM/Journal القديمة التي قد تكون تالفة من إقلاع سابق متعثر
rm -f "${DB_FILE}-wal" "${DB_FILE}-shm" "${DB_FILE}-journal" 2>/dev/null || true

# فحص سلامة القاعدة عبر python3، وعزلها إن كانت تالفة قبل أن يفتحها Node
if [ -f "$DB_FILE" ] && command -v python3 >/dev/null 2>&1 && python3 -c "import sqlite3" 2>/dev/null; then
  if ! python3 -c "import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.execute('PRAGMA integrity_check').fetchall(); c.close()" "$DB_FILE" 2>/dev/null; then
    echo "entrypoint: database integrity check failed, moving aside: $DB_FILE"
    mv "$DB_FILE" "${DB_FILE}.corrupt-$(date +%s).bak" || true
    rm -f "${DB_FILE}-wal" "${DB_FILE}-shm" "${DB_FILE}-journal" 2>/dev/null || true
  fi
fi

exec "$@"
