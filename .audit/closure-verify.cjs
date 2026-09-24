/**
 * NIOS — verificación de cierre. Solo lectura.
 * 1) noticias: total, publicadas, duplicados de slug, estados
 * 2) editorial_review_queue: total, por estado, doc contradicion_factual
 * 3) residuos de las 73 correcciones mecánicas conocidas
 */
const admin = require('firebase-admin');
const path = require('path');
const sa = require(path.resolve('../informate-instant-nicaragua-firebase-adminsdk-fbsvc-fa9b81a61a.json'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const CORRUPTIONS = [
  /motocicletaciclet\w*/i,
  /personas personas/i,
  /testigo ocular manifest/i,
  /vecino que presenci/i,
  /declaraci[oó]n de residente local/i,
  /mar[ií]a l[oó]pez,?\s+vecina/i,
  /\b(el|del) afectaci[oó]n\b/i,
  /afectado afectada/i,
  /href=""/i,
];

(async () => {
  const out = {};

  // ── 1) noticias ──
  const snap = await db.collection('noticias').get();
  const estados = {};
  const slugs = new Map();
  const dupSlugs = [];
  let residuos = [];
  for (const d of snap.docs) {
    const x = d.data();
    estados[x.estado || '(sin)'] = (estados[x.estado || '(sin)'] || 0) + 1;
    if (x.slug) {
      if (slugs.has(x.slug)) dupSlugs.push(x.slug);
      slugs.set(x.slug, d.id);
    }
    const t = `${x.titulo || ''} ${x.resumen || ''} ${x.contenido || ''}`;
    for (const re of CORRUPTIONS) {
      if (re.test(t)) {
        residuos.push({ id: d.id, slug: x.slug, patron: re.source.slice(0, 40) });
        break;
      }
    }
  }
  out.noticias = { total: snap.size, estados, dupSlugs: dupSlugs.length ? dupSlugs : 0, residuos };

  // ── 2) editorial_review_queue ──
  try {
    const q = await db.collection('editorial_review_queue').get();
    const porEstado = {};
    let contradiccion = null;
    for (const d of q.docs) {
      const x = d.data();
      const st = x.estado || x.status || '(sin)';
      porEstado[st] = (porEstado[st] || 0) + 1;
      if (/contradiccion/i.test(d.id) || /contradiccion/i.test(x.tipo || x.type || '')) {
        contradiccion = { id: d.id, estado: st, tipo: x.tipo || x.type };
      }
    }
    out.reviewQueue = { total: q.size, porEstado, contradiccion };
  } catch (e) { out.reviewQueue = { error: e.message }; }

  console.log(JSON.stringify(out, null, 1));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
