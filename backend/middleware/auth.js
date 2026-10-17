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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'Benishaty_Dev_Secret_2026');
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

module.exports = { authenticate };
