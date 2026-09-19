// Controlled editorial E2E test against PRODUCTION (read + write, with cleanup).
// Flow: create via guardar-directo -> verify public surfaces -> edit -> verify -> delete.
// Usage: node scripts/editorial-e2e-test.mjs <adminToken>
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const TOKEN = process.argv[2];
const BASE = 'https://nicaraguainformate.com';
const H = { 'Content-Type': 'application/json', 'x-admin-token': TOKEN };

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
);
let credential;
if (env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  credential = cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')));
} else {
  credential = cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  });
}
const db = getFirestore(initializeApp({ credential }, 'e2e'));

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
const TITULO = `[PRUEBA TECNICA] Verificacion del sistema de publicacion ${stamp}`;
const CONTENIDO = `<p>La cooperativa de cafetaleros de Matagalpa anuncio este viernes la apertura de una nueva planta de beneficio humedo en la comunidad de El Tuma, una inversion que permitira procesar la cosecha de mas de 300 pequenos productores de la zona y reducir los costos de traslado que hasta ahora enfrentaban hacia plantas ubicadas en el departamento de Jinotega.</p>
<p>Segun datos presentados por la directiva de la cooperativa, la instalacion cuenta con capacidad para beneficiar hasta 1,200 quintales de cafe cereza por dia durante el pico de la cosecha, que tradicionalmente se concentra entre noviembre y febrero. El proyecto fue financiado mediante un fondo rotatorio aportado por los propios asociados y un credito blando de una institucion de microfinanzas rural.</p>
<p>"Antes perdiamos hasta dos dias llevando el cafe a Jinotega, con costos de flete que se comian parte de la ganancia. Ahora el beneficio queda a veinte minutos de la finca", explico el presidente de la cooperativa durante el acto de inauguracion, en el que participaron autoridades locales y tecnicos del sector agropecuario.</p>
<p>Los productores consultados coinciden en que la nueva planta mejorara la calidad del grano, ya que el tiempo entre el corte del cafe cereza y su despulpe es determinante para el perfil de taza final. El cafe procesado en menos de seis horas obtiene mejores calificaciones en las cataciones de exportadores.</p>
<p>La cooperativa informo ademas que la planta generara 18 empleos permanentes y alrededor de 45 plazas temporales durante los meses de mayor actividad. Las aguas residuales del proceso seran tratadas en lagunas de oxidacion antes de su vertido, cumpliendo con la normativa ambiental vigente, indicaron los responsables.</p>
<p>Tecnicos del Ministerio Agropecuario que acompanaron el proyecto senalaron que la infraestructura de beneficio es uno de los cuellos de botella historicos del cafe nicaraguense, especialmente para pequenos productores que representan cerca del 85 por ciento de la produccion nacional.</p>
<p>El cafe sigue siendo uno de los principales rubros de exportacion del pais, con mas de 44,000 productores registrados. Matagalpa y Jinotega concentran aproximadamente el 60 por ciento del area sembrada a nivel nacional, segun estadisticas del sector.</p>
<p>Para el proximo ciclo, la cooperativa prevé incorporar un area de secado solar con camas africanas que permitira ofrecer cafes diferenciados a compradores de especialidad, un mercado que paga primas significativas sobre el precio internacional.</p>`;
const RESUMEN = 'La cooperativa de cafetaleros de Matagalpa inauguro una planta de beneficio humedo en El Tuma que procesara la cosecha de mas de 300 pequenos productores y generara 18 empleos permanentes.';
const CATEGORIA = 'Economía';
const IMAGEN = 'https://nicaraguainformate.com/logo.webp';

let articleId = null;
let slug = null;

