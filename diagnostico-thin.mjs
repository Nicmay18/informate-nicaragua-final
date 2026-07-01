import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const cred = JSON.parse(readFileSync('G:/RESPALDO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json', 'utf8'));

initializeApp({ credential: cert(cred) });
const db = getFirestore();

const snap = await db.collection('noticias').limit(200).get();
const thin = [];

for (const doc of snap.docs) {
  const data = doc.data();
  const contenido = (data.contenido || '').replace(/<[^>]*>/g, ' ');
  const conteo = contenido.split(/\s+/).filter(p => p.length > 0).length;
  const campo = data.palabras;
  const palabras = (typeof campo === 'number' && campo > 0) ? campo : ((parseInt(campo, 10) || 0) > 0 ? parseInt(campo, 10) : conteo);

  if (palabras < 350) {
    thin.push({
      id: doc.id,
      titulo: data.titulo || '(sin título)',
      palabrasCampo: campo,
      palabrasConteo: conteo,
      palabrasUsadas: palabras,
      categoria: data.categoria || '',
    });
  }
}

console.log(`Total noticias analizadas: ${snap.docs.length}`);
console.log(`Thin content (<350 palabras): ${thin.length}\n`);

thin.forEach((t, i) => {
  console.log(`${i+1}. "${t.titulo}"`);
  console.log(`   Categoría: ${t.categoria}`);
  console.log(`   Campo palabras: ${t.palabrasCampo} (tipo: ${typeof t.palabrasCampo})`);
  console.log(`   Conteo contenido: ${t.palabrasConteo}`);
  console.log(`   Usado para validar: ${t.palabrasUsadas}`);
  console.log();
});
