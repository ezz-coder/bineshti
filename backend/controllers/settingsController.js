const { query, get, run } = require('../db/database');
const { deleteImageFiles } = require('./imageHelper');

/**
 * متحكم الإعدادات - العمليات العامة والتحديث من لوحة التحكم
 */

// تنسيق صف الإعدادات
function formatSettings(row) {
  if (!row) return null;
  return {
    contactPhone: row.contactPhone,
    whatsappPhone: row.whatsappPhone || '',
    companyName: row.companyName,
    aboutText: row.aboutText,
    logoUrl: row.logoUrl || '',
    facebookUrl: row.facebookUrl || '',
    aboutTitle: row.aboutTitle || '',
    aboutSubtitle: row.aboutSubtitle || '',
    aboutSection1Title: row.aboutSection1Title || '',
    aboutSection1Content: row.aboutSection1Content || '',
    aboutSection2Title: row.aboutSection2Title || '',
    aboutSection2Content: row.aboutSection2Content || '',
    aboutSection3Title: row.aboutSection3Title || '',
    aboutSection3Content: row.aboutSection3Content || '',
    aboutImageUrl: row.aboutImageUrl || '',
    theme: row.theme === 'warm' ? 'warm' : 'dark',
    updatedAt: row.updatedAt,
  };
}

// GET /api/settings - جلب الإعدادات (عام)
async function getSettings(req, res) {
  const row = await get('SELECT * FROM settings ORDER BY id LIMIT 1');
  res.status(200).json({ success: true, data: formatSettings(row) });
}

// PUT /api/admin/settings - تحديث الإعدادات (يحتاج JWT، ويقبل FormData مع ملفات logo و aboutImage)
// ملاحظة: تحديث جزئي آمن — نحدّث فقط الحقول المُرسلة فعلاً في الطلب،
// حتى لا تُمسح بقية الإعدادات عند حفظ خانة واحدة من اللوحة.
async function updateSettings(req, res) {
  const {
    contactPhone,
    whatsappPhone,
    companyName,
    aboutText,
    facebookUrl,
    aboutTitle,
    aboutSubtitle,
    aboutSection1Title,
    aboutSection1Content,
    aboutSection2Title,
    aboutSection2Content,
    aboutSection3Title,
    aboutSection3Content,
  } = req.body;

  // تطبيع قيمة الثيم إلى القيم المدعومة فقط (dark | warm)
  const theme =
    req.body.theme === 'warm' ? 'warm' : req.body.theme === 'dark' ? 'dark' : undefined;

  const existing = await get('SELECT * FROM settings ORDER BY id LIMIT 1');

  // بناء قائمة الحقول المراد تحديثها فقط (المُرسلة فعلاً)
  const fields = [];
  const values = [];
  const textFields = {
    contactPhone,
    whatsappPhone,
    companyName,
    aboutText,
    facebookUrl,
    aboutTitle,
    aboutSubtitle,
    aboutSection1Title,
    aboutSection1Content,
    aboutSection2Title,
    aboutSection2Content,
    aboutSection3Title,
    aboutSection3Content,
    theme,
  };
  Object.entries(textFields).forEach(([key, val]) => {
    if (val !== undefined) {
      fields.push(`${key} = $` + (values.length + 1));
      values.push(val);
    }
  });

  // معالجة ملفات الصور الجديدة (الشعار وصورة صفحة من نحن عبر multer fields)
  // req.files يكون كائناً { logo: [file], aboutImage: [file] } عند استخدام upload.fields
  const files = req.files || {};
  const logoFile = Array.isArray(files.logo) ? files.logo[0] : req.file || null;
  const aboutImageFile = Array.isArray(files.aboutImage) ? files.aboutImage[0] : null;

  const imagesToDelete = [];
  if (logoFile) {
    const newLogoPath = `/uploads/${logoFile.filename}`;
    fields.push('logoUrl = $' + (values.length + 1));
    values.push(newLogoPath);
    // حفظ مسار الشعار القديم لحذفه من القرص بعد نجاح التحديث
    if (existing && existing.logoUrl && existing.logoUrl !== newLogoPath) {
      imagesToDelete.push(existing.logoUrl);
    }
  }
  if (aboutImageFile) {
    const newAboutImagePath = `/uploads/${aboutImageFile.filename}`;
    fields.push('aboutImageUrl = $' + (values.length + 1));
    values.push(newAboutImagePath);
    // حفظ مسار الصورة القديمة لحذفها من القرص بعد نجاح التحديث
    if (existing && existing.aboutImageUrl && existing.aboutImageUrl !== newAboutImagePath) {
      imagesToDelete.push(existing.aboutImageUrl);
    }
  }

  if (!existing) {
    // إنشاء صف الإعدادات إن لم يوجد (القيم غير المُرسلة تبقى NULL)
    const logoPath = logoFile ? `/uploads/${logoFile.filename}` : null;
    const aboutImagePath = aboutImageFile ? `/uploads/${aboutImageFile.filename}` : null;
    await query(
      `INSERT INTO settings (contactPhone, whatsappPhone, companyName, aboutText, facebookUrl, logoUrl,
        aboutTitle, aboutSubtitle,
        aboutSection1Title, aboutSection1Content,
        aboutSection2Title, aboutSection2Content,
        aboutSection3Title, aboutSection3Content,
        aboutImageUrl, theme, updatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP)`,
      [
        contactPhone ?? null,
        whatsappPhone ?? null,
        companyName ?? null,
        aboutText ?? null,
        facebookUrl ?? null,
        logoPath,
        aboutTitle ?? null,
        aboutSubtitle ?? null,
        aboutSection1Title ?? null,
        aboutSection1Content ?? null,
        aboutSection2Title ?? null,
        aboutSection2Content ?? null,
        aboutSection3Title ?? null,
        aboutSection3Content ?? null,
        aboutImagePath,
        theme ?? 'dark'
      ]
    );
  } else if (fields.length > 0) {
    // تحديث الحقول المُرسلة فقط للصف الموجود
    values.push(existing.id);
    await query(
      `UPDATE settings
       SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP
       WHERE id = $` + values.length,
      values
    );

    // حذف الصور القديمة من القرص بعد نجاح التحديث (لتوفير المساحة)
    if (imagesToDelete.length > 0) {
      deleteImageFiles(imagesToDelete);
    }
  }

  const updated = await get('SELECT * FROM settings ORDER BY id LIMIT 1');
  res.status(200).json({
    success: true,
    message: 'تم تحديث الإعدادات بنجاح.',
    data: formatSettings(updated),
  });
}

module.exports = { getSettings, updateSettings };
