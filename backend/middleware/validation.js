const { body, validationResult } = require('express-validator');
const { PROPERTY_TYPES } = require('../config/constants');

/**
 * التحقق من نتيجة التحقق وإرجاع الأخطاء إن وُجدت
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'بيانات الإدخال غير صحيحة.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

/**
 * قواعد التحقق للشقق (تُستخدم في الإضافة والتعديل)
 * ملاحظة: floors اختياري — يُقبل فارغاً ويُخزَّن 0 (لا يُعرض في الموقع).
 */
const apartmentValidation = [
  body('type')
    .isIn(PROPERTY_TYPES)
    .withMessage(`النوع يجب أن يكون أحد القيم: ${PROPERTY_TYPES.join(' أو ')}.`),
  body('mainTitle').trim().notEmpty().withMessage('اسم المنطقة مطلوب.'),
  body('detailedAddress').trim().notEmpty().withMessage('العنوان التفصيلي مطلوب.'),
  body('description').optional().trim(),
  body('price').isInt({ min: 0 }).withMessage('السعر يجب أن يكون رقماً صحيحاً موجباً.'),
  body('floors')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('عدد الطوابق يجب أن يكون رقماً صحيحاً.'),
];

/**
 * قواعد التحقق للفلل
 * ملاحظة: area و rooms اختياريان — يُقبلان فارغين ويُخزَّنان 0.
 */
const villaValidation = [
  body('type')
    .isIn(PROPERTY_TYPES)
    .withMessage(`النوع يجب أن يكون أحد القيم: ${PROPERTY_TYPES.join(' أو ')}.`),
  body('mainTitle').trim().notEmpty().withMessage('اسم المنطقة مطلوب.'),
  body('detailedAddress').trim().notEmpty().withMessage('العنوان التفصيلي مطلوب.'),
  body('description').optional().trim(),
  body('price').isInt({ min: 0 }).withMessage('السعر يجب أن يكون رقماً صحيحاً موجباً.'),
  body('area')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('المساحة يجب أن تكون رقماً صحيحاً.'),
  body('rooms')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('عدد الغرف يجب أن يكون رقماً صحيحاً.'),
];

/**
 * قواعد التحقق للأراضي
 * ملاحظة: area اختياري — يُقبل فارغاً ويُخزَّن 0.
 */
const landValidation = [
  body('type')
    .isIn(PROPERTY_TYPES)
    .withMessage(`النوع يجب أن يكون أحد القيم: ${PROPERTY_TYPES.join(' أو ')}.`),
  body('mainTitle').trim().notEmpty().withMessage('اسم المنطقة مطلوب.'),
  body('detailedAddress').trim().notEmpty().withMessage('العنوان التفصيلي مطلوب.'),
  body('description').optional().trim(),
  body('price').isInt({ min: 0 }).withMessage('السعر يجب أن يكون رقماً صحيحاً موجباً.'),
  body('area')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('المساحة يجب أن تكون رقماً صحيحاً.'),
];

/**
 * قواعد التحقق للإعدادات
 */
const settingsValidation = [
  body('contactPhone').optional().trim(),
  body('whatsappPhone').optional().trim(),
  body('companyName').optional().trim(),
  body('aboutText').optional().trim(),
  // رابط فيسبوك اختياري — يقبل فارغاً، وإن أُرسل يجب أن يكون رابطاً صالحاً
  body('facebookUrl').optional({ checkFalsy: true }).trim().isURL().withMessage('رابط الفيسبوك غير صالح.'),
  // نصوص صفحة من نحن — كلها اختيارية
  body('aboutTitle').optional().trim(),
  body('aboutSubtitle').optional().trim(),
  body('aboutSection1Title').optional().trim(),
  body('aboutSection1Content').optional().trim(),
  body('aboutSection2Title').optional().trim(),
  body('aboutSection2Content').optional().trim(),
  body('aboutSection3Title').optional().trim(),
  body('aboutSection3Content').optional().trim(),
];

/**
 * قواعد التحقق لتسجيل الدخول
 */
const loginValidation = [
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة.'),
];

/**
 * قواعد التحقق لتغيير حالة المميز
 */
const featuredValidation = [
  body('isFeatured')
    .isBoolean()
    .withMessage('قيمة isFeatured يجب أن تكون true أو false.'),
];

/**
 * قواعد التحقق لتغيير حالة الإخفاء
 */
const hiddenValidation = [
  body('isHidden')
    .isBoolean()
    .withMessage('قيمة isHidden يجب أن تكون true أو false.'),
];

module.exports = {
  handleValidation,
  apartmentValidation,
  villaValidation,
  landValidation,
  settingsValidation,
  loginValidation,
  featuredValidation,
  hiddenValidation,
};
