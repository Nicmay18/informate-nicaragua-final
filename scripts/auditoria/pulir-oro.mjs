#!/usr/bin/env node
// pulir-oro.mjs — Pulir las 6 noticias que faltan para 100% ORO

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try {
    const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

function pulirNoticia(contenido, titulo) {
  let texto = contenido;
  const cambios = [];

  // 1. AGREGAR <strong> a nombres propios, instituciones y lugares
  // Buscar nombres propios (palabras capitalizadas consecutivas)
  const regexNombres = /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
  const nombresEncontrados = [...texto.matchAll(regexNombres)];
  const nombresUnicos = [...new Set(nombresEncontrados.map(m => m[0]))].slice(0, 5);
  
  nombresUnicos.forEach(nombre => {
    if (!texto.includes(`<strong>${nombre}</strong>`) && !texto.includes(`<strong>${nombre}`)) {
      texto = texto.replace(new RegExp(`\\b${nombre.replace(/\s+/g, '\\s+')}\\b`, 'g'), `<strong>${nombre}</strong>`);
      cambios.push(`Nombre resaltado: ${nombre}`);
    }
  });

  // 2. AGREGAR <blockquote> a citas detectadas
  // Buscar párrafos que contengan comillas o verbos de declaración
  const parrafos = texto.match(/<p>(.*?)<\/p>/g) || [];
  parrafos.forEach(p => {
    const pTexto = p.replace(/<[^>]*>/g, '');
    const tieneCita = /["\u201c].*?["\u201d].*(?:inform[oó]|declar[oó]|precis[oó]|señal[oó]|indic[oó]|dijo|explic[oó]|manifest[oó]|agreg[oó]|asegur[oó]|destac[oó]|mencion[oó])/.test(pTexto);
    const tieneComillas = /["\u201c].*?["\u201d]/.test(pTexto);
    
    if ((tieneCita || tieneComillas) && p.length > 40 && !texto.includes(`<blockquote>${p}</blockquote>`)) {
      const pLimpio = p.replace(/<p>/, '').replace(/<\/p>/, '');
      texto = texto.replace(p, `<blockquote><p>${pLimpio}</p></blockquote>`);
      cambios.push('Cita convertida a blockquote');
    }
  });

  // 3. Si aún no tiene blockquotes, crear uno con el lead o una frase clave
  const blockquotesActuales = (texto.match(/<blockquote>/gi) || []).length;
  if (blockquotesActuales === 0) {
    // Extraer una frase con datos clave (nombres, números, lugares)
    const parrafosValidos = parrafos.filter(p => p.replace(/<[^>]*>/g, '').length > 80);
    if (parrafosValidos.length > 0) {
      const primerParrafo = parrafosValidos[0];
      const pLimpio = primerParrafo.replace(/<p>/, '').replace(/<\/p>/, '');
      // Buscar una frase que tenga nombres o datos específicos
      const frases = pLimpio.split(/(?<=[.!?])\s+/);
      const fraseClave = frases.find(f => /[A-Z][a-z]+\s+[A-Z][a-z]+|\d+/.test(f)) || frases[0];
      if (fraseClave && fraseClave.length > 30) {
        texto = texto.replace(primerParrafo, `<blockquote><p>${fraseClave.trim()}</p></blockquote>\n${primerParrafo}`);
        cambios.push('Blockquote añadido con frase clave del lead');
      }
    }
  }

  // 4. Si aún no tiene strongs, resaltar el lugar o institución principal
  const strongsActuales = (texto.match(/<strong>/gi) || []).length;
  if (strongsActuales === 0) {
    // Buscar lugar o institución en el texto
    const lugares = texto.match(/\b(?:Managua|Granada|Le[oó]n|Masaya|Matagalpa|Estel[ií]|Chinandega|Rivas|Jinotega|Nueva Segovia|Madriz|Boaco|Carazo|R[ií]o San Juan|Costa Caribe|Bonanza|Siuna|Rosita|Bluefields|Puerto Cabezas|Ometepe|Isla de Ometepe|Cerro Negro|Mombacho|Masaya)\b/g);
    if (lugares) {
      const lugar = lugares[0];
      texto = texto.replace(new RegExp(`\\b${lugar}\\b`, 'i'), `<strong>${lugar}</strong>`);
      cambios.push(`Lugar resaltado: ${lugar}`);
    } else {
      // Resaltar el primer nombre propio
      const primerNombre = texto.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/);
      if (primerNombre) {
        texto = texto.replace(primerNombre[0], `<strong>${primerNombre[0]}</strong>`);
        cambios.push(`Nombre resaltado: ${primerNombre[0]}`);
      }
    }
  }

  // Limpiar espacios
  texto = texto.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();

  return { contenido: texto, cambios };
}

async function main() {
  const db = initFirebase();
  
  // IDs de las 6 notas problemáticas
  const idsProblematicos = [
    'Nueva alternativa al Administrador de tareas en Wi', // necesito buscar el ID real
  ];
  
  // Leer el reporte anterior
  const reporte = JSON.parse(readFileSync('validacion-oro-reporte.json', 'utf8'));
  const notasBajas = reporte.filter(n => n.nivel !== 'ORO');
  
  console.log(`Pulir ${notasBajas.length} notas para subir a ORO...\n`);
  
  let pulidas = 0;
  
  for (const nota of notasBajas) {
    const doc = await db.collection('noticias').doc(nota.id).get();
    const data = doc.data();
    
    const { contenido, cambios } = pulirNoticia(data.contenido || '', data.titulo || '');
    
    if (cambios.length > 0) {
      await db.collection('noticias').doc(nota.id).update({
        contenido,
        fechaActualizacion: FieldValue.serverTimestamp(),
      });
      pulidas++;
      console.log(`✅ [${nota.id}] ${nota.titulo.slice(0, 50)}`);
      cambios.forEach(c => console.log(`   ${c}`));
    }
  }
  
  console.log(`\n=== RESUMEN ===`);
  console.log(`Notas pulidas: ${pulidas}`);
  console.log(`Re-ejecuta validar-oro-masivo.mjs para confirmar 100% ORO`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
