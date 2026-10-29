const { query, get, run } = require('../db/database');

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

async function getAll(type, includeHidden = false) {
  let rows;
  if (type) {
    rows = includeHidden
      ? await query('SELECT * FROM villas WHERE type = $1 ORDER BY createdAt DESC', [type])
      : await query('SELECT * FROM villas WHERE type = $1 AND isHidden = FALSE ORDER BY createdAt DESC', [type]);
  } else {
    rows = includeHidden
      ? await query('SELECT * FROM villas ORDER BY createdAt DESC')
      : await query('SELECT * FROM villas WHERE isHidden = FALSE ORDER BY createdAt DESC');
  }
  return rows.map(formatVilla);
}

async function getById(id) {
  const row = await get('SELECT * FROM villas WHERE id = $1', [id]);
  return formatVilla(row);
}

async function create(data) {
  const images = JSON.stringify(data.images || []);
  const rows = await query(
    `INSERT INTO villas (type, mainTitle, detailedAddress, description, price, area, rooms, images, isFeatured, isHidden, createdAt, updatedAt)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id`,
    [data.type, data.mainTitle, data.detailedAddress, data.description || null, data.price, data.area, data.rooms, images, data.isFeatured ? true : false, data.isHidden ? true : false]
  );
  return getById(rows[0].id);
}

async function update(id, data) {
  const images = JSON.stringify(data.images || []);
  await run(
    `UPDATE villas
     SET type = $1, mainTitle = $2, detailedAddress = $3, description = $4, price = $5, area = $6, rooms = $7, images = $8, isFeatured = $9, isHidden = $10, updatedAt = CURRENT_TIMESTAMP
     WHERE id = $11`,
    [data.type, data.mainTitle, data.detailedAddress, data.description || null, data.price, data.area, data.rooms, images, data.isFeatured ? true : false, data.isHidden ? true : false, id]
  );
  return getById(id);
}

async function remove(id) {
  const result = await run('DELETE FROM villas WHERE id = $1', [id]);
  return result.changes > 0;
}

async function setFeatured(id, isFeatured) {
  await run('UPDATE villas SET isFeatured = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2', [isFeatured ? true : false, id]);
  return getById(id);
}

async function setHidden(id, isHidden) {
  await run('UPDATE villas SET isHidden = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2', [isHidden ? true : false, id]);
  return getById(id);
}

async function getAllWithPagination(page, limit, type, includeHidden = false) {
  const offset = (page - 1) * limit;
  let rows;
  if (type) {
    rows = includeHidden
      ? await query('SELECT * FROM villas WHERE type = $1 ORDER BY createdAt DESC LIMIT $2 OFFSET $3', [type, limit, offset])
      : await query('SELECT * FROM villas WHERE type = $1 AND isHidden = FALSE ORDER BY createdAt DESC LIMIT $2 OFFSET $3', [type, limit, offset]);
  } else {
    rows = includeHidden
      ? await query('SELECT * FROM villas ORDER BY createdAt DESC LIMIT $1 OFFSET $2', [limit, offset])
      : await query('SELECT * FROM villas WHERE isHidden = FALSE ORDER BY createdAt DESC LIMIT $1 OFFSET $2', [limit, offset]);
  }

  let countResult;
  if (type) {
    countResult = includeHidden
      ? await get('SELECT COUNT(*) AS total FROM villas WHERE type = $1', [type])
      : await get('SELECT COUNT(*) AS total FROM villas WHERE type = $1 AND isHidden = FALSE', [type]);
  } else {
    countResult = includeHidden
      ? await get('SELECT COUNT(*) AS total FROM villas')
      : await get('SELECT COUNT(*) AS total FROM villas WHERE isHidden = FALSE');
  }

  const total = countResult.total;
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

module.exports = { getAll, getAllWithPagination, getById, create, update, remove, setFeatured, setHidden };
