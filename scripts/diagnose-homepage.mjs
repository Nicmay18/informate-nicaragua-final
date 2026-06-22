/**
 * DIAGNÓSTICO DE HOMEPAGE
 * Lee las noticias publicadas de Firestore y muestra:
 * - Total de publicadas
 * - Top más leídas (all-time)
 * - Top populares (últimos 7 días)
 * - Noticias más recientes (tendencias)
 *
 * Uso: node scripts/diagnose-homepage.mjs
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Inicializar Firebase Admin
const keyPath = join(__dirname, 'firebase-admin-key.json');
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function diagnose() {
  console.log('🔍 Leyendo noticias de Firestore...\n');

  const snap = await db
    .collection('noticias')
    .orderBy('fecha', 'desc')
    .limit(500)
    .get();

  let noticias = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      slug: data.slug || d.id,
      titulo: data.titulo || '(Sin título)',
      categoria: data.categoria || 'General',
      estado: data.estado || null,
      fecha: data.fecha?.toDate?.() ? data.fecha.toDate().toISOString() : String(data.fecha),
      vistas: data.vistas || 0,
    };
  });

  // Filtrar solo publicadas
  const publicadas = noticias.filter(n => n.estado === 'publicado' || !n.estado);
  console.log(`📊 Total de noticias leídas: ${noticias.length}`);
  console.log(`✅ Noticias publicadas: ${publicadas.length}`);
  console.log(`🚫 Noticias en borrador: ${noticias.length - publicadas.length}\n`);

  // ─── TOP MÁS LEÍDAS (all-time) ───
  const masLeidas = [...publicadas]
    .filter(n => n.vistas >= 1)
    .sort((a, b) => b.vistas - a.vistas)
    .slice(0, 10);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 TOP 10 MÁS LEÍDAS (all-time)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (masLeidas.length === 0) {
    console.log('⚠️  Ninguna noticia tiene vistas registradas.');
  } else {
    masLeidas.forEach((n, i) => {
      const fecha = new Date(n.fecha).toLocaleDateString('es-NI');
      console.log(`${String(i + 1).padStart(2)}. ${n.titulo.substring(0, 70)}`);
      console.log(`    ${n.categoria} • ${n.vistas} vistas • ${fecha}`);
      console.log(`    /noticias/${n.slug}`);
    });
  }

  // ─── TOP POPULARES (últimos 7 días) ───
  const cutoff7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const populares = [...publicadas]
    .filter(n => {
      const fechaMs = new Date(n.fecha).getTime();
      return fechaMs >= cutoff7.getTime() && n.vistas >= 1;
    })
    .sort((a, b) => b.vistas - a.vistas)
    .slice(0, 10);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔥 TOP 10 POPULARES (últimos 7 días)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (populares.length === 0) {
    console.log('⚠️  Ninguna noticia de los últimos 7 días tiene vistas.');
  } else {
    populares.forEach((n, i) => {
      const fecha = new Date(n.fecha).toLocaleDateString('es-NI');
      console.log(`${String(i + 1).padStart(2)}. ${n.titulo.substring(0, 70)}`);
      console.log(`    ${n.categoria} • ${n.vistas} vistas • ${fecha}`);
    });
  }

  // ─── TENDENCIAS (más recientes) ───
  const tendencias = publicadas.slice(0, 10);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⏰ TENDENCIAS (10 noticias más recientes)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  tendencias.forEach((n, i) => {
    const fecha = new Date(n.fecha).toLocaleDateString('es-NI');
    const hora = new Date(n.fecha).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
    const estadoStr = n.estado === 'publicado' ? '✅' : '⏳';
    console.log(`${String(i + 1).padStart(2)}. ${estadoStr} ${n.titulo.substring(0, 70)}`);
    console.log(`    ${n.categoria} • ${n.vistas} vistas • ${fecha} ${hora}`);
    console.log(`    /noticias/${n.slug}`);
  });

  // ─── RESUMEN DE VISTAS ───
  const conVistas = publicadas.filter(n => n.vistas >= 1).length;
  const sinVistas = publicadas.filter(n => n.vistas === 0).length;
  const totalVistas = publicadas.reduce((sum, n) => sum + n.vistas, 0);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 RESUMEN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Noticias publicadas:     ${publicadas.length}`);
  console.log(`Con vistas (≥1):         ${conVistas}`);
  console.log(`Sin vistas (0):          ${sinVistas}`);
  console.log(`Total de vistas:         ${totalVistas}`);
  console.log(`Promedio vistas/noticia: ${(totalVistas / publicadas.length).toFixed(1)}`);

  process.exit(0);
}

diagnose().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
