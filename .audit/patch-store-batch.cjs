const fs = require('fs');
const f = 'lib/nios/intelligence/store.ts';
let t = fs.readFileSync(f, 'utf8');

const oldBlock = `  // Guardar articles en subcolección (siempre, para habilitar fallback)
  if (articles.length > 0) {
    const articlesBatch = db.batch();
    for (const article of articles) {
      const slug = article.slug || Math.random().toString(36).slice(2);
      const articleRef = docRef.collection(ARTICLES_SUBCOLLECTION).doc(slug);
      articlesBatch.set(articleRef, removeUndefined(article));
    }
    await articlesBatch.commit();
    logger.info(\`[nios-store] Saved \${articles.length} articles to subcollection for \${date}\`);
  }`;

const newBlock = `  // Guardar articles en subcolección (siempre, para habilitar fallback).
  // Firestore batch tiene límite de 500 operaciones — con >500 artículos
  // un único batch revienta el commit. Se divide en chunks secuenciales.
  if (articles.length > 0) {
    const BATCH_CHUNK = 450;
    for (let start = 0; start < articles.length; start += BATCH_CHUNK) {
      const chunk = articles.slice(start, start + BATCH_CHUNK);
      const articlesBatch = db.batch();
      for (const article of chunk) {
        const slug = article.slug || Math.random().toString(36).slice(2);
        const articleRef = docRef.collection(ARTICLES_SUBCOLLECTION).doc(slug);
        articlesBatch.set(articleRef, removeUndefined(article));
      }
      await articlesBatch.commit();
    }
    logger.info(\`[nios-store] Saved \${articles.length} articles to subcollection for \${date}\`);
  }`;

const oldCrlf = oldBlock.replace(/\n/g, '\r\n');
if (t.includes(oldBlock)) t = t.replace(oldBlock, newBlock);
else if (t.includes(oldCrlf)) t = t.replace(oldCrlf, newBlock.replace(/\n/g, '\r\n'));
else { console.log('anchor not found'); process.exit(1); }

fs.writeFileSync(f, t);
console.log('store.ts batch chunking OK');
