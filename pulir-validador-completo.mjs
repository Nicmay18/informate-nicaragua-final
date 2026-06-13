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

function acortarTitulo(titulo) {
  if (!titulo) return '';
  if (titulo.length <= 60) return titulo;
  // Cortar en último espacio antes de 60 chars
  const corte = titulo.slice(0, 60).lastIndexOf(' ');
  return titulo.slice(0, corte > 30 ? corte : 55) + '...';
}

function generarMeta(titulo, contenido) {
  const texto = (contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  // Tomar primeras 2-3 oraciones
  const oraciones = texto.split(/(?<=[.!?])\s+/).filter(s => s.length > 20);
  let meta = oraciones.slice(0, 2).join(' ');
  if (meta.length < 120) meta += ' ' + (oraciones[2] || '');
  if (meta.length > 170) meta = meta.slice(0, 167) + '...';
  if (meta.length < 150) meta += ' Información actualizada.';
  return meta;
}

function optimizarSlug(titulo) {
  if (!titulo) return '';
  return titulo.toLowerCase()
    .replace(/[^a-z0-9\sáéíóúüñ]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/-$/, '');
}

function limpiarContenidoORO(contenido) {
  let texto = contenido || '';
  const cambios = [];

  // 1. Eliminar sección "Antecedentes o contexto" COMPLETA
  const regexAntecedentes = /<h2>\s*(?:Antecedentes|Antecedentes o contexto|Contexto|Entorno macroecon[oó]mico y cobertura)\s*<\/h2>[\s\S]*?(?=<h2>|<p>Pie de Foto|$)/i;
  if (regexAntecedentes.test(texto)) {
    texto = texto.replace(regexAntecedentes, '');
    cambios.push('Antecedentes/contexto eliminado');
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
        (/desde el ciclo del a[nñ]o\s+\d{4}.*sector bancario.*estabiliz[oó]/i.test(pTexto)) ||
        (/balance.*financiero.*sector tur[ií]stico.*gasto.*visitantes/i.test(pTexto) && pTexto.length > 200) ||
        (/cobertura forestal.*indicadores demogr[aá]ficos.*Censo/i.test(pTexto) && pTexto.length > 150)) {
      texto = texto.replace(p, '');
      cambios.push('Relleno legal/estadístico eliminado');
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
      if (!texto.includes(`<strong>${n}</strong>`) && n.length > 8 && !/^(El|La|Los|Las|Un|Una|Este|Esa|Cada|Otro|Algun|Ningun|Estos|Estas|Aquell|Aquellas|Otros|Otras|Del|Al|Con|Por|Para|Sin|Sobre|Entre|Hasta|Desde|Durante|Mediante|Seg[uú]n|Segun|Contra|Hacia|Tras|Excepto|Salvo|Incluso|Adem[aá]s|Asimismo|Tambi[eé]n|Sin embargo|No obstante|Por lo tanto|Por consiguiente|En consecuencia|De hecho|En efecto|Es decir|O sea|Mejor dicho)$/i.test(n)) {
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
  texto = texto.replace(/\bplacas\s+(?:456|M\s*\d{1,3})\b/gi, '[placa no especificada]');

  // 7. Limpiar
  texto = texto.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').replace(/<p>\s*<\/p>/gi, '').trim();

  return { contenido: texto, cambios };
}

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();
  
  // IDs o títulos exactos de las 19 noticias que el usuario pasó
  const notasAProcesar = [
    'Nicaragüense fallece en accidente laboral en Wisconsin',
    'Policía captura a sospechosos de asalto en Bonanza',
    'El pueblo Rama inicia el ciclo tradicional de Kartuk Tukan',
    'Prisión preventiva para acusado de feminicidio en Masaya',
    'Tatiana Guzmán debuta en el VAR de la Copa Mundial',
    'Dos árbitros nicaragüenses representarán al país en el Mundial',
    'España Francia y Argentina llegan como favoritas al Mundial',
    'Fuerte oleaje por tormenta Cristina causa daños materiales en Rivas',
    'Depresión tropical Three-E se consolida frente al Pacífico nicaragüense',
    'Ocho personas fallecen en accidentes viales durante fin de semana',
    'El tres leches nicaragüense obtiene reconocimiento gastronómico internacional',
    'Nicaragua conquista medalla de oro y récord nacional en relevos mixtos 4x100',
    'Depósitos del público en el sistema financiero alcanzan cifra histórica',
    'Cuatro nicaragüenses fallecen en Costa Rica, El Salvador y EE.UU.',
    'Dos nicaragüenses fallecen en accidentes en Honduras',
    'Dos hombres fallecen por descargas eléctricas en Managua',
    'Dos obreros fallecen y otros dos resultan heridos',
    'Dos jóvenes fallecen asfixiados en pozo en Kukra Hill',
    'Dos nicaragüenses fallecen en el extranjero: Costa Rica y EE.UU.'
  ];

  let procesadas = 0;
  const ahora = new Date();

  for (const tituloBuscar of notasAProcesar) {
    // Buscar por palabras clave del título
    const palabras = tituloBuscar.toLowerCase().split(' ').filter(w => w.length > 3);
    const docs = snapshot.docs.filter(d => {
      const t = (d.data().titulo || '').toLowerCase();
      return palabras.some(p => t.includes(p));
    });

    if (docs.length === 0) {
      console.log(`❌ No encontrada: ${tituloBuscar.slice(0, 50)}`);
      continue;
    }

    // Ordenar por relevancia
    docs.sort((a, b) => {
      const ta = (a.data().titulo || '').toLowerCase();
      const tb = (b.data().titulo || '').toLowerCase();
      const ca = palabras.filter(p => ta.includes(p)).length;
      const cb = palabras.filter(p => tb.includes(p)).length;
      return cb - ca;
    });

    const doc = docs[0];
    const data = doc.data();

    // 1. Limpiar contenido
    const { contenido, cambios } = limpiarContenidoORO(data.contenido || '');

    // 2. Acortar título si es necesario
    const tituloNuevo = acortarTitulo(data.titulo || '');

    // 3. Generar meta description
    const metaNueva = generarMeta(tituloNuevo, contenido);

    // 4. Optimizar slug
    const slugNuevo = optimizarSlug(tituloNuevo);

    // 5. Actualizar en Firestore
    const updateData = {
      contenido,
      titulo: tituloNuevo,
      resumen: metaNueva,
      slug: slugNuevo,
      fechaActualizacion: FieldValue.serverTimestamp(),
    };

    // Si no tiene fecha o es vieja, actualizarla
    if (!data.fecha || (data.fecha?.toDate && (ahora - data.fecha.toDate()) > 7 * 24 * 60 * 60 * 1000)) {
      updateData.fecha = FieldValue.serverTimestamp();
    }

    await doc.ref.update(updateData);

    const tituloCortado = tituloNuevo.length < (data.titulo || '').length ? ` (${tituloNuevo.length} chars)` : '';
    console.log(`✅ ${(data.titulo || '').slice(0, 50)}${tituloCortado}`);
    console.log(`   Meta: ${metaNueva.length} chars | Slug: ${slugNuevo}`);
    if (cambios.length > 0) cambios.forEach(c => console.log(`   ${c}`));
    procesadas++;
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`Procesadas: ${procesadas}/${notasAProcesar.length}`);
  console.log(`Fecha actual: ${ahora.toISOString()}`);
  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
