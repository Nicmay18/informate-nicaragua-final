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

const TRANSICIONES_IA = [
  'en conclusion', 'en resumen', 'es importante destacar', 'vale la pena mencionar',
  'no hay que olvidar', 'en el contexto de', 'desde esta perspectiva', 'en ultima instancia',
  'a fin de cuentas', 'en el marco de', 'resulta fundamental', 'resulta evidente',
  'no cabe duda', 'es indiscutible', 'resulta innegable', 'en definitiva', 'para concluir',
  'como se menciono anteriormente', 'es relevante senalar', 'no se puede ignorar',
  'es crucial', 'es vital', 'asimismo', 'por otro lado', 'en ese sentido', 'cabe señalar',
  'las autoridades reiteraron', 'por su parte', 'se mantienen operativos', 'se espera que',
  'contin[uú]an las investigaciones'
];

const KEYWORDS_LSI = {
  'Sucesos': ['accidente', 'managua', 'policia nacional', 'transito', 'heridos'],
  'Politica': ['gobierno', 'nicaragua', 'asamblea nacional', 'ley', 'ministerio'],
  'Economia': ['precio', 'mercado', 'exportacion', 'cordoba', 'dolar', 'inversion'],
  'Salud': ['minsa', 'hospital', 'vacuna', 'salud', 'epidemia'],
  'Deportes': ['beisbol', 'futbol', 'nicaragua', 'mundial', 'juegos', 'atleta'],
  'Tecnologia': ['internet', 'redes sociales', 'celular', 'aplicacion', 'digital'],
  'Internacionales': ['eeuu', 'mexico', 'centroamerica', 'mundo', 'crisis'],
  'Nacionales': ['nicaragua', 'managua', 'gobierno', 'pais', 'nacional'],
  'Cultura': ['tradicion', 'folklore', 'gastronomia', 'indigena', 'patrimonio'],
};

function limpiar(contenido, categoria) {
  let texto = contenido || '';

  // 1. Eliminar transiciones IA
  TRANSICIONES_IA.forEach(frase => {
    const regex = new RegExp(`[,;]?\\s*${frase.replace(/\s/g, '\\s+')}[,;]?\\s*`, 'gi');
    texto = texto.replace(regex, ' ');
  });

  // 2. Eliminar antecedentes
  const regexAntecedentes = /<h2>\s*(?:Antecedentes|Antecedentes o contexto|Contexto)\s*<\/h2>[\s\S]*?(?=<h2>|<p>Pie de Foto|$)/i;
  texto = texto.replace(regexAntecedentes, '');

  // 3. Eliminar relleno legal
  const parrafos = texto.match(/<p>(.*?)<\/p>/gi) || [];
  parrafos.forEach(p => {
    const pTexto = p.replace(/<[^>]*>/g, '');
    if (/Ley\s+\d+.*art[ií]culo.*\d+.*establece.*(?:penas|a[nñ]os|prisi[oó]n)/i.test(pTexto) && pTexto.length > 180) {
      texto = texto.replace(p, '');
    }
  });

  // 4. Inyectar keywords LSI
  const keywords = KEYWORDS_LSI[categoria] || ['nicaragua', 'noticias'];
  const faltantes = keywords.filter(k => !texto.toLowerCase().includes(k.toLowerCase()));
  if (faltantes.length > 0) {
    const primerP = texto.match(/<p>(?!<blockquote>)(.*?)<\/p>/i);
    if (primerP) {
      const kt = faltantes.slice(0, 2).join(', ');
      const nuevoP = primerP[0].replace('</p>', ` El caso involucra elementos de ${kt}.</p>`);
      texto = texto.replace(primerP[0], nuevoP);
    }
  }

  // 5. Asegurar blockquotes y strongs
  const parrafos2 = texto.match(/<p>(.*?)<\/p>/gi) || [];
  parrafos2.forEach(p => {
    const pt = p.replace(/<[^>]*>/g, '');
    if ((/[\u201c"].*[\u201d"].*(?:inform[oó]|declar[oó]|dijo)/.test(pt) ||
         (pt.includes('"') && /(?:inform[oó]|declar[oó]|dijo)/.test(pt))) &&
        !p.includes('<blockquote>') && pt.length > 30) {
      const pLimpio = p.replace(/<\/?p>/gi, '');
      texto = texto.replace(p, `<blockquote><p>${pLimpio}</p></blockquote>`);
    }
  });

  const nombres = texto.match(/\b([A-Z][a-zÀ-ÿ]+(?:\s+[A-Z][a-zÀ-ÿ]+){1,3})\b/g);
  if (nombres) {
    [...new Set(nombres)].forEach(n => {
      if (!texto.includes(`<strong>${n}</strong>`) && n.length > 8 && !/^(El|La|Los|Las|Un|Este|Del|Al|Con|Por|Para|Sin|Sobre|Entre|Hasta|Desde|Durante|Mediante|Segun|Contra|Hacia|Tras|Excepto|Salvo|Incluso|Ademas|Asimismo|Tambien|Sin embargo|No obstante|Por lo tanto|Por consiguiente|En consecuencia|De hecho|En efecto|Es decir|O sea|Mejor dicho)$/i.test(n)) {
        texto = texto.replace(new RegExp(`\\b${n.replace(/\s+/g, '\\s+')}\\b(?!</strong>)`, 'g'), `<strong>${n}</strong>`);
      }
    });
  }

  return texto.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').replace(/<p>\s*<\/p>/gi, '').trim();
}

