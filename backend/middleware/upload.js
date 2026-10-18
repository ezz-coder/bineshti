const path = require('path');
const fs = require('fs');
const multer = require('multer');
// تحميل sharp بشكل كسول داخل processUploadedImages حتى لا يسقط السيرفر
// عند الإقلاع لو الثنائية الأصلية غير متوافقة مع بيئة النشر (Segmentation fault).
const { UPLOAD_CONFIG } = require('../config/constants');

// مجلد تخزين الصور (قابل للتجاوز عبر UPLOADS_DIR حتى يعيش على الـ Volume في Railway)
const UPLOAD_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');

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
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE, // 25MB (تُضغط تلقائياً بعد الرفع)
    files: UPLOAD_CONFIG.MAX_FILES, // حد أقصى 10 صور
  },
  fileFilter,
});

// === معالجة الصور بعد الرفع باستخدام sharp ===
async function processUploadedImages(files) {
  if (!files || !Array.isArray(files)) return;

  let sharp;
  try {
    sharp = require('sharp');
  } catch (error) {
    // sharp غير متاح (ثنائية غير متوافقة) — نترك الصور الأصلية كما هي بدل إسقاط السيرفر
    console.warn('⚠️ sharp غير متاح، سيتم الاحتفاظ بالصور الأصلية بدون ضغط:', error.message);
    return;
  }

  for (const file of files) {
    try {
      const originalPath = path.join(UPLOAD_DIR, file.filename);
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = file.filename.replace(ext, '');

      // 1. قراءة الصورة الأصلية
      const image = sharp(originalPath);

      // 2. قراءة معلومات الصورة
      const metadata = await image.metadata();
      if (!metadata.width || !metadata.height) continue;

      // 3. تحديد الحد الأقصى للعرض بناءً على نوع الصورة
      const maxWidth = file.fieldname === 'banner' || file.fieldname === 'logo'
        ? 1600
        : 1200;
      const thumbnailWidth = 600;

      // 4. إنشاء النسخة المضغوطة (WebP) للصورة الكبيرة
      const largeWebpBuffer = await image
        .resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      // 5. إنشاء نسخة JPEG للصورة الكبيرة (fallback)
      const largeJpegBuffer = await image
        .resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();

      // 6. حفظ النسختين (WebP + JPEG)
      const webpPath = originalPath.replace(ext, '.webp');
      const jpegPath = originalPath.replace(ext, '.jpg');
      fs.writeFileSync(webpPath, largeWebpBuffer);
      fs.writeFileSync(jpegPath, largeJpegBuffer);

      // 7. إنشاء نسخة الصغير (thumbnail) - قبل حذف الأصلي
      const thumbnailWebpPath = path.join(UPLOAD_DIR, `${baseName}-thumb.webp`);
      const thumbnailJpegPath = path.join(UPLOAD_DIR, `${baseName}-thumb.jpg`);
      await sharp(originalPath)
        .resize(thumbnailWidth, null, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(thumbnailWebpPath);
      await sharp(originalPath)
        .resize(thumbnailWidth, null, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toFile(thumbnailJpegPath);

      // 8. حذف الصورة الأصلية غير المضغوطة (بعد إنشاء كل النسخ)
      if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.webp') {
        fs.unlinkSync(originalPath);
      }

      file.webpFilename = path.relative(UPLOAD_DIR, webpPath);
      file.jpegFilename = path.relative(UPLOAD_DIR, jpegPath);
      file.thumbnailWebpFilename = path.relative(UPLOAD_DIR, thumbnailWebpPath);
      file.thumbnailJpegFilename = path.relative(UPLOAD_DIR, thumbnailJpegPath);

    } catch (error) {
      console.error(`❌ فشل معالجة الصورة ${file.filename}:`, error.message);
      // متابعة حتى لا يتوقف الرفع الكامل
    }
  }
}

//_middleware لمعالجة النتائج بعد الرفع
// يدعم الحالتين: upload.array (req.files مصفوفة) و upload.fields (req.files كائن من المصفوفات).
const processImages = async (req, res, next) => {
  const files = Array.isArray(req.files)
    ? req.files
    : req.files && typeof req.files === 'object'
      ? Object.values(req.files).flat().filter(Boolean)
      : [];

  if (files.length > 0) {
    await processUploadedImages(files);
  }
  next();
};

module.exports = {
  upload,
  processImages,
  UPLOAD_DIR,
};
