const houseModel = require('../models/houseModel');
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
 * متحكم البيوت - يحتوي على العمليات العامة وعمليات لوحة التحكم
 */

// ===== العمليات العامة (GET) =====

// GET /api/houses - جميع البيوت (مع فلترة ?type=, ?page=, ?limit=)
async function getAllHouses(req, res) {
  const { type, page, limit, includeHidden } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 12;
  // ?includeHidden=true يُحترم فقط لطلب موثّق كأدمن (لوحة التحكم)، حتى لا تُكشف البيوت المخفية للزوار.
  const includeHiddenBool = includeHidden === 'true' && Boolean(req.admin);

  const result = await houseModel.getAllWithPagination(pageNum, limitNum, type, includeHiddenBool);
  res.status(200).json({ success: true, ...result });
}

// GET /api/houses/:id - تفاصيل بيت واحد
async function getHouseById(req, res) {
  const house = await houseModel.getById(req.params.id);
  if (!house) {
    return res.status(404).json({ success: false, message: 'البيت غير موجود.' });
  }
  res.status(200).json({ success: true, data: house });
}

// ===== عمليات لوحة التحكم (تحتاج JWT) =====

// POST /api/admin/houses - إضافة بيت جديد
async function createHouse(req, res) {
  const images = buildImagePaths(req);
  const house = await houseModel.create({
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
  res.status(201).json({ success: true, message: 'تمت إضافة البيت بنجاح.', data: house });
}

// PUT /api/admin/houses/:id - تعديل بيت
async function updateHouse(req, res) {
  const existing = await houseModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'البيت غير موجود.' });
  }

  const images = buildImagePaths(req);

  const imagesToDelete = getImagesToDelete(existing.images, images);
  deleteImageFiles(imagesToDelete);

  const updated = await houseModel.update(req.params.id, {
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
  res.status(200).json({ success: true, message: 'تم تحديث البيت بنجاح.', data: updated });
}

// DELETE /api/admin/houses/:id - حذف بيت
async function deleteHouse(req, res) {
  const existing = await houseModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'البيت غير موجود.' });
  }

  deleteImageFiles(existing.images);

  await houseModel.remove(req.params.id);
  res.status(200).json({ success: true, message: 'تم حذف البيت بنجاح.' });
}

// PUT /api/admin/houses/:id/featured - تغيير حالة المميز
async function setHouseFeatured(req, res) {
  const existing = await houseModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'البيت غير موجود.' });
  }

  const isFeatured = req.body.isFeatured === true || req.body.isFeatured === 'true';
  const updated = await houseModel.setFeatured(req.params.id, isFeatured);
  res.status(200).json({ success: true, message: 'تم تحديث حالة المميز.', data: updated });
}

// PUT /api/admin/houses/:id/hidden - تغيير حالة الإخفاء
async function setHouseHidden(req, res) {
  const existing = await houseModel.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'البيت غير موجود.' });
  }

  const isHidden = req.body.isHidden === true || req.body.isHidden === 'true';
  const updated = await houseModel.setHidden(req.params.id, isHidden);
  res.status(200).json({ success: true, message: 'تم تحديث حالة الإخفاء.', data: updated });
}

module.exports = {
  getAllHouses,
  getHouseById,
  createHouse,
  updateHouse,
  deleteHouse,
  setHouseFeatured,
  setHouseHidden,
};
