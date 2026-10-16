const db = require('../db/database');

/**
 * نموذج الفلل (Villas)
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

function formatVilla(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    mainTitle: row.mainTitle,
    detailedAddress: row.detailedAddress,
    description: row.description,
    price: row.price,
    area: row.area,
    rooms: row.rooms,
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
          .prepare('SELECT * FROM villas WHERE type = ? ORDER BY createdAt DESC')
          .all(type)
      : db
          .prepare(
            'SELECT * FROM villas WHERE type = ? AND isHidden = 0 ORDER BY createdAt DESC'
          )
          .all(type);
  } else {
    rows = includeHidden
      ? db.prepare('SELECT * FROM villas ORDER BY createdAt DESC').all()
      : db.prepare('SELECT * FROM villas WHERE isHidden = 0 ORDER BY createdAt DESC').all();
  }
  return rows.map(formatVilla);
}

function getById(id) {
  const row = db.prepare('SELECT * FROM villas WHERE id = ?').get(id);
  return formatVilla(row);
}

function create(data) {
  const images = JSON.stringify(data.images || []);
  const stmt = db.prepare(
    `INSERT INTO villas (type, mainTitle, detailedAddress, description, price, area, rooms, images, isFeatured, isHidden, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  const result = stmt.run(
    data.type,
    data.mainTitle,
    data.detailedAddress,
    data.description || null,
    data.price,
    data.area,
    data.rooms,
    images,
    data.isFeatured ? 1 : 0,
    data.isHidden ? 1 : 0
  );
  return getById(result.lastInsertRowid);
}

function update(id, data) {
  const images = JSON.stringify(data.images || []);
  const stmt = db.prepare(
    `UPDATE villas
     SET type = ?, mainTitle = ?, detailedAddress = ?, description = ?, price = ?, area = ?, rooms = ?, images = ?, isFeatured = ?, isHidden = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`
  );
  stmt.run(
    data.type,
    data.mainTitle,
    data.detailedAddress,
    data.description || null,
    data.price,
    data.area,
    data.rooms,
    images,
    data.isFeatured ? 1 : 0,
    data.isHidden ? 1 : 0,
    id
  );
  return getById(id);
}

function remove(id) {
  const stmt = db.prepare('DELETE FROM villas WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

function setFeatured(id, isFeatured) {
  const stmt = db.prepare(
    'UPDATE villas SET isFeatured = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
  );
  stmt.run(isFeatured ? 1 : 0, id);
  return getById(id);
}

function setHidden(id, isHidden) {
  const stmt = db.prepare(
    'UPDATE villas SET isHidden = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
  );
  stmt.run(isHidden ? 1 : 0, id);
  return getById(id);
}

// جلب الفلل مع pagination
function getAllWithPagination(page, limit, type, includeHidden = false) {
  const offset = (page - 1) * limit;
  let rows;
  
  if (type) {
    rows = includeHidden
      ? db
          .prepare(
            'SELECT * FROM villas WHERE type = ? AND isHidden = 0 ORDER BY createdAt DESC LIMIT ? OFFSET ?'
          )
          .all(type, limit, offset)
      : db
          .prepare(
            'SELECT * FROM villas WHERE type = ? AND isHidden = 0 ORDER BY createdAt DESC LIMIT ? OFFSET ?'
          )
          .all(type, limit, offset);
  } else {
    rows = includeHidden
      ? db.prepare('SELECT * FROM villas ORDER BY createdAt DESC LIMIT ? OFFSET ?').all(limit, offset)
      : db.prepare('SELECT * FROM villas WHERE isHidden = 0 ORDER BY createdAt DESC LIMIT ? OFFSET ?').all(limit, offset);
  }
  
  // جلب العدد الإجمالي للنتائج
  let countStmt;
  if (type) {
    countStmt = db.prepare('SELECT COUNT(*) AS total FROM villas WHERE type = ? AND isHidden = 0').get(type);
  } else {
    countStmt = db.prepare('SELECT COUNT(*) AS total FROM villas WHERE isHidden = 0').get();
  }
  
  const total = countStmt.total;
  const totalPages = Math.ceil(total / limit) || 1;
  
  return {
    data: rows.map(formatVilla),
    pagination: {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 12,
      total,
      totalPages,
    },
  };
}

module.exports = {
  getAll,
  getAllWithPagination,
  getById,
  create,
  update,
  remove,
  setFeatured,
  setHidden,
};
