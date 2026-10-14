const db = require('../db/database');

/**
 * نموذج الأراضي الفارغة (Lands)
 * ملاحظة: better-sqlite3 متزامن، لذلك الدوال هنا متزامنة،
 * بينما المتحكمات (controllers) تستخدم async/await.
 */

function parseImages(images) {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function formatLand(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    mainTitle: row.mainTitle,
    detailedAddress: row.detailedAddress,
    description: row.description,
    price: row.price,
    area: row.area,
    images: parseImages(row.images),
    isFeatured: Boolean(row.isFeatured),
    isHidden: Boolean(row.isHidden),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function getAll(type, includeHidden = false) {
  let rows;
  if (type) {
    rows = includeHidden
      ? db
          .prepare('SELECT * FROM lands WHERE type = ? ORDER BY createdAt DESC')
          .all(type)
      : db
          .prepare(
            'SELECT * FROM lands WHERE type = ? AND isHidden = 0 ORDER BY createdAt DESC'
          )
          .all(type);
  } else {
    rows = includeHidden
      ? db.prepare('SELECT * FROM lands ORDER BY createdAt DESC').all()
      : db.prepare('SELECT * FROM lands WHERE isHidden = 0 ORDER BY createdAt DESC').all();
  }
  return rows.map(formatLand);
}

function getById(id) {
  const row = db.prepare('SELECT * FROM lands WHERE id = ?').get(id);
  return formatLand(row);
}

function create(data) {
  const images = JSON.stringify(data.images || []);
  const stmt = db.prepare(
    `INSERT INTO lands (type, mainTitle, detailedAddress, description, price, area, images, isFeatured, isHidden, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  const result = stmt.run(
    data.type,
    data.mainTitle,
    data.detailedAddress,
    data.description || null,
    data.price,
    data.area,
    images,
    data.isFeatured ? 1 : 0,
    data.isHidden ? 1 : 0
  );
  return getById(result.lastInsertRowid);
}

function update(id, data) {
  const images = JSON.stringify(data.images || []);
  const stmt = db.prepare(
    `UPDATE lands
     SET type = ?, mainTitle = ?, detailedAddress = ?, description = ?, price = ?, area = ?, images = ?, isFeatured = ?, isHidden = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`
  );
  stmt.run(
    data.type,
    data.mainTitle,
    data.detailedAddress,
    data.description || null,
    data.price,
    data.area,
    images,
    data.isFeatured ? 1 : 0,
    data.isHidden ? 1 : 0,
    id
  );
  return getById(id);
}

function remove(id) {
  const stmt = db.prepare('DELETE FROM lands WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

function setFeatured(id, isFeatured) {
  const stmt = db.prepare(
    'UPDATE lands SET isFeatured = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
  );
  stmt.run(isFeatured ? 1 : 0, id);
  return getById(id);
}

function setHidden(id, isHidden) {
  const stmt = db.prepare(
    'UPDATE lands SET isHidden = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
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
