// سكربت تشخيص: يحدد أي require يسقط العملية (sharp أم better-sqlite3 أم غيرهما)
console.log('DIAG-START node=' + process.version + ' ' + process.arch + ' ' + process.platform);

function probe(name, loader) {
  try {
    console.log('DIAG-TRY ' + name);
    loader();
    console.log('DIAG-OK ' + name);
  } catch (err) {
    console.log('DIAG-FAIL ' + name + ' :: ' + (err && err.message));
  }
}

probe('dotenv', () => require('dotenv').config());
probe('express', () => require('express'));
probe('better-sqlite3', () => require('better-sqlite3'));
probe('sharp', () => require('sharp'));
probe('./db/database', () => require('./db/database'));
probe('./routes/apartments', () => require('./routes/apartments'));
probe('./routes/admin', () => require('./routes/admin'));

console.log('DIAG-DONE');
process.exit(0);
