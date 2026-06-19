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

const PATRONES_IA_FUERTE = [
  // Transiciones clásicas IA
  /\b(de esta manera|de esta forma|de este modo|por esta v[ií]a|mediante esta v[ií]a)[,;:.]?\s*/gi,
  /\b(en esta l[ií]nea|siguiendo esta l[ií]nea|dentro de esta l[ií]nea)[,;:.]?\s*/gi,
  /\b(en este orden de ideas|en este marco|en este contexto|en este escenario)[,;:.]?\s*/gi,
  /\b(no obstante lo anterior|pese a lo anterior|a pesar de lo expuesto)[,;:.]?\s*/gi,
  /\b(m[áa]s all[áa] de lo anterior|adem[áa]s de lo expuesto|junto a lo anterior)[,;:.]?\s*/gi,
  /\b(tal como se mencion[óo]|como se señal[óo]|seg[úu]n lo expuesto)[,;:.]?\s*/gi,
  /\b(es importante recordar que|conviene recordar que|cabe recordar que)[,;:.]?\s*/gi,
  /\b(no hay que olvidar que|no debemos olvidar que|no se debe olvidar que)[,;:.]?\s*/gi,
  /\b(por [úu]ltimo|finalmente|para terminar|por [úu]ltimo)[,;:.]?\s*/gi,
  /\b(para empezar|en primer lugar|en primera instancia|como punto de partida)[,;:.]?\s*/gi,
  /\b(en segundo lugar|en tercer lugar|por otro lado|adem[áa]s)[,;:.]?\s*/gi,
  /\b(tambi[eé]n es cierto que|igualmente es cierto que|asimismo es cierto que)[,;:.]?\s*/gi,
  /\b(en palabras m[áa]s sencillas|dicho de otra forma|para decirlo de otro modo)[,;:.]?\s*/gi,
  /\b(queda claro que|queda evidenciado que|queda demostrado que|queda confirmado que)[,;:.]?\s*/gi,
  /\b(se hace evidente que|se hace patente que|se hace manifiesto que)[,;:.]?\s*/gi,
  /\b(es un hecho que|es un dato que|es una realidad que)[,;:.]?\s*/gi,
  /\b(las cifras muestran que|los datos indican que|las estad[ií]sticas revelan que)[^,;.]{0,200}[,;.]?\s*/gi,
  /\b(se estima que m[áa]s del|se calcula que aproximadamente el|se proyecta que cerca del)[^,;.]{0,100}[,;.]?\s*/gi,
  /\b(una de las principales causas|uno de los principales factores|una de las razones principales)[^,;.]{0,200}[,;.]?\s*/gi,
  /\b(est[áa] claro que|resulta obvio que|es obvio que|es evidente que)[,;:.]?\s*/gi,
  /\b(no es menor señalar que|no es menor destacar que|no es menor mencionar que)[,;:.]?\s*/gi,
  /\b(es preciso señalar que|es necesario señalar que|es menester señalar que)[,;:.]?\s*/gi,
  /\b(hay que tener en cuenta que|debe tenerse en cuenta que|es preciso tener en cuenta que)[,;:.]?\s*/gi,
  /\b(ante la magnitud de los hechos|frente a la gravedad de la situaci[óo]n|dada la gravedad del caso)[,;:.]?\s*/gi,
  /\b(las autoridades competentes|las autoridades correspondientes|las autoridades de turno)[,;:.]?\s*/gi,
  /\b(la poblaci[óo]n en general|los ciudadanos en general|la ciudadan[íi]a en general)[,;:.]?\s*/gi,
  /\b(en materia de|en el [áa]mbito de|en el terreno de|en el campo de)[^,;.]{0,100}[,;.]?\s*/gi,
  /\b(todo parece indicar que|todo apunta a que|todo indica que)[,;:.]?\s*/gi,
  /\b(seg[úu]n lo informado|como se inform[óo]|de acuerdo con lo reportado)[,;:.]?\s*/gi,
  /\b(de manera que|de forma que|de tal manera que|de tal forma que)[,;:.]?\s*/gi,
  /\b(en la medida en que|en la medida de lo posible|hasta donde sea posible)[,;:.]?\s*/gi,
  /\b(tal y como se esperaba|como era de esperarse|como se preve[íi]a)[,;:.]?\s*/gi,
  /\b(en lo que respecta a|en cuanto a|por lo que respecta a)[,;:.]?\s*/gi,
  /\b(en lo concerniente a|en lo relativo a|en lo referente a)[,;:.]?\s*/gi,
  /\b(sobre la base de lo anterior|partiendo de lo anterior|tomando en cuenta lo anterior)[,;:.]?\s*/gi,
  /\b(no es casual que|no es coincidencia que|no es azaroso que)[,;:.]?\s*/gi,
  /\b(valga la redundancia|si se me permite la expresi[óo]n|por decirlo as[íi])[,;:.]?\s*/gi,
  /\b(dentro de lo posible|dentro del marco establecido|dentro de los par[áa]metros)[,;:.]?\s*/gi,
  /\b(a[úu]n cuando|a[úu]n as[íi]|a pesar de que|pese a que)[,;:.]?\s*/gi,
  /\b(en tanto que|mientras que|en la medida que|siempre que)[,;:.]?\s*/gi,
  /\b(de no ser as[íi]|de lo contrario|en caso contrario|en otro caso)[,;:.]?\s*/gi,
  /\b(es de esperarse que|se supone que|se entiende que|se presume que)[,;:.]?\s*/gi,
  /\b(hasta el momento|hasta la fecha|a la fecha|al cierre de esta edici[óo]n)[,;:.]?\s*/gi,
  /\b(consultado al respecto|al ser consultado|ante la consulta)[,;:.]?\s*/gi,
  /\b(frente a esta situaci[óo]n|ante estos hechos|ante ello)[,;:.]?\s*/gi,
  /\b(se trata de un caso|se trata de una situaci[óo]n|se trata de un hecho)[^,;.]{0,100}[,;.]?\s*/gi,
  /\b(seg[úu]n versiones preliminares|de acuerdo con versiones iniciales|seg[úu]n informes preliminares)[,;:.]?\s*/gi,
  /\b(las investigaciones contin[úu]an|las indagaciones siguen su curso|el caso sigue abierto)[,;:.]?\s*/gi,
  /\b(los familiares piden|los deudos solicitan|los allegados exigen)[^,;.]{0,200}[,;.]?\s*/gi,
  /\b(las autoridades hicieron un llamado|las autoridades emitieron un comunicado|las autoridades exhortaron)[^,;.]{0,200}[,;.]?\s*/gi,
  /\b(se exhorta a la poblaci[óo]n|se pide a los ciudadanos|se llama a la ciudadan[íi]a)[^,;.]{0,200}[,;.]?\s*/gi,
  /\b(esperamos que esta situaci[óo]n|confiamos en que esta situaci[óo]n|esperamos que este caso)[^,;.]{0,200}[,;.]?\s*/gi,
  /\b(la comunidad local|los habitantes del sector|los vecinos de la zona)[,;:.]?\s*/gi,
  /\b(en lo sucesivo|de ahora en adelante|a partir de ahora|desde este momento)[,;:.]?\s*/gi,
  /\b(de manera similar|de forma an[áa]loga|de modo semejante|de forma parecida)[,;:.]?\s*/gi,
  /\b(en igual sentido|en el mismo sentido|en id[ée]ntica direcci[óo]n)[,;:.]?\s*/gi,
  /\b(tanto es as[íi]|tanto es el caso|hecho est[áa]|lo cierto es)[,;:.]?\s*/gi,
  /\b(en consecuencia directa|como consecuencia directa|como resultado directo)[,;:.]?\s*/gi,
  /\b(directamente relacionado con lo anterior|en estrecha relaci[óo]n con lo anterior)[,;:.]?\s*/gi,
  /\b(por lo que hace a|en lo tocante a|en lo atinente a)[,;:.]?\s*/gi,
  /\b(no cabe la menor duda|no existe duda|es incuestionable|es indubitable)[,;:.]?\s*/gi,
];

