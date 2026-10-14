require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

// استيراد مسارات الـ API
const apartmentsRoutes = require('./routes/apartments');
const villasRoutes = require('./routes/villas');
const landsRoutes = require('./routes/lands');
const settingsRoutes = require('./routes/settings');
const searchRoutes = require('./routes/search');
const featuredRoutes = require('./routes/featured');
const adminRoutes = require('./routes/admin');

// استيراد الوسائط
const { securityHeaders } = require('./middleware/securityHeaders');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// استيراد قاعدة البيانات (لتهيئة الجداول عند بدء التشغيل)
require('./db/database');

const app = express();

// ===== إعداد CORS (مفعّل فقط من origins محددة) =====
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

const corsOptions = {
  origin(origin, callback) {
    // السماح بالطلبات بدون origin (مثل Postman أو التطبيقات المحلية)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('غير مسموح لهذا المصدر بالوصول (CORS).'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

// ===== ترويسات الأمان =====
app.use(securityHeaders);

// ===== معالجة جسم الطلب =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== خدمة الصور الثابتة =====
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== نقطة فحص صحة الخادم =====
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'الخادم يعمل بنجاح.' });
});

// ===== مسارات الـ API =====
app.use('/api/apartments', apartmentsRoutes);
app.use('/api/villas', villasRoutes);
app.use('/api/lands', landsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/featured', featuredRoutes);
app.use('/api/admin', adminRoutes);

// ===== معالجة المسار غير الموجود =====
app.use(notFoundHandler);

// ===== معالج الأخطاء المركزي =====
app.use(errorHandler);

// ===== تشغيل الخادم =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على المنفذ ${PORT}`);
  console.log(`🔗 CORS مسموح للمصادر: ${allowedOrigins.join(', ')}`);
});

module.exports = app;
