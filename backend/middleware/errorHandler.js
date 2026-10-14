/**
 * معالج الأخطاء المركزي
 * يلتقط جميع الأخطاء التي تُمرَّر عبر next(err) أو التي تُرمى في المتحكمات
 */
function errorHandler(err, req, res, next) {
  console.error('❌ خطأ في الخادم:', err);

  // أخطاء multer (رفع الملفات)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'حجم الصورة يتجاوز الحد المسموح (5 ميجابايت كحد أقصى).',
      });
    }
    return res.status(400).json({
      success: false,
      message: `خطأ في رفع الصور: ${err.message}`,
    });
  }

  // أخطاء التحقق من الصيغة (multer fileFilter)
  if (err.message && err.message.includes('صيغة الصورة غير مدعومة')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // خطأ في تحليل JSON
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'صيغة البيانات المرسلة غير صحيحة (JSON غير سليم).',
    });
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 ? 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً.' : err.message;

  res.status(statusCode).json({
    success: false,
    message,
  });
}

/**
 * معالج المسارات غير الموجودة (404)
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: 'المسار المطلوب غير موجود.',
  });
}

module.exports = { errorHandler, notFoundHandler };
