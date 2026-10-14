// اسم الموقع المأخوذ من متغيرات البيئة مع قيمة افتراضية
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'بي نيشتي للاستثمار العقاري';

// أصل الـ API (بدون اللاحقة /api) — يُستخدم لبناء روابط الصور المخزّنة كمسارات نسبية مثل /uploads/xxx.jpg
export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

/**
 * تحويل مسار صورة نسبي (أو مطلق) إلى رابط صالح للعرض في المتصفح.
 * - إن كان المسار فارغاً يُرجع سلسلة فارغة (للتعامل معه بمعالجة ذكية).
 * - إن كان مطلقاً (http/https) يُرجع كما هو.
 * - غير ذلك يُلصق على أصل الـ API.
 */
export function resolveImageUrl(path) {
  if (!path || typeof path !== 'string') return '';
  if (/^https?:\/\//i.test(path)) return path;
  const prefix = path.startsWith('/') ? '' : '/';
  return `${API_ORIGIN}${prefix}${path}`;
}

// ربط مفاتيح التبديل (rent/buy) بقيم حقل type في الـ backend
export const TYPE_LABEL_MAP = {
  rent: 'إيجار',
  buy: 'تمليك',
};

// بيانات الأقسام: المفتاح، المسار، نقطة النهاية، الاسم المعروض
// endpoint      : المسار العام (GET فقط — للعرض وجلب العقار للتعديل)
// adminEndpoint : مسار لوحة التحكم (POST/PUT/DELETE — يحتاج JWT)
export const CATEGORIES = {
  apartment: { basePath: '/apartment', endpoint: '/apartments', adminEndpoint: '/admin/apartments', name: 'شقق' },
  villa: { basePath: '/villa', endpoint: '/villas', adminEndpoint: '/admin/villas', name: 'فلل' },
  land: { basePath: '/land', endpoint: '/lands', adminEndpoint: '/admin/lands', name: 'أراضي فارغة' },
};
