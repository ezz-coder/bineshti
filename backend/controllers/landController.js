const landModel = require('../models/landModel');
const { buildImagePaths, deleteImageFiles, getImagesToDelete } = require('./imageHelper');

/**
 * تحويل آمن إلى عدد صحيح، وإرجاع 0 عند الفراغ أو القيم غير الرقمية
 * (المساحة اختيارية وتُخزَّن 0 عند عدم إدخالها).
 */
function safeInt(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * متحكم الأراضي الفارغة - يحتوي على العمليات العامة وعمليات لوحة التحكم
 */

// ===== العمليات العامة (GET) =====

// GET /api/lands - جميع الأراضي (مع فلترة ?type=, ?page=, ?limit=)
async function getAllLands(req, res) {
  const { type, page, limit, includeHidden } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 12;
  const includeHiddenBool = includeHidden === 'true';

  const result = landModel.getAllWithPagination(pageNum, limitNum, type, includeHiddenBool);
  res.status(200).json({ success: true, ...result });
}

// GET /api/lands/:id - تفاصيل أرض واحدة
async function getLandById(req, res) {
  const land = landModel.getById(req.params.id);
  if (!land) {
    return res.status(404).json({ success: false, message: 'الأرض غير موجودة.' });
  }
  res.status(200).json({ success: true, data: land });
}

// ===== عمليات لوحة التحكم (تحتاج JWT) =====

// POST /api/admin/lands - إضافة أرض جديدة
async function createLand(req, res) {
  const images = buildImagePaths(req);
  const land = landModel.create({
    type: req.body.type,
    mainTitle: req.body.mainTitle,
    detailedAddress: req.body.detailedAddress,
    description: req.body.description,
    price: parseInt(req.body.price, 10),
    area: safeInt(req.body.area),
    images,
    isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
    isHidden: req.body.isHidden === true || req.body.isHidden === 'true',
  });
  res.status(201).json({ success: true, message: 'تمت إضافة الأرض بنجاح.', data: land });
}

// PUT /api/admin/lands/:id - تعديل أرض
async function updateLand(req, res) {
  const existing = landModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'الأرض غير موجودة.' });
  }

  const images = buildImagePaths(req);

  const imagesToDelete = getImagesToDelete(existing.images, images);
  deleteImageFiles(imagesToDelete);

  const updated = landModel.update(req.params.id, {
    type: req.body.type,
    mainTitle: req.body.mainTitle,
    detailedAddress: req.body.detailedAddress,
    description: req.body.description,
    price: parseInt(req.body.price, 10),
    area: safeInt(req.body.area),
    images,
    isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
    isHidden: req.body.isHidden === true || req.body.isHidden === 'true',
  });
  res.status(200).json({ success: true, message: 'تم تحديث الأرض بنجاح.', data: updated });
}

// DELETE /api/admin/lands/:id - حذف أرض
async function deleteLand(req, res) {
  const existing = landModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'الأرض غير موجودة.' });
  }

  deleteImageFiles(existing.images);

  landModel.remove(req.params.id);
  res.status(200).json({ success: true, message: 'تم حذف الأرض بنجاح.' });
}

// PUT /api/admin/lands/:id/featured - تغيير حالة المميز
async function setLandFeatured(req, res) {
  const existing = landModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'الأرض غير موجودة.' });
  }

  const isFeatured = req.body.isFeatured === true || req.body.isFeatured === 'true';
  const updated = landModel.setFeatured(req.params.id, isFeatured);
  res.status(200).json({ success: true, message: 'تم تحديث حالة المميز.', data: updated });
}

// PUT /api/admin/lands/:id/hidden - تغيير حالة الإخفاء
async function setLandHidden(req, res) {
  const existing = landModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'الأرض غير موجودة.' });
  }

  const isHidden = req.body.isHidden === true || req.body.isHidden === 'true';
  const updated = landModel.setHidden(req.params.id, isHidden);
  res.status(200).json({ success: true, message: 'تم تحديث حالة الإخفاء.', data: updated });
}

module.exports = {
  getAllLands,
  getLandById,
  createLand,
  updateLand,
  deleteLand,
  setLandFeatured,
  setLandHidden,
};