const LEYES_GENERICAS_2 = [
  /\b(?:el|la)\s+(?:C[oó]digo\s+(?:Penal|Civil|de\s+Familia|Procesal\s+Penal|Laboral))\s+(?:establece|dispone|contempla|regula|señala|indica|estipula|determina|obliga|proh[íi]be|permite|faculta)[^.]{0,300}\.(?:\s*<\/p>)?/gi,
  /\b(?:el|la)\s+Ley\s+\d{1,4}[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:el|la)\s+Decreto\s+\d{1,4}[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:art[ií]culo)\s+\d{1,3}[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:seg[úu]n\s+(?:el|la)\s+(?:normativa|legislaci[óo]n|marco\s+legal|ordenamiento\s+jur[ií]dico))[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:la\s+(?:normativa|legislaci[óo]n)\s+(?:vigente|aplicable|correspondiente))[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:en\s+(?:el\s+marco\s+legal|el\s+ordenamiento\s+jur[ií]dico|la\s+normativa\s+vigente))[^.]{0,200}\.(?:\s*<\/p>)?/gi,
];

function limpiarTexto(contenido) {
  let limpio = contenido;
  let total = 0;
  for (const regex of PATRONES_IA_FUERTE) {
    const antes = limpio;
    limpio = limpio.replace(regex, '');
    if (limpio !== antes) total++;
  }
  for (const regex of LEYES_GENERICAS_2) {
    const antes = limpio;
    limpio = limpio.replace(regex, '');
    if (limpio !== antes) total++;
  }
  // Limpiar espacios múltiples
  limpio = limpio.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim();
  return { contenido: limpio, reemplazos: total };
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  let modificadas = 0;
  let detalles = [];

  for (const doc of docs) {
    const contenido = doc.contenido || '';
    const resultado = limpiarTexto(contenido);
    if (resultado.reemplazos > 0) {
      await db.collection('noticias').doc(doc.id).update({
        contenido: resultado.contenido,
        pasada2Forense: true,
        fechaPasada2: new Date().toISOString(),
      });
      modificadas++;
      detalles.push({ titulo: doc.titulo, reemplazos: resultado.reemplazos });
    }
  }

  console.log(`\n🧹 PASADA 2 FORENSE`);
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
