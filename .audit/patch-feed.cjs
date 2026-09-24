const fs = require('fs');
const f = 'lib/feed-articles.ts';
let t = fs.readFileSync(f, 'utf8');

const anchor = "export async function fetchFeedArticles(limit = 50): Promise<FeedArticle[]> {\n  const snapshot = await adminDb.collection('noticias').get();";
const anchorCrlf = anchor.replace(/\n/g, '\r\n');
const rep = "export async function fetchFeedArticles(limit = 50): Promise<FeedArticle[]> {\n  // Acotado: filtra en Firestore y lee una ventana acotada — el orden\n  // canónico se sigue resolviendo en memoria por el tipo mixto de `fecha`.\n  const snapshot = await adminDb.collection('noticias')\n    .where('publicado', '==', true)\n    .where('estado', '==', 'publicado')\n    .limit(Math.max(limit * 4, 200))\n    .get();";

if (t.includes(anchor)) t = t.replace(anchor, rep);
else if (t.includes(anchorCrlf)) t = t.replace(anchorCrlf, rep.replace(/\n/g, '\r\n'));
else { console.log('anchor not found'); process.exit(1); }
fs.writeFileSync(f, t);
console.log('feed-articles bounded query OK');
