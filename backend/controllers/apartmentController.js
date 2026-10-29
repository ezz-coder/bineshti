const apartmentModel = require('../models/apartmentModel');
const { buildImagePaths, deleteImageFiles, getImagesToDelete } = require('./imageHelper');

/**
 * تحويل آمن إلى عدد صحيح، وإرجاع 0 عند الفراغ أو القيم غير الرقمية
 * (حقول مثل الطوابق/المساحة/الغرف اختيارية وتُخزَّن 0 عند عدم إدخالها).
 */
function safeInt(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * متحكم الشقق - يحتوي على العمليات العامة وعمليات لوحة التحكم
 */

// ===== العمليات العامة (GET) =====

// GET /api/apartments - جميع الشقق (مع فلترة ?type=, ?page=, ?limit=)
// ملاحظة: لوحة التحكم ترسل ?includeHidden=true لرؤية العقارات المخفية أيضاً.
async function getAllApartments(req, res) {
  const { type, page, limit, includeHidden } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 12;
  // ?includeHidden=true يُحترم فقط لطلب موثّق كأدمن (لوحة التحكم)، حتى لا تُكشف العقارات المخفية للزوار.
  const includeHiddenBool = includeHidden === 'true' && Boolean(req.admin);
  
  const result = await apartmentModel.getAllWithPagination(pageNum, limitNum, type, includeHiddenBool);
  res.status(200).json({ success: true, ...result });
}

// GET /api/apartments/:id - تفاصيل شقة واحدة
async function getApartmentById(req, res) {
  const apartment = await apartmentModel.getById(req.params.id);
  if (!apartment) {
    return res.status(404).json({ success: false, message: 'الشقة غير موجودة.' });
  }
  res.status(200).json({ success: true, data: apartment });
}

// ===== عمليات لوحة التحكم (تحتاج JWT) =====

// POST /api/admin/apartments - إضافة شقة جديدة
async function createApartment(req, res) {
  const images = buildImagePaths(req);
  const apartment = await apartmentModel.create({
    type: req.body.type,
    mainTitle: req.body.mainTitle,
    detailedAddress: req.body.detailedAddress,
    description: req.body.description,
    price: parseInt(req.body.price, 10),
    floors: safeInt(req.body.floors),
    images,
    isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
    isHidden: req.body.isHidden === true || req.body.isHidden === 'true',
  });
  res.status(201).json({ success: true, message: 'تمت إضافة الشقة بنجاح.', data: apartment });
}

// PUT /api/admin/apartments/:id - تعديل شقة
async function updateApartment(req, res) {
  const existing = await apartmentModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'الشقة غير موجودة.' });
  }

  const images = buildImagePaths(req);

  // حذف الصور التي أزيلت من التخزين
  const imagesToDelete = getImagesToDelete(existing.images, images);
  deleteImageFiles(imagesToDelete);

  const updated = await apartmentModel.update(req.params.id, {
    type: req.body.type,
    mainTitle: req.body.mainTitle,
    detailedAddress: req.body.detailedAddress,
    description: req.body.description,
    price: parseInt(req.body.price, 10),
    floors: safeInt(req.body.floors),
    images,
    isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
    isHidden: req.body.isHidden === true || req.body.isHidden === 'true',
  });
  res.status(200).json({ success: true, message: 'تم تحديث الشقة بنجاح.', data: updated });
}

// DELETE /api/admin/apartments/:id - حذف شقة
async function deleteApartment(req, res) {
  const existing = await apartmentModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'الشقة غير موجودة.' });
  }

  // حذف الصور المرتبطة من التخزين
  deleteImageFiles(existing.images);

  await apartmentModel.remove(req.params.id);
  res.status(200).json({ success: true, message: 'تم حذف الشقة بنجاح.' });
}

// PUT /api/admin/apartments/:id/featured - تغيير حالة المميز
async function setApartmentFeatured(req, res) {
  const existing = await apartmentModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'الشقة غير موجودة.' });
  }

  const isFeatured = req.body.isFeatured === true || req.body.isFeatured === 'true';
  const updated = await apartmentModel.setFeatured(req.params.id, isFeatured);
  res.status(200).json({ success: true, message: 'تم تحديث حالة المميز.', data: updated });
}

// PUT /api/admin/apartments/:id/hidden - تغيير حالة الإخفاء
async function setApartmentHidden(req, res) {
  const existing = await apartmentModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'الشقة غير موجودة.' });
  }

  const isHidden = req.body.isHidden === true || req.body.isHidden === 'true';
  const updated = await apartmentModel.setHidden(req.params.id, isHidden);
  res.status(200).json({ success: true, message: 'تم تحديث حالة الإخفاء.', data: updated });
}

module.exports = {
  getAllApartments,
  getApartmentById,
  createApartment,
  updateApartment,
  deleteApartment,
  setApartmentFeatured,
  setApartmentHidden,
};
