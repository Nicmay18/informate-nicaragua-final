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

function limpiarNoticia(contenido) {
  let texto = contenido;
  const cambios = [];

  // 1. Eliminar sección "Antecedentes o contexto" completa
  texto = texto.replace(/<h2>\s*Antecedentes\s*(?:o\s+contexto)?\s*<\/h2>[\s\S]*?(?=<h2>|<p>Pie de Foto|<p>\s*Pie de Foto|$)/gi, '');

  // 2. Eliminar párrafos relleno legal/estadístico excesivo
  const parrafos = texto.match(/<p>(.*?)<\/p>/gi) || [];
  parrafos.forEach(p => {
    const pTexto = p.replace(/<[^>]*>/g, '');
    if ((/Ley\s+\d+.*art[ií]culo.*\d+.*establece.*penas.*a[nñ]os/i.test(pTexto) && pTexto.length > 200) ||
        (/estad[ií]sticas.*porcentaje.*poblaci[oó]n/i.test(pTexto) && pTexto.length > 200) ||
        (/\d{1,2}\s+ciudadanos.*a[nñ]o\s+\d{4}.*registros/i.test(pTexto) && pTexto.length > 200) ||
        (/presupuesto.*mill[oó]n.*c[oó]rdob/i.test(pTexto)) ||
        (/marco legal.*Ley\s+\d+.*establece/i.test(pTexto) && pTexto.length > 200) ||
        (/cobertura boscosa.*transmisi[oó]n.*idioma.*t[eé]cnicas/i.test(pTexto)) ||
        (/proyecciones institucionales.*curr[ií]culos.*educaci[oó]n intercultural/i.test(pTexto)) ||
        (/inversiones.*superan.*d[oó]lares.*derechos de transmisi[oó]n/i.test(pTexto))) {
      texto = texto.replace(p, '');
      cambios.push('Párrafo relleno IA eliminado');
    }
  });

  // 3. Eliminar frases IA
  const frases = [
    /[,;]?\s*asimismo[,;]?\s*/gi, /[,;]?\s*por otro lado[,;]?\s*/gi, /[,;]?\s*de igual manera[,;]?\s*/gi,
    /[,;]?\s*en ese sentido[,;]?\s*/gi, /[,;]?\s*cabe señalar[,;]?\s*/gi, /[,;]?\s*resulta fundamental[,;]?\s*/gi,
    /[,;]?\s*se espera que[,;]?\s*[^.]*\./gi, /[,;]?\s*contin[uú]an las investigaciones[,;]?\s*[^.]*\./gi,
    /[,;]?\s*las autoridades reiteraron[,;]?\s*[^.]*\./gi, /[,;]?\s*por su parte[,;]?\s*/gi,
    /[,;]?\s*en [uú]ltima instancia[,;]?\s*/gi, /[,;]?\s*en el marco de[,;]?\s*/gi,
    /[,;]?\s*desde esta perspectiva[,;]?\s*/gi, /[,;]?\s*en el contexto de[,;]?\s*/gi,
    /[,;]?\s*a fin de cuentas[,;]?\s*/gi
  ];
  frases.forEach(r => { texto = texto.replace(r, ' '); });

  // 4. Asegurar <strong> en nombres propios no resaltados
  const nombres = texto.match(/\b([A-Z][a-zÀ-ÿ]+(?:\s+[A-Z][a-zÀ-ÿ]+){1,3})\b/g);
  if (nombres) {
    [...new Set(nombres)].forEach(n => {
      if (!texto.includes(`<strong>${n}</strong>`) && n.length > 8 && !/^(El|La|Los|Las|Un|Una|Este|Esa|Cada|Otro|Algun|Ningun|Estos|Estas|Aquell|Aquellas|Otros|Otras|Del|Al|Con|Por|Para|Sin|Sobre|Entre|Hasta|Desde|Durante|Mediante|Según|Segun|Contra|Hacia|Tras|Excepto|Salvo|Incluso|Además|Asimismo|También|Sin embargo|No obstante|Por lo tanto|Por consiguiente|En consecuencia|De hecho|En efecto|Es decir|O sea|Mejor dicho|O mejor|O peor|O igual|O distinto|O similar|O contrario|O mismo|O diferente|O parecido|O equivalente|O comparable|O análogo|O semejante)$/i.test(n)) {
        texto = texto.replace(new RegExp(`\\b${n.replace(/\s+/g, '\\s+')}\\b(?!</strong>)`, 'g'), `<strong>${n}</strong>`);
      }
    });
  }

  // 5. Asegurar blockquotes en declaraciones citadas
  const parrafos2 = texto.match(/<p>(.*?)<\/p>/gi) || [];
  parrafos2.forEach(p => {
    const pTexto = p.replace(/<[^>]*>/g, '');
    if ((/[\u201c"].*[\u201d"].*(?:inform[oó]|declar[oó]|precis[oó]|señal[oó]|indic[oó]|dijo|explic[oó]|manifest[oó]|agreg[oó]|asegur[oó]|destac[oó]|mencion[oó])/.test(pTexto) ||
         (pTexto.includes('"') && /(?:inform[oó]|declar[oó]|precis[oó]|señal[oó]|indic[oó]|dijo|explic[oó])/.test(pTexto))) &&
        !p.includes('<blockquote>') && pTexto.length > 30) {
      const pLimpio = p.replace(/<\/?p>/gi, '');
      texto = texto.replace(p, `<blockquote><p>${pLimpio}</p></blockquote>`);
    }
  });

  // 6. Limpiar
  texto = texto.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').replace(/<p>\s*<\/p>/gi, '').replace(/\n{3,}/g, '\n\n').trim();

  return { contenido: texto, cambios };
}

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();

  const titulosBuscar = [
    'Nicaragüense fallece en accidente laboral en Wisconsin',
    'Policía captura a sospechosos de asalto en Bonanza',
    'El pueblo Rama inicia el ciclo tradicional de Kartuk Tukan',
    'Prisión preventiva para acusado de feminicidio en Masaya',
    'Tatiana Guzmán debuta en el VAR',
    'Dos árbitros nicaragüenses representarán',
    'España Francia y Argentina llegan como favoritas'
  ];

  let procesadas = 0;

  for (const tituloBuscar of titulosBuscar) {
    const palabrasBuscar = tituloBuscar.toLowerCase().split(' ').filter(w => w.length > 3);
    const docs = snapshot.docs.filter(d => {
      const t = (d.data().titulo || '').toLowerCase();
      return palabrasBuscar.some(p => t.includes(p));
    });

    if (docs.length === 0) {
      console.log(`⚠️ No encontrada: ${tituloBuscar}`);
      continue;
    }

    // Ordenar por relevancia (más palabras coinciden = mejor)
    docs.sort((a, b) => {
      const ta = (a.data().titulo || '').toLowerCase();
      const tb = (b.data().titulo || '').toLowerCase();
      const ca = palabrasBuscar.filter(p => ta.includes(p)).length;
      const cb = palabrasBuscar.filter(p => tb.includes(p)).length;
      return cb - ca;
    });

    const doc = docs[0];
    const { contenido, cambios } = limpiarNoticia(doc.data().contenido || '');

    await doc.ref.update({
      contenido,
      fechaActualizacion: FieldValue.serverTimestamp(),
    });
    procesadas++;
    console.log(`✅ ${(doc.data().titulo || '').slice(0, 55)} (${cambios.length} cambios)`);
  }

  console.log(`\nProcesadas: ${procesadas}/${titulosBuscar.length}`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
