/**
 * طبقة توافق better-sqlite3 فوق node:sqlite المدمجة (بدون ثنائيات أصلية — مستحيل segfault).
 * نفس الواجهة المتزامنة: prepare().get/run/all + exec + pragma.
 * الفروق المُعالجة: run ترجع {lastInsertRowid: BigInt→Number, changes}، وget/all ترجع كائنات عادية.
 */
const { DatabaseSync } = require('node:sqlite');

function normalizeRow(row) {
  if (row === null || row === undefined) return row;
  if (Array.isArray(row)) return row.map(normalizeRow);
  if (typeof row === 'object') {
    const out = {};
    for (const key of Object.keys(row)) {
      const v = row[key];
      out[key] = typeof v === 'bigint' ? Number(v) : v;
    }
    return out;
  }
  return row;
}

class CompatStatement {
  constructor(stmt) {
    this.stmt = stmt;
  }
  get(...params) {
    return normalizeRow(this.stmt.get(...params)) ?? undefined;
  }
  all(...params) {
    return normalizeRow(this.stmt.all(...params)) ?? [];
  }
  run(...params) {
    // node:sqlite لا تقبل undefined كمعامل — حولها إلى null
    const cleanParams = params.map((p) => p === undefined ? null : p);
    const info = this.stmt.run(...cleanParams);
    return {
      changes: Number(info.changes ?? 0),
      lastInsertRowid: Number(info.lastInsertRowid ?? 0),
    };
  }
}

class CompatDatabase {
  constructor(filePath) {
    this.db = new DatabaseSync(filePath);
  }
  prepare(sql) {
    return new CompatStatement(this.db.prepare(sql));
  }
  exec(sql) {
    return this.db.exec(sql);
  }
  pragma(source, options) {
    // better-sqlite3: db.pragma('journal_mode = WAL') أو db.pragma('table_info(x)')
    // node:sqlite لا تملك pragma() — ننفذها كـ PRAGMA SQL مباشرة
    const text = String(source).trim().replace(/;$/, '');
    const rows = this.db.prepare(`PRAGMA ${text}`).all();
    return normalizeRow(rows);
  }
  close() {
    this.db.close();
  }
}

module.exports = { Database: CompatDatabase };
