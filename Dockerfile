FROM node:20-bookworm-slim

# أدوات البناء اللازمة لتجميع better-sqlite3 و sharp من المصدر على Linux
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# تثبيت الاعتماديات أولاً (طبقة كاش)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# نسخ الكود وبناء الواجهة
COPY . .
RUN npm run build

# مجلد البيانات (يُربط عليه الـ Volume في Railway)
RUN mkdir -p /data/uploads

ENV NODE_ENV=production \
    DATABASE_PATH=/data/realEstate.db \
    UPLOADS_DIR=/data/uploads

EXPOSE 5000

CMD ["node", "backend/server.js"]
