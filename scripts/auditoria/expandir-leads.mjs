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

function contarPalabras(texto) {
  return texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length;
}

function expandirLead(contenido) {
  const parrafos = contenido.match(/<p>(.*?)<\/p>/gi) || [];
  if (parrafos.length === 0) return contenido;

  const primerParrafo = parrafos[0];
  const textoPrimer = primerParrafo.replace(/<[^>]*>/g, '').trim();
  const palabrasLead = contarPalabras(textoPrimer);

  if (palabrasLead >= 35) return contenido;

  // Buscar el segundo párrafo que tenga información complementaria
  let infoExtra = '';
  for (let i = 1; i < Math.min(parrafos.length, 4); i++) {
    const pTexto = parrafos[i].replace(/<[^>]*>/g, '').trim();
    const pPalabras = contarPalabras(pTexto);
    if (pPalabras > 10 && pPalabras < 80 && !pTexto.match(/^\d{1,2}\s+de\s+/)) {
      infoExtra = pTexto;
      break;
    }
  }

  if (!infoExtra) return contenido;

  // Combinar lead con info extra
  const nuevoLead = `<p>${textoPrimer} ${infoExtra}</p>`;
  const contenidoNuevo = contenido.replace(primerParrafo, nuevoLead);

  return contenidoNuevo;
}

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();

  let arregladas = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const contenido = data.contenido || '';
    const parrafos = contenido.match(/<p>(.*?)<\/p>/gi) || [];
    if (parrafos.length === 0) return;

    const leadTexto = parrafos[0].replace(/<[^>]*>/g, '').trim();
    const leadPalabras = contarPalabras(leadTexto);

    if (leadPalabras < 35) {
      const nuevoContenido = expandirLead(contenido);
      if (nuevoContenido !== contenido) {
        doc.ref.update({
          contenido: nuevoContenido,
          fechaActualizacion: FieldValue.serverTimestamp(),
        });
        arregladas++;
        console.log(`✅ ${(data.titulo || '').slice(0, 50)} — lead: ${leadPalabras} → ${contarPalabras(nuevoContenido.match(/<p>(.*?)<\/p>/gi)[0].replace(/<[^>]*>/g, ''))} palabras`);
      }
    }
  });

  console.log(`\nLeads arregladas: ${arregladas}`);
  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
