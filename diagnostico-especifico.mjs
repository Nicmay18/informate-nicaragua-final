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

// Patrones del analizador
const PATRONES_IA_DETECCION = [
  /en\s+conclusi[oó]n/gi, /en\s+resumen/gi, /es\s+importante\s+destacar/gi, /vale\s+la\s+pena\s+mencionar/gi,
  /es\s+vital/gi, /resulta\s+fundamental/gi, /es\s+indiscutible/gi, /no\s+cabe\s+duda/gi,
  /resulta\s+evidente/gi, /resulta\s+innegable/gi, /de\s+esta\s+manera/gi, /de\s+esta\s+forma/gi,
  /de\s+este\s+modo/gi, /por\s+esta\s+v[ií]a/gi, /en\s+esta\s+l[ií]nea/gi, /en\s+este\s+marco/gi,
  /en\s+este\s+contexto/gi, /en\s+este\s+escenario/gi, /no\s+obstante\s+lo\s+anterior/gi,
  /pese\s+a\s+lo\s+anterior/gi, /m[áa]s\s+all[áa]\s+de\s+lo\s+anterior/gi, /adem[áa]s\s+de\s+lo\s+expuesto/gi,
  /junto\s+a\s+lo\s+anterior/gi, /tal\s+como\s+se\s+mencion[oó]/gi, /como\s+se\s+señal[oó]/gi,
  /seg[úu]n\s+lo\s+expuesto/gi, /es\s+importante\s+recordar/gi, /conviene\s+recordar/gi,
  /cabe\s+recordar/gi, /no\s+hay\s+que\s+olvidar/gi, /no\s+debemos\s+olvidar/gi,
  /no\s+se\s+debe\s+olvidar/gi, /por\s+[úu]ltimo/gi, /finalmente\s*,/gi, /para\s+terminar/gi,
  /para\s+empezar/gi, /en\s+primer\s+lugar/gi, /en\s+primera\s+instancia/gi, /como\s+punto\s+de\s+partida/gi,
  /en\s+segundo\s+lugar/gi, /en\s+tercer\s+lugar/gi, /por\s+otro\s+lado/gi, /adem[áa]s\s*,/gi,
  /tambi[eé]n\s+es\s+cierto/gi, /igualmente\s+es\s+cierto/gi, /asimismo\s+es\s+cierto/gi,
  /en\s+palabras\s+m[áa]s\s+sencillas/gi, /dicho\s+de\s+otra\s+forma/gi, /para\s+decirlo\s+de\s+otro\s+modo/gi,
  /queda\s+claro\s+que/gi, /queda\s+evidenciado\s+que/gi, /queda\s+demostrado\s+que/gi,
  /queda\s+confirmado\s+que/gi, /se\s+hace\s+evidente\s+que/gi, /se\s+hace\s+patente\s+que/gi,
  /se\s+hace\s+manifiesto\s+que/gi, /es\s+un\s+hecho\s+que/gi, /es\s+un\s+dato\s+que/gi,
  /es\s+una\s+realidad\s+que/gi, /las\s+cifras\s+muestran\s+que/gi, /los\s+datos\s+indican\s+que/gi,
  /las\s+estad[ií]sticas\s+revelan\s+que/gi, /se\s+estima\s+que\s+m[áa]s\s+del/gi,
  /se\s+calcula\s+que\s+aproximadamente\s+el/gi, /se\s+proyecta\s+que\s+cerca\s+del/gi,
  /una\s+de\s+las\s+principales\s+causas/gi, /uno\s+de\s+los\s+principales\s+factores/gi,
  /una\s+de\s+las\s+razones\s+principales/gi, /est[áa]\s+claro\s+que/gi, /resulta\s+obvio\s+que/gi,
  /es\s+obvio\s+que/gi, /es\s+evidente\s+que/gi, /no\s+es\s+menor\s+señalar/gi,
  /no\s+es\s+menor\s+destacar/gi, /no\s+es\s+menor\s+mencionar/gi, /es\s+preciso\s+señalar/gi,
  /es\s+necesario\s+señalar/gi, /es\s+menester\s+señalar/gi, /hay\s+que\s+tener\s+en\s+cuenta/gi,
  /debe\s+tenerse\s+en\s+cuenta/gi, /es\s+preciso\s+tener\s+en\s+cuenta/gi,
  /ante\s+la\s+magnitud\s+de\s+los\s+hechos/gi, /frente\s+a\s+la\s+gravedad\s+de\s+la\s+situaci[óo]n/gi,
  /dada\s+la\s+gravedad\s+del\s+caso/gi, /las\s+autoridades\s+competentes/gi,
  /las\s+autoridades\s+correspondientes/gi, /las\s+autoridades\s+de\s+turno/gi,
  /la\s+poblaci[óo]n\s+en\s+general/gi, /los\s+ciudadanos\s+en\s+general/gi,
  /la\s+ciudadan[íi]a\s+en\s+general/gi, /en\s+materia\s+de/gi, /en\s+el\s+[áa]mbito\s+de/gi,
  /en\s+el\s+terreno\s+de/gi, /en\s+el\s+campo\s+de/gi, /todo\s+parece\s+indicar\s+que/gi,
  /todo\s+apunta\s+a\s+que/gi, /todo\s+indica\s+que/gi, /seg[úu]n\s+lo\s+informado/gi,
  /como\s+se\s+inform[óo]/gi, /de\s+acuerdo\s+con\s+lo\s+reportado/gi, /de\s+manera\s+que/gi,
  /de\s+forma\s+que/gi, /de\s+tal\s+manera\s+que/gi, /de\s+tal\s+forma\s+que/gi,
  /en\s+la\s+medida\s+en\s+que/gi, /en\s+la\s+medida\s+de\s+lo\s+posible/gi,
  /hasta\s+donde\s+sea\s+posible/gi, /tal\s+y\s+como\s+se\s+esperaba/gi,
  /como\s+era\s+de\s+esperarse/gi, /como\s+se\s+preve[íi]a/gi, /en\s+lo\s+que\s+respecta\s+a/gi,
  /en\s+cuanto\s+a/gi, /por\s+lo\s+que\s+respecta\s+a/gi, /en\s+lo\s+concerniente\s+a/gi,
  /en\s+lo\s+relativo\s+a/gi, /en\s+lo\s+referente\s+a/gi, /sobre\s+la\s+base\s+de\s+lo\s+anterior/gi,
  /partiendo\s+de\s+lo\s+anterior/gi, /tomando\s+en\s+cuenta\s+lo\s+anterior/gi,
  /no\s+es\s+casual\s+que/gi, /no\s+es\s+coincidencia\s+que/gi, /no\s+es\s+azaroso\s+que/gi,
  /valga\s+la\s+redundancia/gi, /si\s+se\s+me\s+permite\s+la\s+expresi[óo]n/gi,
  /por\s+decirlo\s+as[ií]/gi, /dentro\s+de\s+lo\s+posible/gi,
  /dentro\s+del\s+marco\s+establecido/gi, /dentro\s+de\s+los\s+par[áa]metros/gi,
  /a[úu]n\s+cuando/gi, /a[úu]n\s+as[íi]/gi, /a\s+pesar\s+de\s+que/gi, /pese\s+a\s+que/gi,
  /en\s+tanto\s+que/gi, /mientras\s+que/gi, /en\s+la\s+medida\s+que/gi, /siempre\s+que/gi,
  /de\s+no\s+ser\s+as[íi]/gi, /de\s+lo\s+contrario/gi, /en\s+caso\s+contrario/gi, /en\s+otro\s+caso/gi,
  /es\s+de\s+esperarse\s+que/gi, /se\s+supone\s+que/gi, /se\s+entiende\s+que/gi, /se\s+presume\s+que/gi,
  /hasta\s+el\s+momento/gi, /hasta\s+la\s+fecha/gi, /a\s+la\s+fecha/gi, /al\s+cierre\s+de\s+esta\s+edici[óo]n/gi,
  /consultado\s+al\s+respecto/gi, /al\s+ser\s+consultado/gi, /ante\s+la\s+consulta/gi,
  /frente\s+a\s+esta\s+situaci[óo]n/gi, /ante\s+estos\s+hechos/gi, /ante\s+ello/gi,
  /se\s+trata\s+de\s+un\s+caso/gi, /se\s+trata\s+de\s+una\s+situaci[óo]n/gi, /se\s+trata\s+de\s+un\s+hecho/gi,
  /seg[úu]n\s+versiones\s+preliminares/gi, /de\s+acuerdo\s+con\s+versiones\s+iniciales/gi,
  /seg[úu]n\s+informes\s+preliminares/gi, /las\s+investigaciones\s+contin[úu]an/gi,
  /las\s+indagaciones\s+siguen\s+su\s+curso/gi, /el\s+caso\s+sigue\s+abierto/gi,
  /los\s+familiares\s+piden/gi, /los\s+deudos\s+solicitan/gi, /los\s+allegados\s+exigen/gi,
  /las\s+autoridades\s+hicieron\s+un\s+llamado/gi, /las\s+autoridades\s+emitieron\s+un\s+comunicado/gi,
  /las\s+autoridades\s+exhortaron/gi, /se\s+exhorta\s+a\s+la\s+poblaci[óo]n/gi,
  /se\s+pide\s+a\s+los\s+ciudadanos/gi, /se\s+llama\s+a\s+la\s+ciudadan[íi]a/gi,
  /esperamos\s+que\s+esta\s+situaci[óo]n/gi, /confiamos\s+en\s+que\s+esta\s+situaci[óo]n/gi,
  /esperamos\s+que\s+este\s+caso/gi, /la\s+comunidad\s+local/gi, /los\s+habitantes\s+del\s+sector/gi,
  /los\s+vecinos\s+de\s+la\s+zona/gi, /en\s+lo\s+sucesivo/gi, /de\s+ahora\s+en\s+adelante/gi,
  /a\s+partir\s+de\s+ahora/gi, /desde\s+este\s+momento/gi, /de\s+manera\s+similar/gi,
  /de\s+forma\s+an[áa]loga/gi, /de\s+modo\s+semejante/gi, /de\s+forma\s+parecida/gi,
  /en\s+igual\s+sentido/gi, /en\s+el\s+mismo\s+sentido/gi, /en\s+id[ée]ntica\s+direcci[óo]n/gi,
  /tanto\s+es\s+as[íi]/gi, /tanto\s+es\s+el\s+caso/gi, /hecho\s+est[áa]/gi, /lo\s+cierto\s+es/gi,
  /en\s+consecuencia\s+directa/gi, /como\s+consecuencia\s+directa/gi,
  /como\s+resultado\s+directo/gi, /directamente\s+relacionado\s+con\s+lo\s+anterior/gi,
  /en\s+estrecha\s+relaci[óo]n\s+con\s+lo\s+anterior/gi, /por\s+lo\s+que\s+hace\s+a/gi,
  /en\s+lo\s+tocante\s+a/gi, /en\s+lo\s+atinente\s+a/gi, /no\s+cabe\s+la\s+menor\s+duda/gi,
  /no\s+existe\s+duda/gi, /es\s+incuestionable/gi, /es\s+indubitable/gi,
];

