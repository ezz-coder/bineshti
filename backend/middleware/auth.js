const jwt = require('jsonwebtoken');

/**
 * وسيط للتحقق من صحة توكن JWT في ترويسة Authorization
 * التوقيع المتوقع: Authorization: Bearer <token>
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح: يجب تسجيل الدخول أولاً (التوكن مفقود).',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح: التوكن غير صالح.',
    });
  }

  try {
    // لا يوجد مفتاح احتياطي ثابت: server.js يضمن توليد JWT_SECRET وحفظه عند الإقلاع.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // تخزين بيانات المدير المفكوكة في الطلب
    next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.'
        : 'غير مصرح: التوكن غير صالح.';
    return res.status(401).json({
      success: false,
      message,
    });
  }
}

/**
 * وسيط اختياري: يفك التوكن إن وُجد ليُعرف الأدمن المسجّل (req.admin)،
 * ولا يمنع الطلب إن غاب التوكن أو كان غير صالح — يُعامَل صاحبه كزائر عادي.
 * يُستخدم في مسارات العرض العامة التي تعرض بيانات إضافية للأدمن فقط.
 */
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      if (token) req.admin = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // توكن منتهي أو غير صالح: نكمل كزائر بدون صلاحيات
    }
  }

  next();
}

module.exports = { authenticate, optionalAuthenticate };
