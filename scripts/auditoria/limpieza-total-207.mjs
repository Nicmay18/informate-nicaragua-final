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
  t = t.replace(/\b2027\b/g, '2025');
  t = t.replace(/\b2028\b/g, '2025');

  // Eliminar secciones de basura IA
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
    'Marco jurídico',
    'Marco normativo',
    'Recomendaciones técnicas',
    'Recomendaciones',
    'Prevención de riesgos',
    'Seguridad ocupacional',
    'Seguridad civil',
    'Análisis normativo',
    'Normativas',
    'Regulaciones',
    'Estadísticas',
    'Indicadores'
  ];

  seccionesBasura.forEach(s => {
    const r = new RegExp(`<h[234]>\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:</h[234]>)[\\s\\S]*?(?=<h[234]>|<p>Pie de Foto|$)`, 'gi');
    t = t.replace(r, '');
  });

  // Patrones genéricos
  t = t.replace(/<h[234]>\s*(?:Regulaci[oó]n|Normativa|Estad[ií]sticas|Indicadores|Marco [Jj]ur[ií]dico|Marco [Nn]ormativo|Recomendaciones|Prevenci[oó]n|Seguridad [Oo]cupacional|Seguridad [Cc]ivil|An[aá]lisis [Nn]ormativo|Gesti[oó]n de [Rr]iesgos|Riesgos [Ll]aborales|Tr[aá]mites [Cc]onsulares).*?<\/h[234]>[\s\S]*?(?=<h[234]>|<p>Pie de Foto|$)/gi, '');

  // Eliminar párrafos con basura
  let ps = t.match(/<p>(.*?)<\/p>/gi) || [];
  ps.forEach(p => {
    const pt = p.replace(/<[^>]*>/g, '').toLowerCase();
    if (/ley\s+\d{3}.*establece|ley\s+\d{3}.*art[ií]culo|obligatoriedad|sanciones|multas|facultan.*suspender|licencias de funcionamiento|clausura|prohibe/i.test(pt) && pt.length > 40) {
      t = t.replace(p, '');
    }
    if (/(estad[ií]sticas|an[aá]lisis|registros|balances|indicadores).*\d+\s+(?:incidentes|naufragios|excursionistas|por ciento|accidentes|personas|v[ií]ctimas)/i.test(pt) && pt.length > 50) {
      t = t.replace(p, '');
    }
    if (/reiteraron.*llamados|instaron.*poblaci[oó]n|recomendaciones b[aá]sicas|exigir.*documentaci[oó]n|canales.*denuncia|reportar.*riesgo|acatar.*planes|reiter.*llamado|instar.*poblaci[oó]n/i.test(pt) && pt.length > 50) {
      t = t.replace(p, '');
    }
    if (/prevenci[oó]n.*riesgos|medidas.*seguridad|equipos.*protecci[oó]n|arn[eé]s de seguridad|calzado.*diel[eé]ctrico|guantes.*diel[eé]ctricos|chalecos salvavidas|extintores/i.test(pt) && pt.length > 60) {
      t = t.replace(p, '');
    }
    if (/ministerio del trabajo.*exponen|corporaci[oó]n municipal.*commema|planes de ordenamiento|persistencia.*vulnerabilidades|conexiones el[eé]ctricas artesanales|falta de ordenamiento|seguros de vida|canales de enlace/i.test(pt)) {
      t = t.replace(p, '');
    }
  });

  // Eliminar transiciones IA
  const transiciones = [
    'en conclusión', 'en resumen', 'es importante destacar', 'vale la pena mencionar',
    'es vital', 'resulta fundamental', 'es indiscutible', 'no cabe duda',
    'resulta evidente', 'resulta innegable', 'en el contexto de', 'desde esta perspectiva',
    'en última instancia', 'a fin de cuentas', 'para concluir', 'en definitiva'
  ];
  transiciones.forEach(tr => {
    const r = new RegExp(`<p>[^<]*${tr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*<\\/p>`, 'gi');
    t = t.replace(r, '');
  });

  // Limpiar HTML
  t = t.replace(/<p>\s*<\/p>/gi, '');
  t = t.replace(/\n\s*\n/g, '\n');
  t = t.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();

  return t;
}

function acortarTitulo(t) {
  if (!t || t.length <= 60) return t;
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
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  let limpiadas = 0;
  let sinCambios = 0;
  let errores = 0;

  for (const n of docs) {
    try {
      const original = n.contenido || '';
      const contenidoLimpio = limpiarContenido(original);

      // Si no cambió nada y no tiene basura obvia, saltar
      if (contenidoLimpio === original) {
        sinCambios++;
        continue;
      }

      // Si quedó muy corto, no actualizar
      if (contenidoLimpio.length < 200) {
        console.log(`⚠️ MUY CORTA: ${n.titulo?.slice(0, 40)} — ${contenidoLimpio.length} chars`);
        sinCambios++;
        continue;
      }

      const data = {
        contenido: contenidoLimpio,
        resumen: generarMeta(contenidoLimpio, n.categoria),
        autor: n.autor || 'Keyling Elieth Rivera Muñoz',
        fechaActualizacion: FieldValue.serverTimestamp()
      };

      if (n.titulo && n.titulo.length > 60) {
        data.titulo = acortarTitulo(n.titulo);
      }

      await db.collection('noticias').doc(n.id).update(data);
      limpiadas++;
      console.log(`✅ ${n.titulo?.slice(0, 50) || '(sin título)'} — ${n.categoria || '?'} [${n.estado || 'sin estado'}]`);
    } catch (err) {
      errores++;
      console.log(`❌ ERROR en ${n.id}: ${err.message}`);
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`TOTAL NOTICIAS: ${docs.length}`);
  console.log(`✅ LIMPIADAS: ${limpiadas}`);
  console.log(`⏭️  SIN CAMBIOS: ${sinCambios}`);
  console.log(`❌ ERRORES: ${errores}`);
  console.log(`═══════════════════════════════════════════════════════`);

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
