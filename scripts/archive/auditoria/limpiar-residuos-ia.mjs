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

const REEMPLAZOS = [
  { regex: /\ben\s+el\s+contexto\s+de\b/gi, reemplazo: 'durante' },
  { regex: /\bpor\s+su\s+parte\b/gi, reemplazo: 'además' },
  { regex: /\ben\s+ese\s+sentido\b/gi, reemplazo: 'sobre el tema' },
  { regex: /\bdesde\s+esta\s+perspectiva\b/gi, reemplazo: 'según el informe' },
  { regex: /\bresulta\s+fundamental\b/gi, reemplazo: 'es necesario' },
  { regex: /\bno\s+cabe\s+duda\b/gi, reemplazo: 'los datos muestran' },
  { regex: /\bresulta\s+evidente\b/gi, reemplazo: 'se observa' },
  { regex: /\bes\s+indiscutible\b/gi, reemplazo: 'el registro indica' },
  { regex: /\bvale\s+la\s+pena\s+mencionar\b/gi, reemplazo: '' },
  { regex: /\bes\s+importante\s+destacar\b/gi, reemplazo: '' },
  { regex: /\bno\s+hay\s+que\s+olvidar\b/gi, reemplazo: '' },
  { regex: /\ben\s+[úu]ltima\s+instancia\b/gi, reemplazo: 'finalmente' },
  { regex: /\ba\s+fin\s+de\s+cuentas\b/gi, reemplazo: 'en total' },
  { regex: /\ben\s+el\s+marco\s+de\b/gi, reemplazo: 'en' },
  { regex: /\bresulta\s+innegable\b/gi, reemplazo: 'se constata' },
  { regex: /\bcabe\s+se[ñn]alar\b/gi, reemplazo: '' },
  { regex: /\bes\s+relevante\s+destacar\b/gi, reemplazo: '' },
  { regex: /\bconviene\s+destacar\b/gi, reemplazo: '' },
  { regex: /\bes\s+preciso\s+indicar\b/gi, reemplazo: '' },
  { regex: /\bpara\s+finalizar\b/gi, reemplazo: '' },
  { regex: /\ben\s+definitiva\b/gi, reemplazo: '' },
  { regex: /\ben\s+s[ií]ntesis\b/gi, reemplazo: '' },
  { regex: /\bpor\s+otro\s+lado\b/gi, reemplazo: 'también' },
  { regex: /\bde\s+igual\s+manera\b/gi, reemplazo: 'igualmente' },
  { regex: /\basimismo\b/gi, reemplazo: 'también' },
  { regex: /\bde\s+la\s+misma\s+forma\b/gi, reemplazo: 'de igual modo' },
  { regex: /\ben\s+conclusi[oó]n\b/gi, reemplazo: '' },
  { regex: /\ben\s+resumen\b/gi, reemplazo: '' },
  { regex: /\bcomo\s+parte\s+de\b/gi, reemplazo: 'como parte del' },
  { regex: /\bfrente\s+a\s+esta\s+situaci[oó]n\b/gi, reemplazo: 'ante esta situación' },
  { regex: /\bante\s+esta\s+situaci[oó]n[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bante\s+estos\s+hechos[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bcomo\s+resultado\s+de\b/gi, reemplazo: 'por' },
  { regex: /\bproducto\s+de\b/gi, reemplazo: 'por' },
  { regex: /\ba\s+ra[ií]z\s+de\b/gi, reemplazo: 'tras' },
  { regex: /\ben\s+funci[oó]n\s+de\b/gi, reemplazo: 'según' },
  { regex: /\bcon\s+base\s+en\b/gi, reemplazo: 'según' },
  { regex: /\bcon\s+relaci[oó]n\s+a\b/gi, reemplazo: 'sobre' },
  { regex: /\bpor\s+lo\s+que\s+hace\s+a\b/gi, reemplazo: 'sobre' },
  { regex: /\ben\s+lo\s+que\s+respecta\s+a\b/gi, reemplazo: 'sobre' },
  { regex: /\ben\s+cuanto\s+a\b/gi, reemplazo: 'sobre' },
  { regex: /\ben\s+materia\s+de\b/gi, reemplazo: 'en' },
  { regex: /\ben\s+el\s+[áa]mbito\s+de\b/gi, reemplazo: 'en' },
  { regex: /\bteniendo\s+en\s+cuenta\b/gi, reemplazo: 'considerando' },
  { regex: /\bdado\s+que\b/gi, reemplazo: 'ya que' },
  { regex: /\bdebido\s+a\s+que\b/gi, reemplazo: 'ya que' },
  { regex: /\bpor\s+consiguiente\b/gi, reemplazo: 'por tanto' },
  { regex: /\bes\s+por\s+ello\s+que\b/gi, reemplazo: 'por eso' },
  { regex: /\bpor\s+esta\s+raz[oó]n\b/gi, reemplazo: 'por eso' },
  { regex: /\bno\s+obstante\b/gi, reemplazo: 'sin embargo' },
  { regex: /\bpese\s+a\b/gi, reemplazo: 'a pesar de' },
  { regex: /\ba[úu]n\s+cuando\b/gi, reemplazo: 'aunque' },
  { regex: /\ben\s+tanto\s+que\b/gi, reemplazo: 'mientras' },
  { regex: /\bmientras\s+que\b/gi, reemplazo: 'mientras' },
  { regex: /\bde\s+no\s+ser\s+as[íi]\b/gi, reemplazo: 'de lo contrario' },
  { regex: /\bde\s+lo\s+contrario\b/gi, reemplazo: 'si no' },
  { regex: /\bes\s+de\s+esperarse\s+que\b/gi, reemplazo: 'se espera que' },
  { regex: /\bhasta\s+el\s+momento\b/gi, reemplazo: 'hasta ahora' },
  { regex: /\bhasta\s+la\s+fecha\b/gi, reemplazo: 'hasta ahora' },
  { regex: /\bal\s+cierre\s+de\s+esta\s+edici[oó]n\b/gi, reemplazo: 'hasta ahora' },
  { regex: /\bconsultado\s+al\s+respecto\b/gi, reemplazo: '' },
  { regex: /\bal\s+ser\s+consultado\b/gi, reemplazo: '' },
  { regex: /\bante\s+la\s+consulta\b/gi, reemplazo: '' },
  { regex: /\blas\s+investigaciones\s+contin[úu]an\b/gi, reemplazo: '' },
  { regex: /\blas\s+indagaciones\s+contin[úu]an\b/gi, reemplazo: '' },
  { regex: /\bel\s+caso\s+sigue\s+abierto\b/gi, reemplazo: '' },
  { regex: /\bla\s+investigaci[oó]n\s+sigue\s+abierta\b/gi, reemplazo: '' },
  { regex: /\blos\s+familiares\s+piden[^.]{0,150}\./gi, reemplazo: '' },
  { regex: /\blos\s+deudos\s+solicitan[^.]{0,150}\./gi, reemplazo: '' },
  { regex: /\blos\s+allegados\s+exigen[^.]{0,150}\./gi, reemplazo: '' },
  { regex: /\blas\s+autoridades\s+hicieron\s+un\s+llamado[^.]{0,200}\./gi, reemplazo: '' },
  { regex: /\blas\s+autoridades\s+emitieron\s+un\s+comunicado[^.]{0,200}\./gi, reemplazo: '' },
  { regex: /\bse\s+exhorta\s+a\s+la\s+poblaci[oó]n[^.]{0,200}\./gi, reemplazo: '' },
  { regex: /\bse\s+pide\s+a\s+los\s+ciudadanos[^.]{0,200}\./gi, reemplazo: '' },
  { regex: /\besperamos\s+que\s+esta\s+situaci[oó]n[^.]{0,200}\./gi, reemplazo: '' },
  { regex: /\bconfiamos\s+en\s+que\s+esta\s+situaci[oó]n[^.]{0,200}\./gi, reemplazo: '' },
  { regex: /\besperamos\s+que\s+este\s+caso[^.]{0,200}\./gi, reemplazo: '' },
  { regex: /\bla\s+comunidad\s+local[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\blos\s+habitantes\s+del\s+sector[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\blos\s+vecinos\s+de\s+la\s+zona[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+lo\s+sucesivo[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bde\s+ahora\s+en\s+adelante[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bde\s+manera\s+similar[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bde\s+forma\s+an[áa]loga[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bde\s+modo\s+semejante[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+igual\s+sentido[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+el\s+mismo\s+sentido[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\btanto\s+es\s+as[íi][,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\btanto\s+es\s+el\s+caso[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bhecho\s+est[áa][,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+consecuencia\s+directa[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bcomo\s+consecuencia\s+directa[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bdirectamente\s+relacionado\s+con[^.]{0,80}[,;.]?\s*/gi, reemplazo: '' },
  { regex: /\bpor\s+lo\s+que\s+hace\s+a[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+lo\s+tocante\s+a[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+lo\s+atinente\s+a[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bno\s+cabe\s+la\s+menor\s+duda[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bno\s+existe\s+duda[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bes\s+incuestionable[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+este\s+contexto[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+ese\s+contexto[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+aquel\s+contexto[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+este\s+marco[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+ese\s+marco[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+aquel\s+marco[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+este\s+escenario[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+ese\s+escenario[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+aquel\s+escenario[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+esta\s+l[ií]nea[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+esa\s+l[ií]nea[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+aquella\s+l[ií]nea[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+este\s+orden\s+de\s+ideas[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+ese\s+orden\s+de\s+ideas[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+aquel\s+orden\s+de\s+ideas[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bfrente\s+a\s+esta\s+situaci[oó]n[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bfrente\s+a\s+esa\s+situaci[oó]n[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bfrente\s+a\s+aquella\s+situaci[oó]n[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bfrente\s+a\sestos\s+hechos[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bfrente\s+a\sesos\s+hechos[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bfrente\s+a\saquellos\s+hechos[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bcomo\s+parte\s+de\s+las\s+investigaciones[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ben\s+el\s+marco\s+de\s+las\s+investigaciones[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bdentro\s+de\s+las\s+investigaciones[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bcomo\s+resultado\s+de\s+las\s+investigaciones[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\ba\s+ra[ií]z\s+de\s+las\s+investigaciones[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\bproducto\s+de\s+las\s+investigaciones[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /\blo\s+cual\s+refuerza[^.]{0,100}\./gi, reemplazo: '' },
  { regex: /\blo\s+cual\s+confirma[^.]{0,100}\./gi, reemplazo: '' },
  { regex: /\blo\s+cual\s+demuestra[^.]{0,100}\./gi, reemplazo: '' },
  { regex: /\blo\s+cual\s+evidencia[^.]{0,100}\./gi, reemplazo: '' },
  { regex: /\bhecho\s+que\s+refuerza[^.]{0,100}\./gi, reemplazo: '' },
  { regex: /\bhecho\s+que\s+confirma[^.]{0,100}\./gi, reemplazo: '' },
  { regex: /\bhecho\s+que\s+demuestra[^.]{0,100}\./gi, reemplazo: '' },
  { regex: /\balgo\s+que\s+refuerza[^.]{0,100}\./gi, reemplazo: '' },
  { regex: /\bsituaci[oó]n\s+que\s+refuerza[^.]{0,100}\./gi, reemplazo: '' },
  { regex: /\bcontexto\s+que\s+refuerza[^.]{0,100}\./gi, reemplazo: '' },
  { regex: /\bse\s+trata\s+de\s+un\s+caso[^.]{0,80}\./gi, reemplazo: '' },
  { regex: /\bse\s+trata\s+de\s+una\s+situaci[oó]n[^.]{0,80}\./gi, reemplazo: '' },
  { regex: /\bse\s+trata\s+de\s+un\s+hecho[^.]{0,80}\./gi, reemplazo: '' },
];

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  let modificadas = 0;
  let totalResiduos = 0;
  const detalles = [];

  for (const doc of docs) {
    let contenido = doc.contenido || '';
    let cambios = 0;

    for (const { regex, reemplazo } of REEMPLAZOS) {
      const matches = contenido.match(regex);
      if (matches) {
        contenido = contenido.replace(regex, reemplazo);
        cambios += matches.length;
      }
    }

    // Limpiar espacios
    contenido = contenido.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><');
    contenido = contenido.replace(/<p>\s*<\/p>/gi, '').replace(/<p>&nbsp;<\/p>/gi, '');

    if (cambios > 0) {
      await db.collection('noticias').doc(doc.id).update({
        contenido,
        residuosIaLimpios: true,
        fechaResiduosLimpios: new Date().toISOString(),
      });
      modificadas++;
      totalResiduos += cambios;
      detalles.push({ titulo: doc.titulo, cambios });
    }
  }

  console.log(`\n🧹 LIMPIEZA DE RESIDUOS IA`);
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`Noticias modificadas: ${modificadas}`);
  console.log(`Total residuos eliminados: ${totalResiduos}`);
  console.log(`═══════════════════════════════════════════════════`);

  if (detalles.length > 0) {
    console.log(`\nPrimeras 20:`);
    detalles.slice(0, 20).forEach((d, i) => {
      console.log(`${i+1}. ${d.titulo} (${d.cambios} residuos)`);
    });
  }

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