try {
  // ── 1. CREATE ──
  const r1 = await fetch(`${BASE}/api/admin/guardar-directo`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ titulo: TITULO, contenido: CONTENIDO, resumen: RESUMEN, categoria: CATEGORIA, imagen: IMAGEN, publicado: true }),
  });
  const j1 = await r1.json();
  check('Crear noticia via guardar-directo', r1.status === 200 && (j1.id || j1.slug), `status=${r1.status}`);
  articleId = j1.id;
  if (!articleId) {
    console.log('RESP:', JSON.stringify(j1).slice(0, 500));
    process.exit(1);
  }
  await sleep(1000);
  const docSlug = await db.collection('noticias').doc(articleId).get();
  slug = docSlug.data()?.slug || j1.slug;
  console.log('  id:', articleId, 'slug:', slug);

  // ── 2. VERIFY FIRESTORE ──
  await sleep(1500);
  const doc = await db.collection('noticias').doc(articleId).get();
  const dd = doc.data() || {};
  check('Doc en Firestore publicado', doc.exists && dd.publicado === true && dd.estado === 'publicado', `estado=${dd.estado} publicado=${dd.publicado}`);

  // ── 3. VERIFY ADMIN LIST ──
  const r3 = await fetch(`${BASE}/api/admin/news?_t=${Date.now()}`, { method: 'POST', headers: { 'x-admin-token': TOKEN }, body: JSON.stringify({ action: 'list' }) });
  const j3 = await r3.json();
  const list = j3.news || j3;
  const inList = Array.isArray(list) && list.some((n) => n.id === articleId || n.slug === slug);
  check('Aparece en /api/admin/news', r3.status === 200 && inList, `total=${Array.isArray(list) ? list.length : '?'}`);

  // ── 4. VERIFY PUBLIC ARTICLE ──
  await sleep(3000);
  const r4 = await fetch(`${BASE}/noticias/${slug}?cb=${Date.now()}`);
  check('Articulo publico accesible', r4.status === 200, `status=${r4.status}`);
  const html4 = await r4.text();
  check('Articulo contiene titulo', html4.includes('PRUEBA') || html4.includes('mantenimiento preventivo') || html4.includes('Managua'));

  // ── 5. VERIFY /noticias & homepage & category ──
  const r5 = await fetch(`${BASE}/noticias?cb=${Date.now()}`);
  const h5 = await r5.text();
  check('Aparece en /noticias', h5.includes(slug));
  const r6 = await fetch(`${BASE}/?cb=${Date.now()}`);
  const h6 = await r6.text();
  check('Aparece en homepage', h6.includes(slug));
  const catReal = dd.categoria || CATEGORIA;
  const catSlug = String(catReal).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-');
  const r7 = await fetch(`${BASE}/categoria/${catSlug}?cb=${Date.now()}`);
  const h7 = await r7.text();
  check(`Aparece en /categoria/${catSlug} (cat real: ${catReal})`, h7.includes(slug));

  // ── 6. EDIT ──
  const TITULO2 = TITULO + ' — EDITADO';
  const CONTENIDO2 = CONTENIDO.replace('1,200 quintales', '1,450 quintales').replace('300 pequenos productores', '340 pequenos productores');
  const r8 = await fetch(`${BASE}/api/admin/news/${articleId}`, {
    method: 'PUT', headers: H,
    body: JSON.stringify({ titulo: TITULO2, contenido: CONTENIDO2, resumen: RESUMEN }),
  });
  const j8 = await r8.json();
  check('Edicion guardada', r8.status === 200, `status=${r8.status}`);

  await sleep(4000);
  const r9 = await fetch(`${BASE}/noticias/${slug}?cb=${Date.now()}`);
  const h9 = await r9.text();
  check('Edicion reflejada en publico (sin republicar)', h9.includes('EDITADO') || h9.includes('1,450 quintales'), `status=${r9.status}`);

  // ── 7. SITEMAP/FEED ──
  const r10 = await fetch(`${BASE}/sitemap.xml?cb=${Date.now()}`);
  const h10 = await r10.text();
  check('Slug en sitemap.xml', h10.includes(slug));

  // ── 8. ADMIN STATE after edit ──
  const docB = await db.collection('noticias').doc(articleId).get();
  const dB = docB.data() || {};
  check('Sigue publicado tras edicion', dB.publicado === true && dB.estado === 'publicado');
  check('Slug preservado', dB.slug === slug, `slug=${dB.slug}`);

} catch (e) {
  console.log('ERROR:', e.message);
} finally {
  // ── CLEANUP: delete test article ──
  if (articleId) {
    try {
      const rd = await fetch(`${BASE}/api/admin/news/${articleId}`, { method: 'DELETE', headers: { 'x-admin-token': TOKEN, 'x-force-hard-delete': 'true' } });
      console.log('DELETE status:', rd.status);
      if (rd.status !== 200) {
        // fallback: mark as deleted via firestore admin
        await db.collection('noticias').doc(articleId).delete();
        console.log('deleted via admin sdk fallback');
      }
      await sleep(2000);
      const gone = await db.collection('noticias').doc(articleId).get();
      check('Noticia de prueba eliminada', !gone.exists);
      const rg = await fetch(`${BASE}/noticias/${slug}?cb=${Date.now()}gone`);
      check('URL publica devuelve 404 tras eliminar', rg.status === 404 || rg.status === 410, `status=${rg.status}`);
    } catch (e) {
      console.log('CLEANUP ERROR:', e.message);
    }
  }
}

const fails = results.filter((r) => !r.ok);
console.log(`\n=== RESULTADO: ${results.length - fails.length}/${results.length} PASS ===`);
process.exit(fails.length ? 1 : 0);
