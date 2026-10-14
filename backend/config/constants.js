/**
 * الثوابت والإعدادات العامة للمشروع
 */

// أنواع العقار المتاحة (إيجار أو تمليك)
const PROPERTY_TYPES = ['إيجار', 'تمليك'];

// مدة صلاحية توكن JWT (بالثواني) - 24 ساعة
const JWT_EXPIRES_IN_SECONDS = 24 * 60 * 60; // 86400

// الإعدادات الافتراضية للموقع
const DEFAULT_SETTINGS = {
  companyName: 'بي نيشتي للاستثمار العقاري',
  contactPhone: '',
  aboutText: 'شركة بي نيشتي للاستثمار العقاري - نقدم أفضل العقارات للبيع والإيجار.',
};

// إعدادات رفع الصور
const UPLOAD_CONFIG = {
  // الصيغ المسموح بها
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
  // الحد الأقصى لحجم الصورة: 5 ميجابايت
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  // الحد الأقصى لعدد الصور للعقار الواحد
  MAX_FILES: 10,
};

// المسار العام الذي تُقدَّم منه الصور
const UPLOAD_PUBLIC_PATH = '/uploads';

module.exports = {
  PROPERTY_TYPES,
  JWT_EXPIRES_IN_SECONDS,
  DEFAULT_SETTINGS,
  UPLOAD_CONFIG,
  UPLOAD_PUBLIC_PATH,
};
