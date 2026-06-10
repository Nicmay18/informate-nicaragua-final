// Script to clean SEO/metadata/recabada blocks from all news documents in Firestore
// Run with `node clean-seo.js`

const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function cleanContent(content) {
  let cleaned = content;

  // 1. Remove blocks starting with ## Datos de Publicación (and everything after until next ## or end)
  cleaned = cleaned.replace(/##\s*Datos de Publicación[\s\S]*?(?=\n## |\n<h2|$)/gi, '');

  // 2. Remove blocks: <h2>Información Recabada</h2> followed by <ul>...</ul>
  cleaned = cleaned.replace(/<h2>\s*Información\s+Recabada\s*<\/h2>\s*<ul>[\s\S]*?<\/ul>/gi, '');

  // 3. Remove blocks: ## Información Recabada followed by list items
  cleaned = cleaned.replace(/##\s*Información\s+Recabada\s*\n(?:\*\s*.*\n)*/gi, '');

  // 4. Remove lines with Slug sugerido / Meta descripción
  cleaned = cleaned.split('\n').filter(line =>
    !/Slug sugerido:/i.test(line) &&
    !/Meta descripción:/i.test(line)
  ).join('\n');

  // 5. Clean up consecutive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

(async () => {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const db = getFirestore(app);
  const snap = await getDocs(collection(db, 'noticias'));
  let count = 0;
  let total = snap.docs.length;
  console.log(`Scanning ${total} articles...`);

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const content = data.contenido || '';
    const cleaned = cleanContent(content);

    if (cleaned !== content) {
      await updateDoc(doc(db, 'noticias', docSnap.id), { contenido: cleaned });
      count++;
      console.log(`✅ Cleaned: ${data.titulo?.substring(0, 60) || docSnap.id}`);
    }
  }

  console.log(`\n✅ Finished. Cleaned ${count} of ${total} articles.`);
  process.exit(0);
})();

