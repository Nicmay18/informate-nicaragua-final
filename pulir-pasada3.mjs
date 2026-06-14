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

const PATRONES_QUIRURGICOS = [
  // Frases sueltas de relleno
  /[,;]?\s*lo\s+cual\s+(?:refuerza|confirma|demuestra|evidencia|pone\s+de\s+manifiesto)[^.]*\./gi,
  /[,;]?\s*hecho\s+que\s+(?:refuerza|confirma|demuestra|evidencia)[^.]*\./gi,
  /[,;]?\s*algo\s+que\s+(?:refuerza|confirma|demuestra|evidencia)[^.]*\./gi,
  /[,;]?\s*situaci[óo]n\s+que\s+(?:refuerza|confirma|demuestra|evidencia)[^.]*\./gi,
  /[,;]?\s*contexto\s+que\s+(?:refuerza|confirma|demuestra|evidencia)[^.]*\./gi,
  /\b(?:se\s+(?:trata\s+de|suma\s+a|suman|agrega|agregan|incorpora|incorporan))[^.]{0,80}\./gi,
  /\b(?:en\s+(?:este|ese|aquel)\s+sentido)[,;:.]?\s*/gi,
  /\b(?:por\s+(?:todo\s+lo\s+anterior|lo\s+tanto|ende|consiguiente))[,;:.]?\s*/gi,
  /\b(?:en\s+(?:funci[oó]n|virtud|base)\s+de\s+lo\s+(?:anterior|expuesto|señalado))[,;:.]?\s*/gi,
  /\b(?:como\s+(?:parte\s+de|consecuencia\s+de|resultado\s+de))[^.]{0,100}[,;.]?\s*/gi,
  /\b(?:lo\s+que\s+(?:viene|sigue|resta|falta))[^.]{0,100}[,;.]?\s*/gi,
  /\b(?:a\s+lo\s+largo\s+de)[^.]{0,80}[,;.]?\s*/gi,
  /\b(?:a\s+trav[eé]s\s+de)[^.]{0,80}[,;.]?\s*/gi,
  /\b(?:en\s+(?:medio\s+de|pleno|medio\s+del))[^.]{0,80}[,;.]?\s*/gi,
  /\b(?:ante\s+la\s+(?:magnitud|gravedad|seriedad|complejidad))[^.]{0,100}[,;.]?\s*/gi,
  /\b(?:no\s+(?:es\s+menor|se\s+puede\s+ignorar|se\s+puede\s+pasar\s+por\s+alto))[^.]{0,100}[,;.]?\s*/gi,
  /\b(?:vale\s+la\s+pena\s+(?:destacar|mencionar|recordar|señalar))[^.]{0,100}[,;.]?\s*/gi,
  /\b(?:no\s+est[áa]\s+de\s+m[áa]s\s+(?:destacar|mencionar|recordar|señalar))[^.]{0,100}[,;.]?\s*/gi,
  /\b(?:resulta\s+(?:necesario|indispensable|imprescindible|conveniente))[^.]{0,100}[,;.]?\s*/gi,
  /\b(?:se\s+hace\s+(?:necesario|indispensable|imprescindible|conveniente))[^.]{0,100}[,;.]?\s*/gi,
  /\b(?:las\s+(?:autoridades|fiscal[ií]as|polic[ií]as)\s+(?:correspondientes|competentes|de\s+turno))[,;:.]?\s*/gi,
  /\b(?:la\s+(?:poblaci[óo]n|ciudadan[íi]a)\s+en\s+general)[,;:.]?\s*/gi,
  /\b(?:los\s+ciudadanos\s+en\s+general)[,;:.]?\s*/gi,
  /\b(?:la\s+comunidad\s+en\s+general)[,;:.]?\s*/gi,
  /\b(?:en\s+(?:lo\s+que\s+respecta|lo\s+que\s+hace|lo\s+toca))[^.]{0,80}[,;.]?\s*/gi,
  /\b(?:con\s+relaci[óo]n\s+a)[^.]{0,80}[,;.]?\s*/gi,
  /\b(?:en\s+materia\s+de)[^.]{0,80}[,;.]?\s*/gi,
  /\b(?:en\s+el\s+[áa]mbito\s+de)[^.]{0,80}[,;.]?\s*/gi,
  /\b(?:en\s+el\s+marco\s+de)[^.]{0,80}[,;.]?\s*/gi,
  /\b(?:seg[úu]n\s+lo\s+informado)[,;:.]?\s*/gi,
  /\b(?:como\s+se\s+(?:inform[óo]|report[óo]|señal[óo]|mencion[óo]))[,;:.]?\s*/gi,
  /\b(?:de\s+acuerdo\s+con\s+lo\s+(?:informado|reportado|señalado|mencionado))[,;:.]?\s*/gi,
  /\b(?:a\s+trav[eé]s\s+de\s+un\s+comunicado)[,;:.]?\s*/gi,
  /\b(?:mediante\s+un\s+comunicado)[,;:.]?\s*/gi,
  /\b(?:a\s+trav[eé]s\s+de\s+las\s+redes\s+sociales)[,;:.]?\s*/gi,
  /\b(?:en\s+sus\s+redes\s+sociales)[,;:.]?\s*/gi,
  /\b(?:a\s+trav[eé]s\s+de\s+un\s+bolet[ií]n)[,;:.]?\s*/gi,
  /\b(?:de\s+acuerdo\s+con\s+las\s+autoridades)[,;:.]?\s*/gi,
  /\b(?:seg[úu]n\s+las\s+autoridades)[,;:.]?\s*/gi,
  /\b(?:seg[úu]n\s+versiones\s+preliminares)[,;:.]?\s*/gi,
  /\b(?:de\s+acuerdo\s+con\s+versiones\s+preliminares)[,;:.]?\s*/gi,
  /\b(?:seg[úu]n\s+informaci[óo]n\s+preliminar)[,;:.]?\s*/gi,
  /\b(?:de\s+acuerdo\s+con\s+informaci[óo]n\s+preliminar)[,;:.]?\s*/gi,
  /\b(?:hasta\s+el\s+momento|hasta\s+ahora|a\s+la\s+fecha|al\s+cierre)[,;:.]?\s*/gi,
  /\b(?:las\s+investigaciones\s+contin[úu]an|las\s+indagaciones\s+contin[úu]an)[,;:.]?\s*/gi,
  /\b(?:el\s+caso\s+sigue\s+abierto|la\s+investigaci[óo]n\s+sigue\s+abierta)[,;:.]?\s*/gi,
  /\b(?:los\s+familiares\s+(?:piden|solicitan|exigen))[^.]{0,150}[,;.]?\s*/gi,
  /\b(?:las\s+autoridades\s+(?:hicieron|emitieron|realizaron)\s+un\s+(?:llamado|comunicado|exhorto))[^.]{0,200}[,;.]?\s*/gi,
  /\b(?:se\s+exhorta\s+a\s+la\s+poblaci[óo]n)[^.]{0,200}[,;.]?\s*/gi,
  /\b(?:se\s+pide\s+a\s+los\s+ciudadanos)[^.]{0,200}[,;.]?\s*/gi,
  /\b(?:esperamos\s+que\s+esta\s+situaci[óo]n)[^.]{0,200}[,;.]?\s*/gi,
  /\b(?:confiamos\s+en\s+que\s+esta\s+situaci[óo]n)[^.]{0,200}[,;.]?\s*/gi,
  /\b(?:esperamos\s+que\s+este\s+caso)[^.]{0,200}[,;.]?\s*/gi,
  /\b(?:la\s+comunidad\s+local|los\s+habitantes\s+del\s+sector|los\s+vecinos\s+de\s+la\s+zona)[,;:.]?\s*/gi,
  /\b(?:en\s+lo\s+sucesivo|de\s+ahora\s+en\s+adelante)[,;:.]?\s*/gi,
  /\b(?:de\s+manera\s+similar|de\s+forma\s+an[áa]loga|de\s+modo\s+semejante)[,;:.]?\s*/gi,
  /\b(?:en\s+igual\s+sentido|en\s+el\s+mismo\s+sentido)[,;:.]?\s*/gi,
  /\b(?:tanto\s+es\s+as[íi]|tanto\s+es\s+el\s+caso|hecho\s+est[áa])[,;:.]?\s*/gi,
  /\b(?:en\s+consecuencia\s+directa|como\s+consecuencia\s+directa)[,;:.]?\s*/gi,
  /\b(?:directamente\s+relacionado\s+con)[^.]{0,80}[,;.]?\s*/gi,
  /\b(?:por\s+lo\s+que\s+hace\s+a|en\s+lo\s+tocante\s+a|en\s+lo\s+atinente\s+a)[,;:.]?\s*/gi,
  /\b(?:no\s+cabe\s+la\s+menor\s+duda|no\s+existe\s+duda|es\s+incuestionable)[,;:.]?\s*/gi,
  /\b(?:en\s+(?:este|ese|aquel)\s+contexto)[,;:.]?\s*/gi,
  /\b(?:en\s+(?:este|ese|aquel)\s+marco)[,;:.]?\s*/gi,
  /\b(?:en\s+(?:este|ese|aquel)\s+escenario)[,;:.]?\s*/gi,
  /\b(?:en\s+(?:esta|esa|aquella)\s+l[ií]nea)[,;:.]?\s*/gi,
  /\b(?:en\s+(?:este|ese|aquel)\s+orden\s+de\s+ideas)[,;:.]?\s*/gi,
  /\b(?:frente\s+a\s+(?:esta|esa|aquella)\s+situaci[óo]n)[,;:.]?\s*/gi,
  /\b(?:ante\s+(?:esta|esa|aquella)\s+situaci[óo]n)[,;:.]?\s*/gi,
  /\b(?:ante\s+(?:estos|esos|aquellos)\s+hechos)[,;:.]?\s*/gi,
  /\b(?:frente\s+a\s+(?:estos|esos|aquellos)\s+hechos)[,;:.]?\s*/gi,
  /\b(?:como\s+parte\s+de\s+las\s+investigaciones)[,;:.]?\s*/gi,
  /\b(?:en\s+el\s+marco\s+de\s+las\s+investigaciones)[,;:.]?\s*/gi,
  /\b(?:dentro\s+de\s+las\s+investigaciones)[,;:.]?\s*/gi,
  /\b(?:como\s+resultado\s+de\s+las\s+investigaciones)[,;:.]?\s*/gi,
  /\b(?:a\s+ra[ií]z\s+de\s+las\s+investigaciones)[,;:.]?\s*/gi,
  /\b(?:producto\s+de\s+las\s+investigaciones)[,;:.]?\s*/gi,
];

