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

async function getAll(type, includeHidden = false) {
  let rows;
  if (type) {
    rows = includeHidden
      ? await query('SELECT * FROM apartments WHERE type = $1 ORDER BY createdAt DESC', [type])
      : await query('SELECT * FROM apartments WHERE type = $1 AND isHidden = FALSE ORDER BY createdAt DESC', [type]);
  } else {
    rows = includeHidden
      ? await query('SELECT * FROM apartments ORDER BY createdAt DESC')
      : await query('SELECT * FROM apartments WHERE isHidden = FALSE ORDER BY createdAt DESC');
  }
  return rows.map(formatApartment);
}

async function getById(id) {
  const row = await get('SELECT * FROM apartments WHERE id = $1', [id]);
  return formatApartment(row);
}

async function create(data) {
  const images = JSON.stringify(data.images || []);
  const rows = await query(
    `INSERT INTO apartments (type, mainTitle, detailedAddress, description, price, floors, images, isFeatured, isHidden, createdAt, updatedAt)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id`,
    [data.type, data.mainTitle, data.detailedAddress, data.description || null, data.price, data.floors, images, data.isFeatured ? true : false, data.isHidden ? true : false]
  );
  return getById(rows[0].id);
}

async function update(id, data) {
  const images = JSON.stringify(data.images || []);
  await run(
    `UPDATE apartments
     SET type = $1, mainTitle = $2, detailedAddress = $3, description = $4, price = $5, floors = $6, images = $7, isFeatured = $8, isHidden = $9, updatedAt = CURRENT_TIMESTAMP
     WHERE id = $10`,
    [data.type, data.mainTitle, data.detailedAddress, data.description || null, data.price, data.floors, images, data.isFeatured ? true : false, data.isHidden ? true : false, id]
  );
  return getById(id);
}

async function remove(id) {
  const result = await run('DELETE FROM apartments WHERE id = $1', [id]);
  return result.changes > 0;
}

async function setFeatured(id, isFeatured) {
  await run('UPDATE apartments SET isFeatured = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2', [isFeatured ? true : false, id]);
  return getById(id);
}

async function setHidden(id, isHidden) {
  await run('UPDATE apartments SET isHidden = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2', [isHidden ? true : false, id]);
  return getById(id);
}

async function getAllWithPagination(page, limit, type, includeHidden = false) {
  const offset = (page - 1) * limit;
  let rows;
  if (type) {
    rows = includeHidden
      ? await query('SELECT * FROM apartments WHERE type = $1 AND isHidden = FALSE ORDER BY createdAt DESC LIMIT $2 OFFSET $3', [type, limit, offset])
      : await query('SELECT * FROM apartments WHERE type = $1 AND isHidden = FALSE ORDER BY createdAt DESC LIMIT $2 OFFSET $3', [type, limit, offset]);
  } else {
    rows = includeHidden
      ? await query('SELECT * FROM apartments ORDER BY createdAt DESC LIMIT $1 OFFSET $2', [limit, offset])
      : await query('SELECT * FROM apartments WHERE isHidden = FALSE ORDER BY createdAt DESC LIMIT $1 OFFSET $2', [limit, offset]);
  }

  let countResult;
  if (type) {
    countResult = await get('SELECT COUNT(*) AS total FROM apartments WHERE type = $1 AND isHidden = FALSE', [type]);
  } else {
    countResult = await get('SELECT COUNT(*) AS total FROM apartments WHERE isHidden = FALSE');
  }

  const total = countResult.total;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: rows.map(formatApartment),
    pagination: {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 12,
      total,
      totalPages,
    },
  };
}

module.exports = { getAll, getAllWithPagination, getById, create, update, remove, setFeatured, setHidden };
