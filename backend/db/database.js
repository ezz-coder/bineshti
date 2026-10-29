const bcrypt = require('bcryptjs');

/**
 * Database module - automatic dual mode:
 * - If DATABASE_URL exists: PostgreSQL (production on Railway)
 * - Otherwise: local SQLite (no setup needed - for development)
 * Exported interface is identical in both cases: query / get / run / close / dbReady
 */
const USE_PG = Boolean(process.env.DATABASE_URL);

let pool = null; // PostgreSQL
let sqlite = null; // SQLite

if (USE_PG) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
} else {
  // ===== SQLite محلي =====
  const path = require('path');
  const fs = require('fs');
  const { Database } = require('./sqliteCompat');

  const DB_PATH = path.join(__dirname, 'realEstate.db');

  function removeSidecars(p) {
    ['-wal', '-shm', '-journal'].forEach((suffix) => {
      try {
        const sidecar = p + suffix;
        if (fs.existsSync(sidecar)) fs.unlinkSync(sidecar);
      } catch (e) { /* تجاهل */ }
    });
  }

  function openDatabase(p) {
    try {
      return new Database(p);
    } catch (err) {
      console.error('⚠️ فشل فتح قاعدة البيانات، سيتم إنشاء نسخة جديدة:', err.message);
      try {
        const backup = p + '.corrupt-' + Date.now() + '.bak';
        if (fs.existsSync(p)) fs.renameSync(p, backup);
      } catch (e) { /* تجاهل */ }
      removeSidecars(p);
      return new Database(p);
    }
  }

  removeSidecars(DB_PATH);
  sqlite = openDatabase(DB_PATH);
  try {
    const wal = sqlite.pragma('journal_mode = WAL');
    if (!wal || String(wal[0] && wal[0].journal_mode).toLowerCase() !== 'wal') {
      sqlite.pragma('journal_mode = DELETE');
    }
  } catch (e) {
    try { sqlite.pragma('journal_mode = DELETE'); } catch (e2) { /* تجاهل */ }
  }
  sqlite.pragma('foreign_keys = ON');
}

// تحويل القيم المنطقية إلى 1/0 لتوافق SQLite
function sanitizeParams(params) {
  if (!params || params.length === 0) return [];
  return params.map((p) => (p === true ? 1 : p === false ? 0 : p));
}

// تحويل علامات PostgreSQL ($1, $2…) إلى علامات SQLite الترتيبية (?)
function toSqliteSql(text) {
  return text.replace(/\$\d+/g, '?');
}

// PostgreSQL يطوي أسماء الأعمدة غير المُقتبسة إلى حروف صغيرة (mainTitle → maintitle)،
// لذا يعود كل صف من SELECT * بمفاتيح صغيرة لا تطابق الكود المشترك مع SQLite.
// نُعيد هنا المفاتيح إلى صيغة camelCase الأصلية.
const PG_COLUMN_NAMES = {
  contactphone: 'contactPhone',
  whatsappphone: 'whatsappPhone',
  companyname: 'companyName',
  aboutext: 'aboutText',
  logourl: 'logoUrl',
  facebookurl: 'facebookUrl',
  abouttitle: 'aboutTitle',
  aboutsubtitle: 'aboutSubtitle',
  aboutsection1title: 'aboutSection1Title',
  aboutsection1content: 'aboutSection1Content',
  aboutsection2title: 'aboutSection2Title',
  aboutsection2content: 'aboutSection2Content',
  aboutsection3title: 'aboutSection3Title',
  aboutsection3content: 'aboutSection3Content',
  aboutimageurl: 'aboutImageUrl',
  maintitle: 'mainTitle',
  detailedaddress: 'detailedAddress',
  isfeatured: 'isFeatured',
  ishidden: 'isHidden',
  createdat: 'createdAt',
  updatedat: 'updatedAt',
};

function normalizePgRow(row) {
  const normalized = {};
  Object.keys(row).forEach((key) => {
    normalized[PG_COLUMN_NAMES[key] || key] = row[key];
  });
  return normalized;
}

async function query(text, params = []) {
  if (pool) {
    const result = await pool.query(text, params);
    return result.rows.map(normalizePgRow);
  }
  return sqlite.prepare(toSqliteSql(text)).all(...sanitizeParams(params));
}

