const villaModel = require('../models/villaModel');
const { buildImagePaths, deleteImageFiles, getImagesToDelete } = require('./imageHelper');

/**
 * تحويل آمن إلى عدد صحيح، وإرجاع 0 عند الفراغ أو القيم غير الرقمية
 * (المساحة وعدد الغرف اختياريان ويُخزَّنان 0 عند عدم إدخالهما).
 */
function safeInt(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * متحكم الفلل - يحتوي على العمليات العامة وعمليات لوحة التحكم
 */

// ===== العمليات العامة (GET) =====

// GET /api/villas - جميع الفلل (مع فلترة اختيارية حسب النوع)
async function getAllVillas(req, res) {
  const { type } = req.query;
  const includeHidden = req.query.includeHidden === 'true';
  const villas = villaModel.getAll(type, includeHidden);
  res.status(200).json({ success: true, data: villas });
}

// GET /api/villas/:id - تفاصيل فيلا واحدة
async function getVillaById(req, res) {
  const villa = villaModel.getById(req.params.id);
  if (!villa) {
    return res.status(404).json({ success: false, message: 'الفيلا غير موجودة.' });
  }
  res.status(200).json({ success: true, data: villa });
}

// ===== عمليات لوحة التحكم (تحتاج JWT) =====

// POST /api/admin/villas - إضافة فيلا جديدة
async function createVilla(req, res) {
  const images = buildImagePaths(req);
  const villa = villaModel.create({
    type: req.body.type,
    mainTitle: req.body.mainTitle,
    detailedAddress: req.body.detailedAddress,
    description: req.body.description,
    price: parseInt(req.body.price, 10),
    area: safeInt(req.body.area),
    rooms: safeInt(req.body.rooms),
    images,
    isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
    isHidden: req.body.isHidden === true || req.body.isHidden === 'true',
  });
  res.status(201).json({ success: true, message: 'تمت إضافة الفيلا بنجاح.', data: villa });
}

// PUT /api/admin/villas/:id - تعديل فيلا
async function updateVilla(req, res) {
  const existing = villaModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'الفيلا غير موجودة.' });
  }

  const images = buildImagePaths(req);

  const imagesToDelete = getImagesToDelete(existing.images, images);
  deleteImageFiles(imagesToDelete);

  const updated = villaModel.update(req.params.id, {
    type: req.body.type,
    mainTitle: req.body.mainTitle,
    detailedAddress: req.body.detailedAddress,
    description: req.body.description,
    price: parseInt(req.body.price, 10),
    area: safeInt(req.body.area),
    rooms: safeInt(req.body.rooms),
    images,
    isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
    isHidden: req.body.isHidden === true || req.body.isHidden === 'true',
  });
  res.status(200).json({ success: true, message: 'تم تحديث الفيلا بنجاح.', data: updated });
}

// DELETE /api/admin/villas/:id - حذف فيلا
async function deleteVilla(req, res) {
  const existing = villaModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'الفيلا غير موجودة.' });
  }

  deleteImageFiles(existing.images);

  villaModel.remove(req.params.id);
  res.status(200).json({ success: true, message: 'تم حذف الفيلا بنجاح.' });
}

// PUT /api/admin/villas/:id/featured - تغيير حالة المميز
async function setVillaFeatured(req, res) {
  const existing = villaModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'الفيلا غير موجودة.' });
  }

  const isFeatured = req.body.isFeatured === true || req.body.isFeatured === 'true';
  const updated = villaModel.setFeatured(req.params.id, isFeatured);
  res.status(200).json({ success: true, message: 'تم تحديث حالة المميز.', data: updated });
}

// PUT /api/admin/villas/:id/hidden - تغيير حالة الإخفاء
async function setVillaHidden(req, res) {
  const existing = villaModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'الفيلا غير موجودة.' });
  }

  const isHidden = req.body.isHidden === true || req.body.isHidden === 'true';
  const updated = villaModel.setHidden(req.params.id, isHidden);
  res.status(200).json({ success: true, message: 'تم تحديث حالة الإخفاء.', data: updated });
}

module.exports = {
  getAllVillas,
  getVillaById,
  createVilla,
  updateVilla,
  deleteVilla,
  setVillaFeatured,
  setVillaHidden,
};
