const fs = require('fs');

// 1) middleware.ts — añadir /api/indexnow y /api/nios a SENSITIVE_API_PATHS
const mf = 'middleware.ts';
let m = fs.readFileSync(mf, 'utf8');
const mAnchor = "  '/api/transform',\n  '/api/revalidate',\n];";
const mAnchorCrlf = mAnchor.replace(/\n/g, '\r\n');
if (m.includes(mAnchor)) {
  m = m.replace(mAnchor, "  '/api/transform',\n  '/api/revalidate',\n  '/api/indexnow',\n  '/api/nios',\n];");
} else if (m.includes(mAnchorCrlf)) {
  m = m.replace(mAnchorCrlf, "  '/api/transform',\r\n  '/api/revalidate',\r\n  '/api/indexnow',\r\n  '/api/nios',\r\n];");
} else { console.log('middleware anchor not found'); process.exit(1); }
fs.writeFileSync(mf, m);
console.log('middleware SENSITIVE_API_PATHS OK');

// 2) list-all — filtrar estado=='publicado'
const lf = 'app/api/list-all/route.ts';
let l = fs.readFileSync(lf, 'utf8');
const lAnchor = "    const db = getAdminDb();\n    let query: FirebaseFirestore.Query = db.collection('noticias').orderBy('fecha', 'desc');";
const lAnchorCrlf = lAnchor.replace(/\n/g, '\r\n');
const lNew = "    const db = getAdminDb();\n    // Solo publicadas — este endpoint es público (lo consume Header.tsx);\n    // sin el filtro exponía borradores y archivadas.\n    let query: FirebaseFirestore.Query = db.collection('noticias')\n      .where('estado', '==', 'publicado')\n      .orderBy('fecha', 'desc');";
if (l.includes(lAnchor)) {
  l = l.replace(lAnchor, lNew);
} else if (l.includes(lAnchorCrlf)) {
  l = l.replace(lAnchorCrlf, lNew.replace(/\n/g, '\r\n'));
} else { console.log('list-all anchor not found'); process.exit(1); }
fs.writeFileSync(lf, l);
console.log('list-all estado filter OK');
