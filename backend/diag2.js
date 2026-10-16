// مسبار المرحلة 2: يعزل كل سطر في database.js على حدة (bcrypt؟ fs؟ Database؟ pragma؟ seed؟)
console.log('DIAG2-START node=' + process.version + ' ' + process.arch + ' ' + process.platform);

function probe(name, loader) {
  try {
    console.log('DIAG2-TRY ' + name);
    loader();
    console.log('DIAG2-OK ' + name);
  } catch (err) {
    console.log('DIAG2-FAIL ' + name + ' :: ' + (err && err.message));
  }
}

probe('bcryptjs-require', () => require('bcryptjs'));
probe('bcryptjs-hash', () => {
  const bcrypt = require('bcryptjs');
  const h = bcrypt.hashSync('test-password', 10);
  console.log('DIAG2-HASH-LEN ' + h.length);
});
probe('fs-mkdir', () => {
  const fs = require('fs');
  const path = require('path');
  const p = process.env.DATABASE_PATH || '/data/realEstate.db';
  console.log('DIAG2-DBPATH ' + p);
  const d = path.dirname(p);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  console.log('DIAG2-DIR-OK');
});
probe('db-new-only', () => {
  const path = require('path');
  const Database = require('better-sqlite3');
  const p = process.env.DATABASE_PATH || '/data/realEstate.db';
  const db = new Database(p);
  console.log('DIAG2-OPEN-OK');
  db.close();
});
probe('db-full-file', () => require('./db/database'));

console.log('DIAG2-DONE');
process.exit(0);
