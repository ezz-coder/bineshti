const express = require('express');
const { authenticate } = require('../middleware/auth');
const { upload, processImages } = require('../middleware/upload');
const {
  handleValidation,
  apartmentValidation,
  villaValidation,
  landValidation,
  settingsValidation,
  loginValidation,
  featuredValidation,
  hiddenValidation,
} = require('../middleware/validation');

const { login, updateAdminCredentials } = require('../controllers/adminController');
const apartmentController = require('../controllers/apartmentController');
const villaController = require('../controllers/villaController');
const landController = require('../controllers/landController');
const { getSettings, updateSettings } = require('../controllers/settingsController');

const router = express.Router();

// ===== تسجيل الدخول (بدون مصادقة) =====
// POST /api/admin/login
router.post('/login', loginValidation, handleValidation, login);

// ===== كل المسارات التالية تحتاج توكن JWT =====
router.use(authenticate);

// ===== الشقق =====
// POST /api/admin/apartments - إضافة شقة جديدة (مع رفع الصور)
router.post(
  '/apartments',
  upload.array('images'),
  processImages,
  apartmentValidation,
  handleValidation,
  apartmentController.createApartment
);

// PUT /api/admin/apartments/:id - تعديل شقة
router.put(
  '/apartments/:id',
  upload.array('images'),
  processImages,
  apartmentValidation,
  handleValidation,
  apartmentController.updateApartment
);

// PUT /api/admin/apartments/:id/featured - تغيير حالة المميز
router.put(
  '/apartments/:id/featured',
  featuredValidation,
  handleValidation,
  apartmentController.setApartmentFeatured
);

// PUT /api/admin/apartments/:id/hidden - تغيير حالة الإخفاء
router.put(
  '/apartments/:id/hidden',
  hiddenValidation,
  handleValidation,
  apartmentController.setApartmentHidden
);

// DELETE /api/admin/apartments/:id - حذف شقة
router.delete('/apartments/:id', apartmentController.deleteApartment);

// ===== الفلل =====
// POST /api/admin/villas - إضافة فيلا جديدة
router.post(
  '/villas',
  upload.array('images'),
  processImages,
  villaValidation,
  handleValidation,
  villaController.createVilla
);

// PUT /api/admin/villas/:id - تعديل فيلا
router.put(
  '/villas/:id',
  upload.array('images'),
  processImages,
  villaValidation,
  handleValidation,
  villaController.updateVilla
);

// PUT /api/admin/villas/:id/featured - تغيير حالة المميز
router.put(
  '/villas/:id/featured',
  featuredValidation,
  handleValidation,
  villaController.setVillaFeatured
);

// PUT /api/admin/villas/:id/hidden - تغيير حالة الإخفاء
router.put(
  '/villas/:id/hidden',
  hiddenValidation,
  handleValidation,
  villaController.setVillaHidden
);

// DELETE /api/admin/villas/:id - حذف فيلا
router.delete('/villas/:id', villaController.deleteVilla);

// ===== الأراضي =====
// POST /api/admin/lands - إضافة أرض جديدة
router.post(
  '/lands',
  upload.array('images'),
  processImages,
  landValidation,
  handleValidation,
  landController.createLand
);

// PUT /api/admin/lands/:id - تعديل أرض
router.put(
  '/lands/:id',
  upload.array('images'),
  processImages,
  landValidation,
  handleValidation,
  landController.updateLand
);

// PUT /api/admin/lands/:id/featured - تغيير حالة المميز
router.put(
  '/lands/:id/featured',
  featuredValidation,
  handleValidation,
  landController.setLandFeatured
);

// PUT /api/admin/lands/:id/hidden - تغيير حالة الإخفاء
router.put(
  '/lands/:id/hidden',
  hiddenValidation,
  handleValidation,
  landController.setLandHidden
);

// DELETE /api/admin/lands/:id - حذف أرض
router.delete('/lands/:id', landController.deleteLand);

// ===== الإعدادات =====
// GET /api/admin/settings - جلب الإعدادات
router.get('/settings', getSettings);

// PUT /api/admin/settings/:field - تحديث حقل واحد من الإعدادات (زر الحفظ بجوار كل حقل)
router.put('/settings/:field', updateSettings);

// PUT /api/admin/settings - تحديث الإعدادات (يقبل FormData مع ملفي logo و aboutImage)
router.put(
  '/settings',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'aboutImage', maxCount: 1 },
  ]),
  settingsValidation,
  handleValidation,
  updateSettings
);

// ===== أمان الحساب =====
// PUT /api/admin/credentials - تحديث بيانات الدخول بشكل آمن
router.put(
  '/credentials',
  authenticate,
  updateAdminCredentials
);

module.exports = router;
