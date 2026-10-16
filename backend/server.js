require('dotenv').config();

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

require('./db/database');

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

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '30d',
  immutable: true,
}));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use('/api/apartments', apartmentsRoutes);
app.use('/api/villas', villasRoutes);
app.use('/api/lands', landsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/featured', featuredRoutes);
app.use('/api/admin', adminRoutes);

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
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});

module.exports = app;
