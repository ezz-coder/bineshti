const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { UPLOAD_CONFIG } = require('../config/constants');

// مجلد تخزين الصور
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// التأكد من وجود مجلد الرفع
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// إعداد التخزين على القرص مع أسماء ملفات فريدة
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // إنشاء اسم فريد: <timestamp>-<random>.<ext>
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `image-${uniqueSuffix}${ext}`);
  },
});

// فلتر للتحقق من نوع وحجم الملف
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(
        'صيغة الصورة غير مدعومة. الصيغ المسموحة: jpg, jpeg, png, webp.'
      )
    );
  }
  cb(null, true);
};

// إنشاء وسيط multer
const upload = multer({
  storage,
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE, // 5MB
    files: UPLOAD_CONFIG.MAX_FILES, // حد أقصى 10 صور
  },
  fileFilter,
});

module.exports = upload;
