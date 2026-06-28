import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
const sa = JSON.parse(fs.readFileSync('scripts/firebase-admin-key.json'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const TITULOS = ['TikTok','Academia','Luka Modrić','ciberseguridad','cabras','agentes élite','Déficit de lluvias','Taylor Swift'];

(async () => {
  const snap = await db.collection('noticias').get();
  console.log('═══════════════════════════════════════════════════════');
  console.log('DIAGNÓSTICO DE NIVEL (por qué da PLATA y no ORO)');
  console.log('═══════════════════════════════════════════════════════\n');
  snap.forEach(d => {
    const data = d.data();
    const tit = data.titulo || '';
    if (!TITULOS.some(k => tit.includes(k))) return;
    const resumen = data.resumen || '';
    const tieneImg = !!(data.imagen || data.imagenDestacada);
    const tLen = tit.length;
    const rLen = resumen.length;
    const problemas = [];
    // SEO
    if (tLen < 50 || tLen > 60) problemas.push(`SEO: título ${tLen} chars (necesita 50-60)`);
    if (rLen < 150 || rLen > 170) problemas.push(`SEO: meta descripción ${rLen} chars (necesita 150-170)`);
    // Discover
    if (!tieneImg) problemas.push('DISCOVER: sin imagen destacada (>=1200px)');

    console.log(`▶ ${tit.substring(0,52)}`);
    console.log(`   Título: ${tLen} chars | Meta(resumen): ${rLen} chars | Imagen: ${tieneImg ? 'sí' : 'NO'}`);
    if (problemas.length) {
      console.log(`   ⚠️ LO QUE TE BAJA A PLATA:`);
      problemas.forEach(p => console.log(`      • ${p}`));
    } else {
      console.log(`   ✅ Metadata OK para ORO`);
    }
    console.log('');
  });
})().then(()=>process.exit(0));