const LEYES_DETECCION = [
  /(?:el|la)\s+(?:C[oó]digo\s+(?:Penal|Civil|de\s+Familia|Procesal\s+Penal|Laboral))\s+(?:establece|dispone|contempla|regula|señala|indica|estipula|determina|obliga|proh[íi]be|permite|faculta)[^.]{0,300}\./gi,
  /(?:el|la)\s+Ley\s+\d{1,4}[^.]{0,200}\./gi,
  /(?:el|la)\s+Decreto\s+\d{1,4}[^.]{0,200}\./gi,
  /(?:art[ií]culo)\s+\d{1,3}[^.]{0,200}\./gi,
  /(?:seg[úu]n\s+(?:el|la)\s+(?:normativa|legislaci[óo]n|marco\s+legal|ordenamiento\s+jur[ií]dico))[^.]{0,200}\./gi,
  /(?:la\s+(?:normativa|legislaci[óo]n)\s+(?:vigente|aplicable|correspondiente))[^.]{0,200}\./gi,
  /(?:en\s+(?:el\s+marco\s+legal|el\s+ordenamiento\s+jur[ií]dico|la\s+normativa\s+vigente))[^.]{0,200}\./gi,
];

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  console.log(`\n🔍 DIAGNÓSTICO ESPECÍFICO`);
  console.log(`═══════════════════════════════════════════════════`);

  for (const doc of docs) {
    const contenido = doc.contenido || '';
    const patronesIA = [];
    const leyesGen = [];

    for (let i = 0; i < PATRONES_IA_DETECCION.length; i++) {
      const regex = PATRONES_IA_DETECCION[i];
      const matches = contenido.match(regex);
      if (matches) {
        patronesIA.push({ regex: regex.source, match: matches[0] });
      }
    }

    for (let i = 0; i < LEYES_DETECCION.length; i++) {
      const regex = LEYES_DETECCION[i];
      const matches = contenido.match(regex);
      if (matches) {
        leyesGen.push({ regex: regex.source, match: matches[0] });
      }
    }

    if (patronesIA.length > 0 || leyesGen.length > 0) {
      console.log(`\n📰 ${doc.titulo}`);
      console.log(`   ID: ${doc.id}`);
      if (patronesIA.length > 0) {
        console.log(`   🤖 Patrones IA (${patronesIA.length}):`);
        patronesIA.slice(0, 3).forEach(p => console.log(`      - "${p.match.substring(0, 60)}..."`));
      }
      if (leyesGen.length > 0) {
        console.log(`   ⚖️ Leyes (${leyesGen.length}):`);
        leyesGen.slice(0, 3).forEach(l => console.log(`      - "${l.match.substring(0, 60)}..."`));
      }
    }
  }

  console.log(`\n═══════════════════════════════════════════════════`);
  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
