// repair-enlaces-404.mjs — LOTE D: enlaces muertos embebidos en "Te puede interesar"
// - SIN DESTINO (404 real): elimina el <li> entero (recomendación rota).
// - REDIRECCIÓN confirmada: reescribe href al slug actual y el texto al título vigente.
// Backup + fingerprint + post-lectura. SIMULACIÓN por defecto. --apply autorizado.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))) });
const db = getFirestore();

const { dead, redir } = JSON.parse(readFileSync('.audit/link-map.json', 'utf8'));
const deadSet = new Set(dead);
const redirMap = new Map(redir.map(r => [r.viejo, r.nuevo]));

// Sucesores confirmados: mismo artículo re-slugeado (enlace truncado o renombrado).
// larreynaga NO está aquí: su único candidato es un artículo semánticamente distinto.
const SUSTITUTOS = new Map(Object.entries({
  'primeros-bebes-del-dia-de-las-madres-nacen-en-': 'primeros-bebes-del-dia-de-las-madres-nacen-en-managua-y-rivas',
  'primeros-bebes-del-dia-de-las-': 'primeros-bebes-del-dia-de-las-madres-nacen-en-managua-y-rivas',
  'como-anular-el-record-policial-en-': 'como-anular-el-record-policial-en-nicaragua-en-2026',
  'como-anular-el-record-': 'como-anular-el-record-policial-en-nicaragua-en-2026',
  'accidentes-viales-dejan-seis-afectados-en-managua-y-caribe-norte-mplrwih2': 'accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte',
  'accidentes-viales-dejan-seis-afectados-en-managua-y-': 'accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte',
  'toy-story-5-llegara-a-': 'toy-story-5-llegara-a-nicaragua-con-woody-y-buzz-en-la-era-digital',
}));
for (const [k, v] of SUSTITUTOS) { deadSet.delete(k); redirMap.set(k, v); }

const sha = s => createHash('sha256').update(String(s)).digest('hex');
const shaDoc = d => sha([d.titulo, d.resumen, d.contenido].join(''));
const LI_RE = /<li>[\s\S]*?<\/li>/g;
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const containsSlug = (li, slug) => li.includes(`/noticias/${slug}`) || li.includes(slug);

async function main() {
  // Títulos actuales de destinos válidos para reescritura de texto de enlace
  const titulos = new Map();
  for (const [, nuevo] of redirMap) {
    const s = await db.collection('noticias').where('slug', '==', nuevo).limit(1).get();
    if (!s.empty) titulos.set(nuevo, s.docs[0].data().titulo);
  }

  const snap = await db.collection('noticias').where('estado', '==', 'publicado').get();
  const resultados = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    const cont = String(d.contenido || '');
    const lis = cont.match(LI_RE) || [];
    const tocados = lis.filter(li => [...deadSet].some(s => containsSlug(li, s)) || [...redirMap.keys()].some(s => containsSlug(li, s)));
    if (!tocados.length) continue;

    const base = { id: doc.id, slug: d.slug, shaAntes: shaDoc(d), contenidoOriginal: cont, lisEliminados: 0, lisReescritos: 0, reparacionForense: d.reparacionForense || null };
    if (d.reparacionForense?.enlaces404?.aplicado) { resultados.push({ ...base, estado: 'OMITIDO', razon: 'ya procesado' }); continue; }

    let nuevo = cont;
    for (const li of tocados) {
      const slug = [...deadSet].find(s => containsSlug(li, s)) || [...redirMap.keys()].find(s => containsSlug(li, s));
      if (deadSet.has(slug)) {
        nuevo = nuevo.split(li).join('');
        base.lisEliminados++;
      } else {
        const destino = redirMap.get(slug);
        const titulo = titulos.get(destino);
        if (!titulo) continue;
        const texto = li.match(/<a[^>]*>([\s\S]*?)<\/a>/)?.[1]
          || li.replace(/<\/?li>/g, '').replace(/^[^>]*">/, '').trim();
        const reescrito = `<li><a href="/noticias/${destino}">${titulo}</a></li>`;
        nuevo = nuevo.split(li).join(reescrito);
        base.lisReescritos++;
      }
    }

    // Verificación por límite de segmento: el slug viejo no puede aparecer como
    // referencia de enlace exacta (un slug truncado puede ser PREFIJO de su
    // sucesor — exige delimitador real, no substring).
    const slugRef = s => new RegExp(`/noticias/${escapeRe(s)}(?=["'\\s</]|$)`);
    const residuo = [...deadSet].some(s => slugRef(s).test(nuevo));
    if (residuo) { resultados.push({ ...base, estado: 'ABORTADO', razon: 'referencia residual tras edición' }); continue; }
    const malSust = [...SUSTITUTOS.keys()].some(s => slugRef(s).test(nuevo));
    if (malSust) { resultados.push({ ...base, estado: 'ABORTADO', razon: 'href sucesor mal reescrito' }); continue; }

    if (APPLY) {
      await doc.ref.update({
        contenido: nuevo,
        'reparacionForense.enlaces404': { aplicado: true, fecha: new Date().toISOString(), regla: 'lote-d-enlaces', lisEliminados: base.lisEliminados, lisReescritos: base.lisReescritos },
        requiresReevaluation: true,
      });
      const post = (await doc.ref.get()).data();
      base.shaDespues = shaDoc(post);
      base.estado = post.contenido === nuevo ? 'APLICADO+VERIFICADO' : 'ERROR-POSTLECTURA';
    } else {
      base.estado = 'APLICABLE';
      base.shaDespues = shaDoc({ ...d, contenido: nuevo });
    }
    resultados.push(base);
  }

  const resumen = {};
  for (const r of resultados) resumen[r.estado] = (resumen[r.estado] || 0) + 1;
  console.log(JSON.stringify(resumen));
  for (const r of resultados) console.log(`${r.estado.padEnd(20)} ${r.slug} | -${r.lisEliminados} li, ~${r.lisReescritos} li${r.razon ? ' — ' + r.razon : ''}`);
  mkdirSync('.audit', { recursive: true });
  writeFileSync(APPLY ? '.audit/repair-enlaces-404-backup.json' : '.audit/repair-enlaces-404-simulacion.json',
    JSON.stringify({ fecha: new Date().toISOString(), aplicar: APPLY, resumen, docs: resultados.length, resultados }, null, 2));
  console.log(`\nLog: .audit/repair-enlaces-404-${APPLY ? 'backup' : 'simulacion'}.json`);
  process.exit(0);
}
main();
