# بي نيشتي للاستثمار العقاري

موقع عرض وإدارة العقارات (شقق، فيلات، أراضٍ) بواجهة عربية (RTL) وخط تجوّل، مع لوحة تحكم كاملة.

## التقنيات

- **الواجهة الأمامية:** React + Vite + Tailwind CSS
- **الخلفية:** Express.js + SQLite (better-sqlite3)
- **المصادقة:** JWT

## الهوية البصرية

نظام ثيمات بمظهرين قابلين للتبديل من لوحة التحكم:

- **داكن (Dark):** بنفسجي مضيء + Glassmorphism
- **دافئ (Warm):** بيج/ذهبي فاخر

## التشغيل محليًا

### 1) الخلفية (Backend)

```bash
cd backend
npm install
cp .env.example .env      # ثم عدّل القيم (JWT_SECRET و ADMIN_PASSWORD)
npm run dev               # يعمل على المنفذ 5000
```

> قاعدة البيانات `realEstate.db` تُبنى تلقائيًا عند أول تشغيل مع البيانات الأولية.

### 2) الواجهة الأمامية (Frontend)

```bash
npm install
cp .env.example .env      # ثم عدّل VITE_API_URL إن لزم
npm run dev               # يعمل على المنفذ 5173
```

### 3) بناء النسخة النهائية (Production Build)

```bash
npm run build             # ينتج مجلد dist/
```

## ملاحظات أمنية

- لا تُرفع ملفات `.env` ولا قاعدة البيانات `.db` إلى Git (مستبعدة في `.gitignore`).
- استخدم قيمًا سرّية حقيقية لـ `JWT_SECRET` و `ADMIN_PASSWORD` في الإنتاج.
