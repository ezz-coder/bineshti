#!/bin/sh
# سكربت إقلاع الحاوية: يجهز مجلد الصور فقط.
# ملاحظة: قاعدة البيانات تعيش داخل مجلد الكود (backend/db) ولا تُمس هنا،
# لأن أي مسح/فحص لملف القاعدة على الـ Volume كان يعطبها ويسقط السيرفر.
set -e

UPLOADS_DIR="${UPLOADS_DIR:-/data/uploads}"

mkdir -p "$UPLOADS_DIR"

exec "$@"
