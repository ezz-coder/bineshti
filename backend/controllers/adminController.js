const db = require('../db/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_EXPIRES_IN_SECONDS } = require('../config/constants');

/**
 * متحكم لوحة التحكم: تسجيل الدخول فقط
 * (عمليات الإضافة/التعديل/الحذف موجودة في متحكمات العقارات)
 */

// POST /api/admin/login - تسجيل الدخول
async function login(req, res) {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'كلمة المرور مطلوبة.',
    });
  }

  // جلب كلمة مرور المدير المخزنة (مشفرة)
  const admin = db.prepare('SELECT * FROM admin ORDER BY id LIMIT 1').get();

  if (!admin) {
    return res.status(500).json({
      success: false,
      message: 'لم يتم إعداد حساب المدير.',
    });
  }

  // التحقق من كلمة المرور
  const isMatch = bcrypt.compareSync(password, admin.password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'كلمة المرور غير صحيحة.',
    });
  }

  // إنشاء توكن JWT صالح لمدة 24 ساعة
  const token = jwt.sign(
    { id: admin.id, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN_SECONDS }
  );

  res.status(200).json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح.',
    token,
    expiresIn: JWT_EXPIRES_IN_SECONDS,
  });
}

module.exports = { login };