const LEYES_AGRESIVO = [
  /\b(?:el|la)\s+(?:C[oó]digo\s+(?:Penal|Civil|de\s+Familia|Procesal\s+Penal|Laboral))\s*[^.]{0,250}\.(?:\s*<\/p>)?/gi,
  /\b(?:el|la)\s+Ley\s+\d{1,4}\s*[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:el|la)\s+Decreto\s+\d{1,4}\s*[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:el\s+art[ií]culo)\s+\d{1,3}\s*[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:seg[úu]n\s+(?:el|la)\s+(?:C[oó]digo|Ley|Decreto))\s*[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:conforme\s+(?:al|a\s+la)\s+(?:C[oó]digo|Ley|Decreto))\s*[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:de\s+acuerdo\s+(?:al|a\s+la)\s+(?:C[oó]digo|Ley|Decreto))\s*[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:la\s+(?:normativa|legislaci[óo]n)\s+(?:vigente|aplicable|correspondiente|penal|legal|jur[ií]dica))\s*[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:el\s+(?:marco\s+legal|ordenamiento\s+jur[ií]dico))\s*[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:en\s+(?:el\s+marco\s+legal|el\s+ordenamiento\s+jur[ií]dico))\s*[^.]{0,200}\.(?:\s*<\/p>)?/gi,
];

