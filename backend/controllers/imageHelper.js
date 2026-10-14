const path = require('path');
const fs = require('fs');

// مسار مجلد الرفع المطلق
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

/**
 * بناء قائمة مسارات الصور من:
 * - الصور القديمة المُعاد إرسالها في الجسم (existingImages)
 * - الصور الجديدة المرفوعة (req.files)
 * تُرجع مصفوفة من المسارات النسبية مثل: /uploads/xxx.jpg
 */
function buildImagePaths(req) {
  const paths = [];

  // 1) الصور الموجودة مسبقاً التي يريد المستخدم الإبقاء عليها
  let existing = req.body.existingImages;
  if (existing) {
    if (typeof existing === 'string') {
      try {
        existing = JSON.parse(existing);
      } catch (e) {
        existing = [existing];
      }
    }
    if (Array.isArray(existing)) {
      paths.push(...existing.filter((p) => typeof p === 'string' && p.trim() !== ''));
    }
  }

  // 2) الصور الجديدة المرفوعة عبر multer
  if (Array.isArray(req.files)) {
    req.files.forEach((file) => {
      paths.push(`/uploads/${file.filename}`);
    });
  }

  return paths;
}

/**
 * حذف ملفات الصور من القرص بأمان (تتجاهل الأخطاء إن لم يوجد الملف)
 */
function deleteImageFiles(imagePaths) {
  if (!Array.isArray(imagePaths)) return;
  imagePaths.forEach((relPath) => {
    if (typeof relPath !== 'string') return;
    // استخراج اسم الملف فقط لتجنب Path Traversal
    const fileName = path.basename(relPath);
    const fullPath = path.join(UPLOAD_DIR, fileName);
    fs.unlink(fullPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error(`⚠️ تعذر حذف الصورة ${fileName}:`, err.message);
      }
    });
  });
}

/**
 * حساب الصور التي يجب حذفها (الموجودة قديماً وغير الموجودة في القائمة الجديدة)
 */
function getImagesToDelete(oldImages, newImages) {
  if (!Array.isArray(oldImages)) return [];
  return oldImages.filter((img) => !newImages.includes(img));
}

module.exports = {
  buildImagePaths,
  deleteImageFiles,
  getImagesToDelete,
};