function acortarTitulo(titulo) {
  if (!titulo || titulo.length <= 60) return titulo;
  const corte = titulo.slice(0, 60).lastIndexOf(' ');
  return titulo.slice(0, corte > 30 ? corte : 55).replace(/\.{3,}$/, '');
}

function generarMeta(contenido, categoria) {
  const texto = (contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const oraciones = texto.split(/(?<=[.!?])\s+/).filter(s => s.length > 20);
  let meta = oraciones.slice(0, 2).join(' ');
  if (meta.length < 150) meta += ` Noticias ${categoria} Nicaragua.`;
  if (meta.length > 170) meta = meta.slice(0, 167) + '...';
  return meta;
}

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();

  const ids = [
    'POzMmYcjC7Vy2JHS1KmW',   // Jinotegana (ya hecha)
    'tXBIl2x9SQj6C4v4s4i8',   // Bonanza
    'vDqwQW7VvkSeu8xbi5O3',   // La de Wisconsin
  ];

  // Buscar las restantes por keywords
  const busquedas = [
    { keywords: ['kartuk', 'tukan', 'rama'], titulo: 'Kartuk Tukan' },
    { keywords: ['feminicidio', 'masaya', 'prision'], titulo: 'Feminicidio Masaya' },
    { keywords: ['tatiana', 'guzman', 'arbitro'], titulo: 'Tatiana Guzmán' },
    { keywords: ['arbitros', 'mundial', '2026'], titulo: 'Árbitros Mundial' },
    { keywords: ['espana', 'francia', 'argentina', 'favoritas'], titulo: 'España Francia Argentina' },
    { keywords: ['oleaje', 'cristina', 'rivas'], titulo: 'Oleaje Cristina' },
    { keywords: ['three', 'depresion', 'pacifico'], titulo: 'Three-E' },
    { keywords: ['fallecen', 'accidentes', 'viales', 'ocho'], titulo: '8 fallecidos viales' },
    { keywords: ['tres leches', 'reconocimiento'], titulo: 'Tres Leches' },
    { keywords: ['relevos', 'mixtos', 'oro', 'atletismo'], titulo: 'Relevos mixtos' },
    { keywords: ['depositos', 'financiero', 'banco'], titulo: 'Depósitos financiero' },
    { keywords: ['costa rica', 'fallecen', 'salvador'], titulo: 'Costa Rica fallecen' },
    { keywords: ['honduras', 'fallecen', 'accidentes'], titulo: 'Honduras fallecen' },
    { keywords: ['descargas', 'electricas', 'managua'], titulo: 'Descargas eléctricas' },
    { keywords: ['obreros', 'fallecen', 'heridos'], titulo: 'Obreros fallecen' },
    { keywords: ['asfixiados', 'pozo', 'kukra'], titulo: 'Asfixiados pozo' },
    { keywords: ['extranjero', 'costa rica', 'eeuu'], titulo: 'Extranjero CR EE.UU.' },
  ];

  let procesadas = 0;
  const ahora = new Date();

  // Convertir a array
  const todosDocs = [];
  snapshot.forEach(d => todosDocs.push(d));

  for (const b of busquedas) {
    const docs = todosDocs.filter(d => {
      const t = (d.data().titulo || '').toLowerCase();
      return b.keywords.some(k => t.includes(k));
    }).sort((a, bDoc) => {
      const ta = (a.data().titulo || '').toLowerCase();
      const tb = (bDoc.data().titulo || '').toLowerCase();
      const ca = b.keywords.filter(k => ta.includes(k)).length;
      const cb = b.keywords.filter(k => tb.includes(k)).length;
      return cb - ca;
    });

    if (docs.length === 0) {
      console.log(`❌ No encontrada: ${b.titulo}`);
      continue;
    }

    const doc = docs[0];
    const data = doc.data();
    const categoria = data.categoria || 'Nacionales';

    // Limpiar
    const contenido = limpiar(data.contenido || '', categoria);
    const titulo = acortarTitulo(data.titulo || '');
    const meta = generarMeta(contenido, categoria);

    await doc.ref.update({
      contenido,
      titulo,
      resumen: meta,
      fechaActualizacion: FieldValue.serverTimestamp(),
      imagenDestacada: true,
      autor: 'Keyling Elieth Rivera Muñoz',
    });

    console.log(`✅ ${titulo.slice(0, 50)} (${meta.length} chars meta)`);
    procesadas++;
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`Procesadas: ${procesadas}/${busquedas.length}`);
  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
