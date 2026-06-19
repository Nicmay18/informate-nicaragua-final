#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try { const sa = JSON.parse(readFileSync(keyPath, 'utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) { const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); }
  const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

function limpiarContenido(html) {
  let t = html;
  if (!t) return '';

  // Fix fechas 2026
  t = t.replace(/\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+2026\b/gi, '$1 de $2 de 2025');
  t = t.replace(/\b(mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+2026\b/gi, '$1 de 2025');
  t = t.replace(/\b2026\b/g, '2025');

  // Eliminar secciones de basura IA por título
  const seccionesBasura = [
    'Regulación comercial y gestión de riesgos',
    'Regulación sanitaria y marco jurídico',
    'Regulación comercial y gestión',
    'Normativa laboral y prevención de riesgos',
    'Normativa de transporte acuático y estadísticas',
    'Normativa e indicadores de seguridad ocupacional',
    'Marco normativo e indicadores institucionales',
    'Indicadores de seguridad y recomendaciones técnicas',
    'Indicadores de turismo y seguridad marítima',
    'Indicadores de transporte marítimo y regulaciones',
    'Prevención y normativas de seguridad civil',
    'Análisis normativo e indicadores de seguridad',
    'Riesgos laborales y trámites consulares',
    'Gestión de riesgos',
    'Normativas',
    'Regulaciones',
    'Estadísticas',
    'Indicadores',
    'Marco jurídico',
    'Marco normativo',
    'Recomendaciones técnicas',
    'Recomendaciones',
    'Prevención de riesgos',
    'Seguridad ocupacional',
    'Seguridad civil',
    'Análisis normativo'
  ];

  seccionesBasura.forEach(s => {
    const r = new RegExp(`<h2>\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:</h2>|<h3>|<h4>)[\\s\\S]*?(?=<h2>|<p>Pie de Foto|$)`, 'gi');
    t = t.replace(r, '');
  });

  // También buscar patrones genéricos
  t = t.replace(/<h[234]>\s*(?:Regulaci[oó]n|Normativa|Estad[ií]sticas|Indicadores|Marco [Jj]ur[ií]dico|Marco [Nn]ormativo|Recomendaciones|Prevenci[oó]n|Seguridad [Oo]cupacional|Seguridad [Cc]ivil|An[aá]lisis [Nn]ormativo|Gesti[oó]n de [Rr]iesgos|Riesgos [Ll]aborales).*?<\/h[234]>[\s\S]*?(?=<h[234]>|<p>Pie de Foto|$)/gi, '');

  // Eliminar párrafos con basura
  const ps = t.match(/<p>(.*?)<\/p>/gi) || [];
  ps.forEach(p => {
    const pt = p.replace(/<[^>]*>/g, '').toLowerCase();
    // Eliminar párrafos con leyes genéricas, multas, sanciones, obligatoriedad
    if (/ley\s+\d{3}.*establece|ley\s+\d{3}.*art[ií]culo|obligatoriedad|sanciones|multas|facultan.*suspender|licencias de funcionamiento|clausura/i.test(pt) && pt.length > 50) {
      t = t.replace(p, '');
    }
    // Eliminar párrafos con estadísticas genéricas
    if (/(estad[ií]sticas|an[aá]lisis|registros|balances|indicadores).*\d+\s+(?:incidentes|naufragios|excursionistas|por ciento|accidentes|personas)/i.test(pt) && pt.length > 60) {
      t = t.replace(p, '');
    }
    // Eliminar párrafos con llamados genéricos
    if (/reiteraron.*llamados|instaron.*poblaci[oó]n|recomendaciones b[aá]sicas|exigir.*documentaci[oó]n|canales.*denuncia|reportar.*riesgo|acatar.*planes/i.test(pt) && pt.length > 60) {
      t = t.replace(p, '');
    }
    // Eliminar párrafos con prevención genérica
    if (/prevenci[oó]n.*riesgos|medidas.*seguridad|equipos.*protecci[oó]n|arn[eé]s de seguridad|calzado.*diel[eé]ctrico|guantes.*diel[eé]ctricos/i.test(pt) && pt.length > 80) {
      t = t.replace(p, '');
    }
    // Eliminar párrafos con cifras genéricas tipo "28 personas", "45%"
    if (/(?:m[aá]s de|al menos|aproximadamente)\s+\d+\s+(?:personas|v[ií]ctimas|casos|incidentes).*murieron|fallecieron/i.test(pt) && !pt.includes('fue identificado')) {
      // Solo si es un párrafo estadístico genérico, no si es parte del desarrollo del hecho
      if (!pt.includes('víctima') && !pt.includes('identific')) {
        t = t.replace(p, '');
      }
    }
    // Eliminar párrafos con "ministerio del trabajo", "corporación municipal", etc en contexto genérico
    if (/ministerio del trabajo.*exponen|corporaci[oó]n municipal.*commema|planes de ordenamiento/i.test(pt)) {
      t = t.replace(p, '');
    }
    // Eliminar párrafos con "persistencia de vulnerabilidades", "conexiones eléctricas artesanales"
    if (/persistencia.*vulnerabilidades|conexiones el[eé]ctricas artesanales|falta de ordenamiento/i.test(pt)) {
      t = t.replace(p, '');
    }
  });

  // Eliminar transiciones IA
  const transiciones = [
    'en conclusión', 'en resumen', 'es importante destacar', 'vale la pena mencionar',
    'es vital', 'resulta fundamental', 'es indiscutible', 'no cabe duda',
    'resulta evidente', 'resulta innegable', 'en el contexto de', 'desde esta perspectiva'
  ];
  transiciones.forEach(tr => {
    const r = new RegExp(`<p>.*?${tr}.*?<\\/p>`, 'gi');
    t = t.replace(r, '');
  });

  // Limpiar HTML
  t = t.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').replace(/<p>\s*<\/p>/gi, '').replace(/\n\s*\n/g, '\n').trim();

  return t;
}

function acortarTitulo(t) {
  if (t.length <= 60) return t;
  const c = t.slice(0, 60).lastIndexOf(' ');
  return t.slice(0, c > 30 ? c : 55).replace(/\.{3,}$/, '');
}

function generarMeta(c, cat) {
  const tx = c.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const or = tx.split(/(?<=[.!?])\s+/).filter(s => s.length > 20);
  let m = or.slice(0, 2).join(' ');
  if (m.length < 150) m += ` Noticias ${cat || 'Nicaragua'}.`;
  if (m.length > 170) m = m.slice(0, 167) + '...';
  return m;
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').where('estado', '==', 'publicado').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  let limpiadas = 0;
  let sinCambios = 0;

  for (const n of docs) {
    const original = n.contenido || '';
    const contenidoLimpio = limpiarContenido(original);

    if (contenidoLimpio === original || contenidoLimpio.length < 200) {
      sinCambios++;
      continue;
    }

    const data = {
      contenido: contenidoLimpio,
      resumen: generarMeta(contenidoLimpio, n.categoria),
      autor: n.autor || 'Keyling Elieth Rivera Muñoz',
      fechaActualizacion: FieldValue.serverTimestamp()
    };

    // Si el título es muy largo, acortarlo
    if (n.titulo && n.titulo.length > 60) {
      data.titulo = acortarTitulo(n.titulo);
    }

    await db.collection('noticias').doc(n.id).update(data);
    limpiadas++;
    console.log(`✅ ${n.titulo?.slice(0, 50)}...`);
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`LIMPIADAS: ${limpiadas}`);
  console.log(`SIN CAMBIOS: ${sinCambios}`);
  console.log(`TOTAL: ${docs.length}`);
  console.log(`═══════════════════════════════════════`);

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
