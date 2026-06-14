#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;

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

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`DIAGNOSTICO DE NOTICIAS CON POSIBLES DATOS CRUZADOS`);
  console.log(`═══════════════════════════════════════════════════════════════\n`);

  const problemas = [];

  for (const doc of docs) {
    const contenido = doc.contenido || '';
    const palabras = contenido.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length;
    const titulo = doc.titulo || '(sin título)';
    const slug = doc.slug || '(sin slug)';
    const imagen = doc.imagen || '(sin imagen)';
    const categoria = doc.categoria || '(sin categoría)';

    // Detectar posibles problemas
    const esCorta = palabras < 350;
    const esMuyCorta = palabras < 300;
    const tieneImagen = !!doc.imagen;
    
    // Intentar detectar cruce: si el titulo habla de moto/accidente y la imagen de barco/oleaje
    const tituloLower = titulo.toLowerCase();
    const imagenLower = imagen.toLowerCase();
    const contenidoLower = contenido.toLowerCase();
    
    const temasTitulo = {
      moto: /motocicleta|moto|accidente.*tránsito|accidente.*transito|fallece|fallecido/i.test(tituloLower),
      barco: /barco|embarcaci|oleaje|san juan del sur|playa|puerto/i.test(tituloLower),
      incendio: /incendio|fuego|quema/i.test(tituloLower),
    };
    
    const temasImagen = {
      moto: /moto|accidente|carretera/i.test(imagenLower),
      barco: /barco|embarcaci|oleaje|playa|puerto/i.test(imagenLower),
      incendio: /incendio|fuego|bombero/i.test(imagenLower),
    };
    
    // Detectar cruce sospechoso
    let cruceSospechoso = false;
    if (temasTitulo.moto && temasImagen.barco) cruceSospechoso = true;
    if (temasTitulo.barco && temasImagen.moto) cruceSospechoso = true;
    if (temasTitulo.incendio && temasImagen.barco) cruceSospechoso = true;
    if (temasTitulo.incendio && temasImagen.moto) cruceSospechoso = true;

    // Detectar contenido duplicado o secciones repetidas
    const hechosRepetidos = (contenidoLower.match(/hechos principales/g) || []).length > 1;
    const declaracionesRepetidas = (contenidoLower.match(/declaraciones de fuentes/g) || []).length > 1;
    
    if (esMuyCorta || cruceSospechoso || hechosRepetidos || declaracionesRepetidas) {
      problemas.push({
        id: doc.id,
        titulo,
        slug,
        palabras,
        categoria,
        imagen: imagen.substring(0, 80),
        esCorta,
        esMuyCorta,
        cruceSospechoso,
        hechosRepetidos,
        declaracionesRepetidas,
      });
    }
  }

  // Ordenar por peligrosidad
  problemas.sort((a, b) => {
    const scoreA = (a.cruceSospechoso ? 10 : 0) + (a.esMuyCorta ? 5 : 0) + (a.hechosRepetidos ? 3 : 0);
    const scoreB = (b.cruceSospechoso ? 10 : 0) + (b.esMuyCorta ? 5 : 0) + (b.hechosRepetidos ? 3 : 0);
    return scoreB - scoreA;
  });

  console.log(`Total noticias revisadas: ${docs.length}`);
  console.log(`Noticias con problemas detectados: ${problemas.length}\n`);

  for (const p of problemas) {
    const flags = [];
    if (p.cruceSospechoso) flags.push('🔴 IMAGEN CRUZADA');
    if (p.esMuyCorta) flags.push(`🟠 CORTA (${p.palabras} palabras)`);
    if (p.hechosRepetidos) flags.push('🟡 Sección "Hechos principales" duplicada');
    if (p.declaracionesRepetidas) flags.push('🟡 Sección "Declaraciones" duplicada');
    
    console.log(`ID: ${p.id}`);
    console.log(`Slug: ${p.slug}`);
    console.log(`Título: ${p.titulo}`);
    console.log(`Palabras: ${p.palabras}`);
    console.log(`Imagen: ${p.imagen}`);
    console.log(`Problemas: ${flags.join(' | ')}`);
    console.log(`───────────────────────────────────────────────────────────────`);
  }

  if (problemas.length === 0) {
    console.log('✅ No se detectaron noticias con datos cruzados.');
  } else {
    console.log(`\n⚠️ Para BORRAR las noticias problemáticas, ejecutá:`);
    console.log(`   node borrar-noticias-problema.mjs`);
    console.log(`\n   O decime cuáles querés borrar por ID.`);
  }
  
  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
