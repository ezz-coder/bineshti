const db = require('../db/database');

/**
 * نموذج الشقق (Apartments)
 * ملاحظة: better-sqlite3 متزامن، لذلك الدوال هنا متزامنة،
 * بينما المتحكمات (controllers) تستخدم async/await.
 */

// تحويل نص JSON الخاص بالصور إلى مصفوفة
function parseImages(images) {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// تنسيق الصف القادم من قاعدة البيانات ليصبح كائناً مناسباً للواجهة
function formatApartment(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    mainTitle: row.mainTitle,
    detailedAddress: row.detailedAddress,
    description: row.description,
    price: row.price,
    floors: row.floors,
    images: parseImages(row.images),
    isFeatured: Boolean(row.isFeatured),
    isHidden: Boolean(row.isHidden),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// جلب كل الشقق مع فلترة اختيارية حسب النوع (تُستبعد المخفية افتراضياً للعرض العام)
function getAll(type, includeHidden = false) {
  let rows;
  if (type) {
    rows = includeHidden
      ? db
          .prepare('SELECT * FROM apartments WHERE type = ? ORDER BY createdAt DESC')
          .all(type)
      : db
          .prepare(
            'SELECT * FROM apartments WHERE type = ? AND isHidden = 0 ORDER BY createdAt DESC'
          )
          .all(type);
  } else {
    rows = includeHidden
      ? db.prepare('SELECT * FROM apartments ORDER BY createdAt DESC').all()
      : db.prepare('SELECT * FROM apartments WHERE isHidden = 0 ORDER BY createdAt DESC').all();
  }
  return rows.map(formatApartment);
}

// جلب شقة واحدة بواسطة المعرّف (للإدارة، يعيد العقار حتى لو كان مخفياً)
function getById(id) {
  const row = db.prepare('SELECT * FROM apartments WHERE id = ?').get(id);
  return formatApartment(row);
}

// إنشاء شقة جديدة
function create(data) {
  const images = JSON.stringify(data.images || []);
  const stmt = db.prepare(
    `INSERT INTO apartments (type, mainTitle, detailedAddress, description, price, floors, images, isFeatured, isHidden, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  const result = stmt.run(
    data.type,
    data.mainTitle,
    data.detailedAddress,
    data.description || null,
    data.price,
    data.floors,
    images,
    data.isFeatured ? 1 : 0,
    data.isHidden ? 1 : 0
  );
  return getById(result.lastInsertRowid);
}

// تحديث شقة موجودة
function update(id, data) {
  const images = JSON.stringify(data.images || []);
  const stmt = db.prepare(
    `UPDATE apartments
     SET type = ?, mainTitle = ?, detailedAddress = ?, description = ?, price = ?, floors = ?, images = ?, isFeatured = ?, isHidden = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`
  );
  stmt.run(
    data.type,
    data.mainTitle,
    data.detailedAddress,
    data.description || null,
    data.price,
    data.floors,
    images,
    data.isFeatured ? 1 : 0,
    data.isHidden ? 1 : 0,
    id
  );
  return getById(id);
}

// حذف شقة
function remove(id) {
  const stmt = db.prepare('DELETE FROM apartments WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// تغيير حالة المميز
function setFeatured(id, isFeatured) {
  const stmt = db.prepare(
    'UPDATE apartments SET isFeatured = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
  );
  stmt.run(isFeatured ? 1 : 0, id);
  return getById(id);
}

// تغيير حالة الإخفاء
function setHidden(id, isHidden) {
  const stmt = db.prepare(
    'UPDATE apartments SET isHidden = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
  );
  stmt.run(isHidden ? 1 : 0, id);
  return getById(id);
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  setFeatured,
  setHidden,
};
