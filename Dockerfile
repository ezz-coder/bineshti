FROM node:24-bookworm-slim

# أدوات البناء اللازمة لتجميع sharp من المصدر على Linux (better-sqlite3 أُزيلت نهائياً)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# تثبيت كل الاعتماديات (بما فيها dev مثل vite اللازم للبناء)
# ملاحظة: نستخدم npm install بدل npm ci لأن package-lock.json قد يكون غير متزامن
# مع package.json (يفشل npm ci عند أي اختلاف)، فيعيد npm install المزامنة تلقائياً.
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

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
    UPLOADS_DIR=/data/uploads

EXPOSE 5000

ENTRYPOINT ["/app/backend/entrypoint.sh"]

CMD ["node", "backend/server.js"]
