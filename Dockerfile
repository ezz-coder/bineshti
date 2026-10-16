FROM node:20-bookworm-slim

# أدوات البناء اللازمة لتجميع better-sqlite3 و sharp من المصدر على Linux
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# تثبيت كل الاعتماديات (بما فيها dev مثل vite اللازم للبناء)
COPY package.json package-lock.json ./
RUN npm ci

# نسخ الكود وبناء الواجهة
COPY . .
RUN npm run build

# حذف اعتماديات التطوير بعد البناء لتصغير الصورة
RUN npm prune --omit=dev

# مجلد البيانات (يُربط عليه الـ Volume في Railway)
RUN mkdir -p /data/uploads

ENV NODE_ENV=production \
    DATABASE_PATH=/data/realEstate.db \
    UPLOADS_DIR=/data/uploads

EXPOSE 5000

CMD ["node", "backend/diag.js"]
