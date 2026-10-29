const { query, get } = require('../db/database');

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
  houses: [
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
  houses: 'house',
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

// بناء شرط OR لقيمة واحدة على كل أعمدة الجدول.
// startIndex: رقم المعامل الأول ($n) لتبقى الترقيمات متسلسلة عند دمج عدة مجموعات.
function buildOrCondition(columns, value, startIndex) {
  const pattern = `%${escapeLike(value)}%`;
  return {
    sql: `(${columns.map((c, i) => `${c} LIKE $${startIndex + i} ESCAPE '\\'`).join(' OR ')})`,
    params: columns.map(() => pattern),
  };
}

// تنفيذ البحث في الجداول الثلاثة مع دمج شروط متعددة ودعم pagination
async function runSearch(tables, joiner, words, page, limit) {
  const result = { apartments: [], villas: [], houses: [], lands: [] };
  let total = 0;

  for (const table of tables) {
    const columns = SEARCH_COLUMNS[table];

    // ترقيم متسلسل للمعاملات ($1, $2, …) عبر كل مجموعات الشروط
    let nextIndex = 1;
    const groups = words.map((word) => {
      const group = buildOrCondition(columns, word, nextIndex);
      nextIndex += columns.length;
      return group;
    });

    const where = groups.map((g) => g.sql).join(` ${joiner} `);
    const params = groups.flatMap((g) => g.params);

    const countResult = await get(
      `SELECT COUNT(*) AS total FROM ${table} WHERE isHidden = FALSE AND ${where}`,
      params
    );
    total += Number(countResult?.total || 0);

    const offset = (page - 1) * limit;
    const rows = await query(
      `SELECT * FROM ${table} WHERE isHidden = FALSE AND ${where} ORDER BY createdAt DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    result[table] = rows.map((row) => formatRow(table, row));
  }

  return {
    data: result,
    pagination: {
      page,
      limit,
      total,
      totalPages: total > 0 ? Math.ceil(total / limit) : 1,
    },
  };
}

function countResults(data) {
  return data.apartments.length + data.villas.length + data.houses.length + data.lands.length;
}

// GET /api/search?q=keyword - البحث الشامل في كل الحقول
async function search(req, res) {
  try {
    const keyword = (req.query.q || '').trim();
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;

    if (!keyword) {
      return res.status(200).json({
        success: true,
        data: { apartments: [], villas: [], houses: [], lands: [] },
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const tables = ['apartments', 'villas', 'houses', 'lands'];
    const words = keyword.split(/\s+/).filter(Boolean);

    // المحاولة 1: البحث بالعبارة كاملة في كل الحقول (OR بين الحقول)
    let result = await runSearch(tables, 'OR', [keyword], page, limit);

    // المحاولة 2: كل كلمة من العبارة تظهر في أي حقل (AND بين الكلمات)
    if (countResults(result.data) === 0 && words.length > 1) {
      result = await runSearch(tables, 'AND', words, page, limit);

      // المحاولة 3: أي كلمة تظهر في أي حقل (OR بين الكلمات)
      if (countResults(result.data) === 0) {
        result = await runSearch(tables, 'OR', words, page, limit);
      }
    }

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('❌ فشل البحث:', err.message);
    return res.status(500).json({ success: false, message: 'تعذّر تنفيذ البحث.' });
  }
}

module.exports = { search };
