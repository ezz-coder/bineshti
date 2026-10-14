const db = require('../db/database');

/**
 * متحكم البحث الشامل - يبحث في جميع حقول كل قسم باستخدام SQL LIKE.
 * ملاحظة: الأعمدة الرقمية (price, floors, area, rooms) تُحوَّل إلى نص
 * بـ CAST(... AS TEXT) حتى يعمل LIKE عليها.
 */

// أعمدة البحث لكل جدول
const SEARCH_COLUMNS = {
  apartments: [
    'mainTitle',
    'detailedAddress',
    'description',
    'CAST(price AS TEXT)',
    'CAST(floors AS TEXT)',
    'type',
  ],
  villas: [
    'mainTitle',
    'detailedAddress',
    'description',
    'CAST(price AS TEXT)',
    'CAST(area AS TEXT)',
    'CAST(rooms AS TEXT)',
    'type',
  ],
  lands: [
    'mainTitle',
    'detailedAddress',
    'description',
    'CAST(price AS TEXT)',
    'CAST(area AS TEXT)',
    'type',
  ],
};

const TABLE_CATEGORY = {
  apartments: 'apartment',
  villas: 'villa',
  lands: 'land',
};

// تحويل نص JSON الخاص بالصور إلى مصفوفة (مثل النماذج)
function parseImages(images) {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// تجهيز الصف ليطابق شكل استجابة النماذج + حقل category
function formatRow(table, row) {
  return {
    ...row,
    images: parseImages(row.images),
    isFeatured: Boolean(row.isFeatured),
    isHidden: Boolean(row.isHidden),
    category: TABLE_CATEGORY[table],
  };
}

// هروب رموز LIKE الخاصة (% و _ و \) من إدخال المستخدم
function escapeLike(value) {
  return value.replace(/[\\%_]/g, (ch) => '\\' + ch);
}

// بناء شرط OR لقيمة واحدة على كل أعمدة الجدول
function buildOrCondition(columns, value) {
  const pattern = `%${escapeLike(value)}%`;
  return {
    sql: `(${columns.map((c) => `${c} LIKE ? ESCAPE '\\'`).join(' OR ')})`,
    params: columns.map(() => pattern),
  };
}

// تنفيذ البحث في جداول الثلاثة مع دمج شروط متعددة
function runSearch(tables, joiner, buildGroups) {
  const result = { apartments: [], villas: [], lands: [] };

  for (const table of tables) {
    const columns = SEARCH_COLUMNS[table];
    const groups = buildGroups(columns); // [{ sql, params }]
    const where = groups.map((g) => g.sql).join(` ${joiner} `);
    const params = groups.flatMap((g) => g.params);

    const rows = db
      .prepare(
        `SELECT * FROM ${table} WHERE isHidden = 0 AND ${where} ORDER BY createdAt DESC`
      )
      .all(...params);

    result[table] = rows.map((row) => formatRow(table, row));
  }

  return result;
}

function countResults(data) {
  return data.apartments.length + data.villas.length + data.lands.length;
}

// GET /api/search?q=keyword - البحث الشامل في كل الحقول
async function search(req, res) {
  const query = (req.query.q || '').trim();

  if (!query) {
    return res.status(200).json({
      success: true,
      data: { apartments: [], villas: [], lands: [] },
    });
  }

  const tables = ['apartments', 'villas', 'lands'];
  const words = query.split(/\s+/).filter(Boolean);

  // المحاولة 1: البحث بالعبارة كاملة في كل الحقول (OR بين الحقول)
  let data = runSearch(tables, 'OR', (columns) => [
    buildOrCondition(columns, query),
  ]);

  // المحاولة 2: كل كلمة من العبارة تظهر في أي حقل (AND بين الكلمات)
  if (countResults(data) === 0 && words.length > 1) {
    data = runSearch(tables, 'AND', (columns) =>
      words.map((word) => buildOrCondition(columns, word))
    );

    // المحاولة 3: أي كلمة تظهر في أي حقل (OR بين الكلمات)
    if (countResults(data) === 0) {
      data = runSearch(tables, 'OR', (columns) =>
        words.map((word) => buildOrCondition(columns, word))
      );
    }
  }

  res.status(200).json({ success: true, data });
}

module.exports = { search };