# بي نيشتي للاستثمار العقاري

موقع عرض وإدارة العقارات (شقق، فيلات، أراضٍ) بواجهة عربية (RTL) وخط تجوّل، مع لوحة تحكم كاملة.

## التقنيات

- **الواجهة الأمامية:** React + Vite + Tailwind CSS
- **الخلفية:** Express.js مع قاعدة بيانات تلقائية المزدوجة:
  - محليًا: SQLite (عبر `node:sqlite` المدمجة)
  - في الإنتاج: PostgreSQL (عند وجود `DATABASE_URL`)
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

## النشر على Railway

المشروع جاهز للنشر عبر Docker (`Dockerfile` + `railway.json`)، ويعمل النشر الموحّد
(الخلفية تخدم واجهة `dist` في الإنتاج على نفس الدومين).

### متغيرات البيئة على Railway

| المتغير | مطلوب؟ | القيمة / الملاحظة |
| --- | --- | --- |
| `DATABASE_URL` | تلقائي | يُضاف تلقائيًا عند إضافة خدمة **PostgreSQL** (يُفعّل وضع PostgreSQL وحفظ البيانات) |
| `JWT_SECRET` | مُستحسن | سلسلة عشوائية طويلة لتوقيع توكن الدخول |
| `ADMIN_PASSWORD` | مُستحسن | كلمة مرور المدير (تُستخدم عند إنشاء الحساب أول مرة فقط) |
| `NODE_ENV` | تلقائي | يضبطه Dockerfile إلى `production` |
| `UPLOADS_DIR` | تلقائي | يضبطه Dockerfile إلى `/data/uploads` |
| `PORT` | تلقائي | تحدّده Railway وتستخدمه الخلفية تلقائيًا |

> **المتغيرات التلقائية:** بدون ضبط أي متغير يعمل الموقع (SQLite + مفتاح افتراضي)،
> لكن الحفظ الدائم للبيانات يحتاج خدمة PostgreSQL، وتثبيت الأسرار يحتاج `JWT_SECRET` و`ADMIN_PASSWORD`.

### الخطوات

1. ارفع الكود إلى مستودع GitHub.
2. من Railway: **New Project → Deploy from GitHub repo** واختر المستودع (سيبني تلقائيًا من `Dockerfile`).
3. أضف خدمة **PostgreSQL** من `New → Database → PostgreSQL` (سيربط `DATABASE_URL` تلقائيًا).
4. أضف المتغيرين `JWT_SECRET` و`ADMIN_PASSWORD` من تبويب **Variables**.
5. أضف **Volume** واربطه على المسار `/data` (لحفظ الصور المرفوعة).
6. من **Settings → Networking** اضغط **Generate Domain** للحصول على رابط الموقع.

### بيانات دخول لوحة التحكم

- المسار: `/admin/login`
- اسم المستخدم الافتراضي: `benishaty`
- كلمة المرور: قيمة `ADMIN_PASSWORD` (الافتراضية `Bn@2026!Secure#`)

## ملاحظات أمنية

- لا تُرفع ملفات `.env` ولا قاعدة البيانات `.db` إلى Git (مستبعدة في `.gitignore`).
- استخدم قيمًا سرّية حقيقية لـ `JWT_SECRET` و `ADMIN_PASSWORD` في الإنتاج.
