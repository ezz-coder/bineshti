const { query, get, run } = require('../db/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_EXPIRES_IN_SECONDS } = require('../config/constants');

/**
 * متحكم لوحة التحكم: تسجيل الدخول فقط
 * (عمليات الإضافة/التعديل/الحذف موجودة في متحكمات العقارات)
 */

// POST /api/admin/login - تسجيل الدخول
async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'اسم المستخدم وكلمة المرور مطلوبان.',
    });
  }

  // جلب حساب المدير
  const admin = await get('SELECT * FROM admin ORDER BY id LIMIT 1');

  if (!admin) {
    return res.status(500).json({
      success: false,
      message: 'لم يتم إعداد حساب المدير.',
    });
  }

  // التحقق من اسم المستخدم
  const usernameMatch = admin.username && username.trim().toLowerCase() === admin.username.toLowerCase();
  if (!usernameMatch) {
    return res.status(401).json({
      success: false,
      message: 'اسم المستخدم غير صحيح.',
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

// PUT /api/admin/credentials - تحديث بيانات الدخول بشكل آمن
async function updateAdminCredentials(req, res) {
  const { currentPassword, newUsername, newPassword } = req.body;
  
  // التحقق من وجود جميع الحقول المطلوبة
  if (!currentPassword || !newUsername || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'جميع الحقول مطلوبة (كلمة المرور الحالية، اسم المستخدم الجديد، كلمة المرور الجديدة).',
    });
  }
  
  // جلب بيانات المسؤول الحالي
  const admin = await get('SELECT * FROM admin WHERE id = $1', [req.admin.id]);
  
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'لم يتم العثور على حساب المدير.',
    });
  }
  
  // التحقق من صحة كلمة المرور الحالية
  const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, admin.password);
  
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'كلمة المرور الحالية غير صحيحة.',
    });
  }
  
  try {
    // تشفير كلمة المرور الجديدة
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
    
    // تحديث قاعدة البيانات
    const result = await run(
      'UPDATE admin SET username = $1, password = $2 WHERE id = $3',
      [newUsername, hashedNewPassword, req.admin.id]
    );
    
    if (result.changes === 0) {
      return res.status(500).json({
        success: false,
        message: 'فشل تحديث بيانات الدخول.',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات الدخول بنجاح.',
    });
    
  } catch (error) {
    console.error('Error updating admin credentials:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث بيانات الدخول.',
    });
  }
}

module.exports = { login, updateAdminCredentials };