function limpiarAgresivo(contenido) {
  let limpio = contenido;
  let total = 0;
  for (const regex of PATRONES_QUIRURGICOS) {
    const antes = limpio;
    limpio = limpio.replace(regex, '');
    if (limpio !== antes) total++;
  }
  for (const regex of LEYES_AGRESIVO) {
    const antes = limpio;
    limpio = limpio.replace(regex, '');
    if (limpio !== antes) total++;
  }
  // Limpiar dobles espacios y espacios antes/después de etiquetas
  limpio = limpio.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim();
  // Eliminar párrafos vacíos
  limpio = limpio.replace(/<p>\s*<\/p>/gi, '').replace(/<p>&nbsp;<\/p>/gi, '');
  return { contenido: limpio, reemplazos: total };
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  let modificadas = 0;
  const detalles = [];

  for (const doc of docs) {
    const contenido = doc.contenido || '';
    const resultado = limpiarAgresivo(contenido);
    if (resultado.reemplazos > 0) {
      await db.collection('noticias').doc(doc.id).update({
        contenido: resultado.contenido,
        pasada3Forense: true,
        fechaPasada3: new Date().toISOString(),
      });
      modificadas++;
      detalles.push({ titulo: doc.titulo, reemplazos: resultado.reemplazos });
    }
  }

  console.log(`\n🧹 PASADA 3 FORENSE (QUIRÚRGICA)`);
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`Noticias modificadas: ${modificadas}`);
  console.log(`═══════════════════════════════════════════════════`);

  if (detalles.length > 0) {
    console.log(`\nPrimeras 20:`);
    detalles.slice(0, 20).forEach((d, i) => {
      console.log(`${i+1}. ${d.titulo} (${d.reemplazos} reemplazos)`);
    });
  }

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
