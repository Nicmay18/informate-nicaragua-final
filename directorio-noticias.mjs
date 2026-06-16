/**
 * directorio-noticias.mjs
 * Exporta todas las noticias de Firestore a un JSON ordenado por categoría.
 * Uso: node directorio-noticias.mjs
 * Buscar: Ctrl+F en directorio-noticias.json
 */
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import fs from 'fs';

config({ path: './.env.local' });

function initDb() {
  if (getApps().length > 0) return getFirestore(getApp());
  const pk = process.env.FIREBASE_PRIVATE_KEY.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: pk }) });
  return getFirestore();
}

const db = initDb();

async function main() {
  const snap = await db.collection('noticias').get();
  const noticias = [];

  snap.forEach(d => {
    const data = d.data();
    const txt = (data.contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const palabras = txt.split(/\s+/).filter(Boolean).length;
    noticias.push({
      id: d.id,
      titulo: data.titulo || '(sin título)',
      categoria: data.categoria || '(sin categoría)',
      nivel: data.nivel || 'SIN NIVEL',
      autor: data.autor || '',
      fecha: data.fecha || '',
      palabras,
    });
  });

  // Ordenar por categoría, luego título
  noticias.sort((a, b) => {
    if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria);
    return a.titulo.localeCompare(b.titulo);
  });

  // Agrupar por categoría para impresión
  const porCat = {};
  for (const n of noticias) {
    porCat[n.categoria] = porCat[n.categoria] || [];
    porCat[n.categoria].push(n);
  }

  // Imprimir resumen en consola
  console.log(`\n📋 DIRECTORIO DE NOTICIAS — Total: ${noticias.length}\n`);
  for (const cat of Object.keys(porCat).sort()) {
    console.log(`\n【${cat}】 — ${porCat[cat].length} noticia(s)`);
    for (const n of porCat[cat]) {
      console.log(`  ${n.nivel} | ${n.palabras}p | ${n.id} | ${n.titulo.slice(0, 70)}`);
    }
  }

  // Guardar JSON completo para búsqueda
  fs.writeFileSync('directorio-noticias.json', JSON.stringify(noticias, null, 2));
  console.log(`\n💾 Guardado: directorio-noticias.json (${noticias.length} noticias)`);

  // Guardar CSV para Excel
  const csv = ['Categoria,Nivel,Palabras,Titulo,ID'].concat(
    noticias.map(n => `"${n.categoria}","${n.nivel}",${n.palabras},"${n.titulo.replace(/"/g, "'")}","${n.id}"`)
  ).join('\n');
  fs.writeFileSync('directorio-noticias.csv', csv);
  console.log(`💾 Guardado: directorio-noticias.csv (abrir con Excel)`);

  process.exit(0);
}

main().catch(console.error);
