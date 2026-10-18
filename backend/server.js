require('dotenv').config({ path: require('path').join(__dirname, '.env') });

/**
 * تعريف تلقائي لمفتاح JWT:
 * إن لم يُضبط JWT_SECRET في متغيرات البيئة، نولّد مفتاحاً عشوائياً قوياً ونحفظه
 * على القرص الدائم (بجوار مجلد الصور — على Volume Railway) لتبقى جلسات الدخول
 * صالحة بعد إعادة التشغيل. إن تعذّر الحفظ نُستخدم مفتاحاً مؤقتاً للجلسة الحالية.
 */
(function ensureJwtSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) return;

  const fs = require('fs');
  const path = require('path');
  const crypto = require('crypto');

  const dataDir = process.env.UPLOADS_DIR
    ? path.dirname(process.env.UPLOADS_DIR)
    : path.join(__dirname, 'db');
  const secretPath = path.join(dataDir, '.jwt-secret');

  try {
    if (fs.existsSync(secretPath)) {
      const saved = fs.readFileSync(secretPath, 'utf8').trim();
      if (saved) {
        process.env.JWT_SECRET = saved;
        return;
      }
    }
    const generated = crypto.randomBytes(48).toString('hex');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(secretPath, generated, { mode: 0o600 });
    process.env.JWT_SECRET = generated;
    console.log('🔐 تم توليد JWT_SECRET تلقائياً وحفظه في: ' + secretPath);
  } catch (e) {
    process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
    console.warn('⚠️ تعذّر حفظ JWT_SECRET على القرص، سيُستخدم مفتاح مؤقت:', e.message);
  }
})();


const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const apartmentsRoutes = require('./routes/apartments');
const villasRoutes = require('./routes/villas');
const landsRoutes = require('./routes/lands');
const settingsRoutes = require('./routes/settings');
const searchRoutes = require('./routes/search');
const featuredRoutes = require('./routes/featured');
const adminRoutes = require('./routes/admin');

const { securityHeaders } = require('./middleware/securityHeaders');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { login } = require('./controllers/adminController');
const { loginValidation, handleValidation } = require('./middleware/validation');

require('./db/database');

const { dbReady } = require('./db/database');

const app = express();

app.use(cors());
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // نعطّل CSP الخاص بـ helmet لأن securityHeaders يضبط CSP يسمح بالصور من الباك (5000) للفرونت (5173).
  // إبقاء الاثنين معاً يجعل المتصفح يطبّق الأكثر تقييداً فيتكسر عرض الصور (أيقونة مكسورة).
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(securityHeaders);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: '30d',
  immutable: true,
}));

// ملف غير موجود داخل /uploads: نُرجع 404 واضحاً بدل تسليم صفحة الواجهة (index.html)،
// لأن إعادة صفحة HTML مكان الصورة تجعل المتصفح يعرضها كصورة مكسورة بلا سبب مفهوم.
app.use('/uploads', (req, res) => {
  res.status(404).json({ success: false, message: 'الصورة غير موجودة على السيرفر.' });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// نسخة البناء — للتأكد أن Railway يشغّل أحدث كود
app.get('/api/version', (req, res) => {
  res.json({
    success: true,
    build: '2026-10-18-uploads-v5',
    loginFields: ['username', 'password'],
    loginEndpoint: 'POST /api/admin/login',
  });
});

app.use('/api/apartments', apartmentsRoutes);
app.use('/api/villas', villasRoutes);
app.use('/api/lands', landsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/featured', featuredRoutes);
app.use('/api/admin', adminRoutes);

// مسار احتياطي: بعض النسخ القديمة من الواجهة تستدعي /admin/login مباشرة (بدون /api)
app.post('/admin/login', loginValidation, handleValidation, login);

// مسارات /api غير المطابقة تُرجع JSON دائماً (حتى في الإنتاج)
app.use('/api', notFoundHandler);

// خدمة ملفات الـ Frontend في بيئة الإنتاج (نشر موحّد على Railway)
// تُسجَّل بعد مسارات /api حتى لا تعترض طلبات الـ API غير المطابقة.
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// حماية من تحطم السيرفر بسبب رفض وعد غير معالج (مثل خطأ غير متوقع في متحكم async)
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ رفض وعد غير معالج (تم تجاهله):', reason);
});

dbReady.then(() => {
  app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err.message);
  process.exit(1);
});

module.exports = app;