async function get(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}

async function run(text, params = []) {
  if (pool) {
    const result = await pool.query(text, params);
    return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id ?? 0 };
  }
  const info = sqlite.prepare(toSqliteSql(text)).run(...sanitizeParams(params));
  return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
}

async function close() {
  if (pool) await pool.end();
  if (sqlite) sqlite.close();
}

async function initializeTablesPg() {
  await query(`CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);
  await query(`CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    contactPhone TEXT,
    whatsappPhone TEXT,
    companyName TEXT,
    aboutText TEXT,
    logoUrl TEXT,
    facebookUrl TEXT,
    aboutTitle TEXT,
    aboutSubtitle TEXT,
    aboutSection1Title TEXT,
    aboutSection1Content TEXT,
    aboutSection2Title TEXT,
    aboutSection2Content TEXT,
    aboutSection3Title TEXT,
    aboutSection3Content TEXT,
    aboutImageUrl TEXT,
    theme TEXT DEFAULT 'dark',
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);
  await query(`CREATE TABLE IF NOT EXISTS apartments (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK(type IN ('إيجار', 'تمليك')),
    mainTitle VARCHAR(255) NOT NULL,
    detailedAddress TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    floors INTEGER NOT NULL,
    images TEXT NOT NULL DEFAULT '[]',
    isFeatured BOOLEAN NOT NULL DEFAULT FALSE,
    isHidden BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);
  await query(`CREATE TABLE IF NOT EXISTS villas (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK(type IN ('إيجار', 'تمليك')),
    mainTitle VARCHAR(255) NOT NULL,
    detailedAddress TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    area INTEGER NOT NULL,
    rooms INTEGER NOT NULL,
    images TEXT NOT NULL DEFAULT '[]',
    isFeatured BOOLEAN NOT NULL DEFAULT FALSE,
    isHidden BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);
  await query(`CREATE TABLE IF NOT EXISTS lands (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK(type IN ('إيجار', 'تمليك')),
    mainTitle VARCHAR(255) NOT NULL,
    detailedAddress TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    area INTEGER NOT NULL,
    images TEXT NOT NULL DEFAULT '[]',
    isFeatured BOOLEAN NOT NULL DEFAULT FALSE,
    isHidden BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);
  await query(`CREATE INDEX IF NOT EXISTS idx_apartments_type ON apartments(type);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_apartments_featured ON apartments(isFeatured);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_apartments_hidden ON apartments(isHidden);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_apartments_created ON apartments(createdAt DESC);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_villas_type ON villas(type);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_villas_featured ON villas(isFeatured);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_villas_hidden ON villas(isHidden);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_villas_created ON villas(createdAt DESC);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_lands_type ON lands(type);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_lands_featured ON lands(isFeatured);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_lands_hidden ON lands(isHidden);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_lands_created ON lands(createdAt DESC);`);
}

function initializeTablesSqlite() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS apartments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('إيجار', 'تمليك')),
      mainTitle TEXT NOT NULL,
      detailedAddress TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      floors INTEGER NOT NULL,
      images TEXT NOT NULL DEFAULT '[]',
      isFeatured INTEGER NOT NULL DEFAULT 0,
      isHidden INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS villas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('إيجار', 'تمليك')),
      mainTitle TEXT NOT NULL,
      detailedAddress TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      area INTEGER NOT NULL,
      rooms INTEGER NOT NULL,
      images TEXT NOT NULL DEFAULT '[]',
      isFeatured INTEGER NOT NULL DEFAULT 0,
      isHidden INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS lands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('إيجار', 'تمليك')),
      mainTitle TEXT NOT NULL,
      detailedAddress TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      area INTEGER NOT NULL,
      images TEXT NOT NULL DEFAULT '[]',
      isFeatured INTEGER NOT NULL DEFAULT 0,
      isHidden INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contactPhone TEXT,
      whatsappPhone TEXT,
      companyName TEXT,
      aboutText TEXT,
      logoUrl TEXT,
      facebookUrl TEXT,
      aboutTitle TEXT,
      aboutSubtitle TEXT,
      aboutSection1Title TEXT,
      aboutSection1Content TEXT,
      aboutSection2Title TEXT,
      aboutSection2Content TEXT,
      aboutSection3Title TEXT,
      aboutSection3Content TEXT,
      aboutImageUrl TEXT,
      theme TEXT DEFAULT 'dark',
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_apartments_type ON apartments(type);
    CREATE INDEX IF NOT EXISTS idx_apartments_featured ON apartments(isFeatured);
    CREATE INDEX IF NOT EXISTS idx_apartments_hidden ON apartments(isHidden);
    CREATE INDEX IF NOT EXISTS idx_apartments_created ON apartments(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_villas_type ON villas(type);
    CREATE INDEX IF NOT EXISTS idx_villas_featured ON villas(isFeatured);
    CREATE INDEX IF NOT EXISTS idx_villas_hidden ON villas(isHidden);
    CREATE INDEX IF NOT EXISTS idx_villas_created ON villas(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_lands_type ON lands(type);
    CREATE INDEX IF NOT EXISTS idx_lands_featured ON lands(isFeatured);
    CREATE INDEX IF NOT EXISTS idx_lands_hidden ON lands(isHidden);
    CREATE INDEX IF NOT EXISTS idx_lands_created ON lands(createdAt DESC);
  `);

  // ترقية تدريجية آمنة للجداول القديمة
  ['apartments', 'villas', 'lands'].forEach((table) => {
    const columns = sqlite.pragma(`table_info(${table})`);
    if (!columns.some((col) => col.name === 'isHidden')) {
      sqlite.exec(`ALTER TABLE ${table} ADD COLUMN isHidden INTEGER NOT NULL DEFAULT 0`);
    }
  });
  const settingsColumns = sqlite.pragma('table_info(settings)').map((col) => col.name);
  [
    'whatsappPhone', 'logoUrl', 'facebookUrl', 'aboutTitle', 'aboutSubtitle',
    'aboutSection1Title', 'aboutSection1Content', 'aboutSection2Title',
    'aboutSection2Content', 'aboutSection3Title', 'aboutSection3Content',
    'aboutImageUrl',
  ].forEach((col) => {
    if (!settingsColumns.includes(col)) {
      sqlite.exec(`ALTER TABLE settings ADD COLUMN ${col} TEXT`);
    }
  });
  if (!settingsColumns.includes('theme')) {
    sqlite.exec("ALTER TABLE settings ADD COLUMN theme TEXT DEFAULT 'dark'");
  }
}

async function seedInitialData() {
  // ملاحظة مهمة: في PostgreSQL تُرجع COUNT(*) نصاً (bigint) وليس رقماً،
  // لذا يجب التحويل بـ Number() وإلا تفشل المقارنة ولا يُزرع حساب المدير.
  const settingsCount = await get('SELECT COUNT(*) AS count FROM settings');
  if (Number(settingsCount.count) === 0) {
    await query(
      `INSERT INTO settings (contactPhone, companyName, aboutText, updatedAt)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [process.env.CONTACT_PHONE || '', process.env.COMPANY_NAME || 'بي نيشتي للاستثمار العقاري', 'شركة بي نيشتي للاستثمار العقاري - نقدم أفضل العقارات للبيع والإيجار.']
    );
  }
  const adminCount = await get('SELECT COUNT(*) AS count FROM admin');
  if (Number(adminCount.count) === 0) {
    if (!process.env.ADMIN_PASSWORD) {
      console.warn('⚠️ لم يتم ضبط ADMIN_PASSWORD — سيُنشأ حساب المدير بكلمة المرور الافتراضية. اضبط المتغير فوراً وغيّر كلمة المرور.');
    }
    const plainPassword = process.env.ADMIN_PASSWORD || 'Bn@2026!Secure#';
    const hashedPassword = bcrypt.hashSync(plainPassword, 10);
    await query(
      `INSERT INTO admin (username, password, createdAt) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      ['benishaty', hashedPassword]
    );
  }
}

const dbReady = (async () => {
  if (pool) {
    await initializeTablesPg();
  } else {
    initializeTablesSqlite();
  }
  await seedInitialData();
  console.log('✅ قاعدة البيانات جاهزة (' + (USE_PG ? 'PostgreSQL' : 'SQLite محلي') + ')');
})().catch((err) => {
  console.error('⚠️ فشل تهيئة قاعدة البيانات:', err.message);
});

module.exports = { query, get, run, close, dbReady };