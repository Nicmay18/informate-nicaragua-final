#!/usr/bin/env node
// pulir-lote-8.mjs — Pulir 10 noticias más (tormenta Cristina, depresión Three-E, etc.)

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

function limpiar(contenido) {
  let texto = contenido;
  const cambios = [];

  // 1. Eliminar sección "Antecedentes o contexto" COMPLETA
  const regexAntecedentes = /<h2>\s*(?:Antecedentes|Antecedentes o contexto|Contexto|Entorno macroecon[oó]mico y cobertura)\s*<\/h2>[\s\S]*?(?=<h2>|<p>Pie de Foto|$)/i;
  if (regexAntecedentes.test(texto)) {
    texto = texto.replace(regexAntecedentes, '');
    cambios.push('Sección de antecedentes/contexto eliminada');
  }

  // 2. Eliminar párrafos relleno legal/estadístico genérico
  const parrafos = texto.match(/<p>(.*?)<\/p>/gi) || [];
  parrafos.forEach(p => {
    const pTexto = p.replace(/<[^>]*>/g, '');
    if ((/Ley\s+\d+.*art[ií]culo.*\d+.*establece.*(?:penas|a[nñ]os|prisi[oó]n)/i.test(pTexto) && pTexto.length > 180) ||
        (/Ley\s+\d+.*regula.*mecanismos.*coordinaci[oó]n/i.test(pTexto) && pTexto.length > 180) ||
        (/estad[ií]sticas.*porcentaje.*poblaci[oó]n/i.test(pTexto) && pTexto.length > 180) ||
        (/registros.*indicadores.*variaci[oó]n.*comparaci[oó]n.*ciclo/i.test(pTexto) && pTexto.length > 180) ||
        (/proyecciones.*estiman.*crecimiento.*Producto Interno Bruto/i.test(pTexto)) ||
        (/cobertura boscosa.*transmisi[oó]n.*idioma.*t[eé]cnicas/i.test(pTexto)) ||
        (/inversiones.*superan.*d[oó]lares.*derechos de transmisi[oó]n/i.test(pTexto)) ||
        (/normativas.*presupuestarias.*asignaciones.*formaci[oó]n/i.test(pTexto)) ||
        (/iniciativa.*educaci[oó]n vial.*Conduce con Vida/i.test(pTexto) && pTexto.length > 150) ||
        (/desde el ciclo del a[nñ]o\s+\d{4}.*sector bancario.*estabiliz[oó]/i.test(pTexto))) {
      texto = texto.replace(p, '');
      cambios.push('Párrafo relleno legal/estadístico eliminado');
    }
  });

  // 3. Eliminar frases IA
  const frases = [
    /[,;]?\s*asimismo[,;]?\s*/gi, /[,;]?\s*por otro lado[,;]?\s*/gi,
    /[,;]?\s*de igual manera[,;]?\s*/gi, /[,;]?\s*en ese sentido[,;]?\s*/gi,
    /[,;]?\s*cabe señalar[,;]?\s*/gi, /[,;]?\s*resulta fundamental[,;]?\s*/gi,
    /[,;]?\s*se espera que[,;]?\s*[^.]*\./gi, /[,;]?\s*contin[uú]an las investigaciones[,;]?\s*[^.]*\./gi,
    /[,;]?\s*las autoridades reiteraron[,;]?\s*[^.]*\./gi, /[,;]?\s*por su parte[,;]?\s*/gi,
    /[,;]?\s*en [uú]ltima instancia[,;]?\s*/gi, /[,;]?\s*en el marco de[,;]?\s*/gi,
    /[,;]?\s*desde esta perspectiva[,;]?\s*/gi, /[,;]?\s*en el contexto de[,;]?\s*/gi
  ];
  frases.forEach(r => { texto = texto.replace(r, ' '); });

  // 4. Asegurar strongs en nombres propios
  const nombres = texto.match(/\b([A-Z][a-zÀ-ÿ]+(?:\s+[A-Z][a-zÀ-ÿ]+){1,3})\b/g);
  if (nombres) {
    [...new Set(nombres)].forEach(n => {
      if (!texto.includes(`<strong>${n}</strong>`) && n.length > 8 && !/^(El|La|Los|Las|Un|Una|Este|Esa|Cada|Otro|Algun|Ningun|Estos|Estas|Aquell|Aquellas|Otros|Otras|Del|Al|Con|Por|Para|Sin|Sobre|Entre|Hasta|Desde|Durante|Mediante|Según|Segun|Contra|Hacia|Tras|Excepto|Salvo|Incluso|Además|Asimismo|También|Sin embargo|No obstante|Por lo tanto|Por consiguiente|En consecuencia|De hecho|En efecto|Es decir|O sea|Mejor dicho)$/i.test(n)) {
        texto = texto.replace(new RegExp(`\\b${n.replace(/\s+/g, '\\s+')}\\b(?!</strong>)`, 'g'), `<strong>${n}</strong>`);
      }
    });
  }

  // 5. Asegurar blockquotes en declaraciones
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

  // 6. Eliminar placas genéricas
  texto = texto.replace(/\bplacas\s+(?:456|M\s*\d{1,3})\b/gi, (match) => {
    cambios.push(`Placa genérica eliminada: ${match}`);
    return '[placa no especificada]';
  });

  // 7. Limpiar
  texto = texto.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').replace(/<p>\s*<\/p>/gi, '').trim();

  return { contenido: texto, cambios };
}

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();
  
  const buscar = [
    'tormenta cristina', 'depresion three', 'accidentes viales', 'tres leches',
    'relevos mixtos', 'depositos del publico', 'atletismo'
  ];

  let procesadas = 0;

  for (const palabra of buscar) {
    const docs = snapshot.docs.filter(d => {
      const t = (d.data().titulo || '').toLowerCase();
      return t.includes(palabra);
    });

    if (docs.length > 0) {
      const doc = docs[0];
      const { contenido, cambios } = limpiar(doc.data().contenido || '');
      await doc.ref.update({ contenido, fechaActualizacion: FieldValue.serverTimestamp() });
      procesadas++;
      console.log(`✅ ${(doc.data().titulo || '').slice(0, 50)} (${cambios.length} cambios)`);
    }
  }

  console.log(`\nProcesadas: ${procesadas}`);
  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
