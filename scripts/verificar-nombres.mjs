#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(rootDir, 'scripts', 'firebase-admin-key.json');
  try { const sa = JSON.parse(readFileSync(keyPath, 'utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) { const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); }
  const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

function extraerNombres(texto) {
  const nombres = [];
  const matches = texto.match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})\b/g);
  if (matches) {
    const comunes = ['La','El','Los','Las','Un','Una','Este','Esta','En','De','Se','Al','Del','Por','Con','Para','Según','Dijo','Informo','Preciso','Confirmo','Declaro','Explico','Detallo','Señalo','Indico','Agrego','Segun','Pero','Sin','Sobre','Entre','Desde','Hasta','Contra','Durante','Tras','Mediante','Hacia','Bajo','Ante','Segun','Cabe','Salvo','Excepto','Incluso','Segun','Tan','Mas','Menos','Muy','Bien','Mal','Ahi','Aqui','Alli','Donde','Cuando','Como','Porque','Pues','Luego','Asi','Tambien','Tampoco','Quizas','Acaso','Talvez','Probablemente','Posiblemente','Evidentemente','Claramente','Obviamente','Naturalmente','Logicamente','Teoricamente','Practicamente','Realmente','Verdaderamente','Efectivamente','Definitivamente','Absolutamente','Totalmente','Completamente','Parcialmente','Relativamente','Aproximadamente','Exactamente','Precisamente','Especificamente','Generalmente','Normalmente','Usualmente','Frecuentemente','Raramente','Nunca','Siempre','Jamás','Aun','Incluso','Hasta','Incluso','Ademas','Mientras','Aunque','Aun','Asi','Pues','Pero','Sino','Osea','Es','Decir','Esto','Eso','Aquello','Algo','Nada','Alguien','Nadie','Quien','Cualquiera','Cualquier','Demasiado','Bastante','Suficiente','Mucho','Poco','Mas','Menos','Casi','Recien',' apenas',' recien','Todavia','Ya','Ahora','Hoy','Ayer','Manana','Antes','Despues','Luego','Pronto','Tar','Temprano','Finalmente','Inicialmente','Primero','Segundo','Tercero','Cuarto','Quinto','Sexto','Septimo','Octavo','Noveno','Decimo','Ultimo','Penultimo','Antepenultimo','Siguiente','Anterior','Posterior','Precedente','Subs','Nicaragua','Managua','Leon','Matagalpa','Jinotega','Esteli','Granada','Carazo','Rivas','Chontales','Boaco','Madriz','Nueva','Segovia','Rio','San','Juan','Sur','Norte','Del','Sur','Oriental','Occidental','Central'];
    matches.forEach(m => {
      const primera = m.split(' ')[0];
      const ultima = m.split(' ').pop();
      // Filtrar: nombre debe tener al menos 2 palabras, no empezar con común, no ser ciudad/departamento solo
      if (!comunes.includes(primera) && m.length > 10 && m.split(' ').length >= 2 && !comunes.includes(ultima)) {
        nombres.push(m);
      }
    });
  }
  return [...new Set(nombres)];
}

function generarBusquedas(nombre, titulo) {
  return {
    google: `https://www.google.com/search?q="${encodeURIComponent(nombre)}"+Nicaragua`,
    tn8: `https://www.tn8.tv/?s=${encodeURIComponent(nombre)}`,
    radioya: `https://radioya.com.ni/?s=${encodeURIComponent(nombre)}`,
    primerisima: `https://primerisima.com.ni/?s=${encodeURIComponent(nombre)}`,
    laprensa: `https://www.laprensani.com/?s=${encodeURIComponent(nombre)}`,
    articulo66: `https://www.articulo66.com/?s=${encodeURIComponent(nombre)}`
  };
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  const reporte = [];

  for (const doc of docs) {
    const contenido = (doc.contenido || '').replace(/<[^>]*>/g, ' ');
    const nombres = extraerNombres(contenido);

    if (nombres.length > 0) {
      reporte.push({
        id: doc.id,
        titulo: doc.titulo || '(sin título)',
        categoria: doc.categoria || '',
        estado: doc.estado || 'sin estado',
        nombres: nombres.map(n => ({
          nombre: n,
          busquedas: generarBusquedas(n, doc.titulo)
        }))
      });
    }
  }

  // Guardar reporte completo
  const outputPath = join(rootDir, 'scripts', 'output', 'nombres-a-verificar.json');
  writeFileSync(outputPath, JSON.stringify(reporte, null, 2));

  // Guardar resumen simple
  const resumen = reporte.map(r => ({
    titulo: r.titulo,
    nombres: r.nombres.map(n => n.nombre)
  }));
  const resumenPath = join(rootDir, 'scripts', 'output', 'nombres-resumen.json');
  writeFileSync(resumenPath, JSON.stringify(resumen, null, 2));

  console.log(`\n📊 REPORTE DE NOMBRES`);
  console.log(`═══════════════════════════════════════`);
  console.log(`Total noticias analizadas: ${docs.length}`);
  console.log(`Noticias con nombres: ${reporte.length}`);
  console.log(`Total nombres extraídos: ${reporte.reduce((sum, r) => sum + r.nombres.length, 0)}`);
  console.log(`\n📁 Archivos generados:`);
  console.log(`  - scripts/output/nombres-a-verificar.json (reporte completo con URLs)`);
  console.log(`  - scripts/output/nombres-resumen.json (solo lista de nombres)`);

  // Mostrar primeras 20 noticias con nombres
  console.log(`\n📋 PRIMERAS 20 NOTICIAS CON NOMBRES:`);
  reporte.slice(0, 20).forEach((r, i) => {
    console.log(`\n${i+1}. ${r.titulo}`);
    console.log(`   Nombres: ${r.nombres.map(n => n.nombre).join(', ')}`);
  });

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
