const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// مسار ملف قاعدة البيانات من متغيرات البيئة
const DB_PATH = process.env.DATABASE_PATH || './db/realEstate.db';

// التأكد من وجود مجلد قاعدة البيانات
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// إنشاء/فتح الاتصال بقاعدة البيانات
const db = new Database(DB_PATH);

// تحسين الأداء والموثوقية
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * إنشاء جميع الجداول إذا لم تكن موجودة
 */
function initializeTables() {
  // جدول الشقق
  db.exec(`
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

  // جدول الفلل
  db.exec(`
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

  // جدول الأراضي الفارغة
  db.exec(`
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

  // جدول إعدادات الموقع (صف واحد فقط)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contactPhone TEXT,
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
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // جدول المدير (كلمة المرور المشفرة)
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // فهارس لتسريع البحث والفلترة
  db.exec(`    CREATE INDEX IF NOT EXISTS idx_apartments_type ON apartments(type);
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
}

/**
 * إضافة عمود isHidden للجداول القديمة التي أُنشئت قبل إضافته (ترقية تدريجية آمنة).
 * يتجاهل الجداول التي تحتوي العمود مسبقاً.
 */
function migrateAddHiddenColumn() {
  const tables = ['apartments', 'villas', 'lands'];
  tables.forEach((table) => {
    const columns = db.pragma(`table_info(${table})`);
    const hasHidden = columns.some((col) => col.name === 'isHidden');
    if (!hasHidden) {
      db.exec(
        `ALTER TABLE ${table} ADD COLUMN isHidden INTEGER NOT NULL DEFAULT 0`
      );
    }
  });
}

/**
 * تهيئة البيانات الافتراضية:
 * - صف الإعدادات إن لم يوجد
 * - كلمة مرور المدير مشفرة بـ bcrypt إن لم توجد
 */
function seedInitialData() {
  // إعدادات الموقع
  const settingsCount = db.prepare('SELECT COUNT(*) AS count FROM settings').get();
  if (settingsCount.count === 0) {
    db.prepare(
      `INSERT INTO settings (contactPhone, companyName, aboutText, updatedAt)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
    ).run(
      process.env.CONTACT_PHONE || '',
      process.env.COMPANY_NAME || 'بي نيشتي للاستثمار العقاري',
      'شركة بي نيشتي للاستثمار العقاري - نقدم أفضل العقارات للبيع والإيجار.'
    );
  }

  // كلمة مرور المدير
  const adminCount = db.prepare('SELECT COUNT(*) AS count FROM admin').get();
  if (adminCount.count === 0) {
    const plainPassword = process.env.ADMIN_PASSWORD || 'Bn@2026!Secure#';
    const hashedPassword = bcrypt.hashSync(plainPassword, 10);
    db.prepare(
      `INSERT INTO admin (username, password, createdAt) VALUES (?, ?, CURRENT_TIMESTAMP)`
    ).run('benishaty', hashedPassword);
  }
}

/**
 * إضافة أعمدة الإعدادات الجديدة (logoUrl, facebookUrl) للجداول القديمة
 * التي أُنشئت قبل إضافتها (ترقية تدريجية آمنة). تتجاهل الجداول التي تحتوي الأعمدة مسبقاً.
 */
function migrateAddSettingsColumns() {
  const columns = db.pragma('table_info(settings)');
  const names = columns.map((col) => col.name);
  if (!names.includes('logoUrl')) {
    db.exec('ALTER TABLE settings ADD COLUMN logoUrl TEXT');
  }
  if (!names.includes('facebookUrl')) {
    db.exec('ALTER TABLE settings ADD COLUMN facebookUrl TEXT');
  }
  const aboutColumns = [
    'aboutTitle',
    'aboutSubtitle',
    'aboutSection1Title',
    'aboutSection1Content',
    'aboutSection2Title',
    'aboutSection2Content',
    'aboutSection3Title',
    'aboutSection3Content',
    'aboutImageUrl',
  ];
  aboutColumns.forEach((col) => {
    if (!names.includes(col)) {
      db.exec(`ALTER TABLE settings ADD COLUMN ${col} TEXT`);
    }
  });
  if (!names.includes('whatsappPhone')) {
    db.exec('ALTER TABLE settings ADD COLUMN whatsappPhone TEXT');
  }
  if (!names.includes('theme')) {
    db.exec("ALTER TABLE settings ADD COLUMN theme TEXT DEFAULT 'dark'");
  }
}

// تنفيذ التهيئة عند تحميل الملف
initializeTables();
migrateAddHiddenColumn();
migrateAddSettingsColumns();
seedInitialData();

module.exports = db;
