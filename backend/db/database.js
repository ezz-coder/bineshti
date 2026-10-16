const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

async function get(text, params) {
  const rows = await query(text, params);
  return rows[0] || null;
}

async function run(text, params) {
  const result = await pool.query(text, params);
  return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id ?? 0 };
}

async function close() { await pool.end(); }

async function initializeTables() {
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

async function seedInitialData() {
  const settingsCount = await get('SELECT COUNT(*) AS count FROM settings');
  if (settingsCount.count === 0) {
    await query(
      `INSERT INTO settings (contactPhone, companyName, aboutText, updatedAt)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [process.env.CONTACT_PHONE || '', process.env.COMPANY_NAME || 'بي نيشتي للاستثمار العقاري', 'شركة بي نيشتي للاستثمار العقاري - نقدم أفضل العقارات للبيع والإيجار.']
    );
  }
  const adminCount = await get('SELECT COUNT(*) AS count FROM admin');
  if (adminCount.count === 0) {
    const plainPassword = process.env.ADMIN_PASSWORD || 'Bn@2026!Secure#';
    const hashedPassword = bcrypt.hashSync(plainPassword, 10);
    await query(
      `INSERT INTO admin (username, password, createdAt) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      ['benishaty', hashedPassword]
    );
  }
}

const dbReady = initializeTables()
  .then(() => seedInitialData())
  .catch((err) => {
    console.error('⚠️ فشل تهيئة قاعدة البيانات:', err.message);
  });

module.exports = { query, get, run, close, dbReady };