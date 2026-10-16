FROM node:20-bookworm-slim

# أدوات البناء اللازمة لتجميع better-sqlite3 و sharp من المصدر على Linux
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# تثبيت كل الاعتماديات (بما فيها dev مثل vite اللازم للبناء)
COPY package.json package-lock.json ./
RUN npm ci

# إعادة تجميع better-sqlite3 من المصدر على نفس بيئة التشغيل (تمنع عدم توافق الثنائيات مسبقة البناء)
RUN npm rebuild better-sqlite3 --build-from-source

# نسخ الكود وبناء الواجهة
COPY . .
RUN npm run build

# حذف اعتماديات التطوير بعد البناء لتصغير الصورة
RUN npm prune --omit=dev

# مجلد البيانات (يُربط عليه الـ Volume في Railway)
RUN mkdir -p /data/uploads

# سكربت الإقلاع: ينظف ملفات WAL التالفة ويفحص سلامة القاعدة قبل تشغيل Node
RUN sed -i 's/\r$//' backend/entrypoint.sh && chmod +x backend/entrypoint.sh

ENV NODE_ENV=production \
    DATABASE_PATH=/data/realEstate.db \
    UPLOADS_DIR=/data/uploads

EXPOSE 5000

ENTRYPOINT ["/app/backend/entrypoint.sh"]

CMD ["node", "backend/server.js"]
