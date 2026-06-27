const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = 'E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json';

// ─── CRITERIOS DE AUDITORÍA ───────────────────────────────────────
const ADJETIVOS_PROHIBIDOS = [
  'tragico','tragica','terrible','impactante','impactantes','conmociono','conmocionó',
  'devastador','devastadora','horrible','alarmante','desgarrador','desgarradora',
  'lamentable','dramatico','dramatica','escalofriante','espeluznante','increible',
  'inimaginable','indignante','escandaloso','escandalosa','vergonzoso','vergonzosa',
  'aterrador','aterradora','mortifero','mortifera','sangriento','sangrienta',
  'brutal','brutales','salvaje','violento','violenta','agresivo','agresiva',
  'desastroso','desastrosa','funesto','funesta','siniestro','siniestra',
  'macabro','macabra','espantoso','espantosa','atroz','critico','critica',
  'morboso','grotesco','pavoroso','fatal','nefasto','sangre','muerto','muertos',
  'muerta','muertas','fallecido','fallecidos','fallecida','fallecidas','asesinato',
  'asesinado','asesinada','asesinos','secuestro','secuestrado','violacion',
  'violada','violaron','tortura','torturado','descuartizado','decapitado',
  'ahorcado','ahogado','incinerado','calcina','calcino'
];

const PALABRAS_SENSIBLES = [
  'asesinato','homicidio','suicidio','secuestro','violacion','tortura',
  'drogas','narcotrafico','narco','cartel','sicario','ejecucion','ejecutado',
  'decapitado','descuartizado','incinerado','ahogado','ahorcado'
];

function analizarNoticia(doc) {
  const data = doc.data();
  const titulo = (data.titulo || '').toLowerCase();
  const contenido = (data.contenido || '').toLowerCase();
  const resumen = (data.resumen || '').toLowerCase();
  const textoCompleto = titulo + ' ' + resumen + ' ' + contenido;
  const textoPlano = contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoPlano.split(/\s+/).length;
  const problemas = [];
  let nivelRiesgo = 'BAJO';

  const adjEncontrados = ADJETIVOS_PROHIBIDOS.filter(adj => textoCompleto.includes(adj));
  if (adjEncontrados.length > 0) {
    problemas.push(`Adjetivos: ${adjEncontrados.slice(0, 3).join(', ')}`);
  }

  const sensibles = PALABRAS_SENSIBLES.filter(p => textoCompleto.includes(p));
  if (sensibles.length > 0) {
    problemas.push(`Sensibles: ${sensibles.slice(0, 3).join(', ')}`);
  }

  if (palabras < 150) {
    problemas.push(`Corta: ${palabras} palabras`);
  }

  const h2Count = (contenido.match(/<h2>/gi) || []).length;
  if (h2Count === 0 && palabras < 300) {
    problemas.push('Sin H2');
  }

  const esSuceso = (data.categoria || '').toLowerCase() === 'sucesos';
  if (esSuceso && !/118|128|115|denunciar|emergencia|prevencion/.test(contenido)) {
    problemas.push('Sin recursos');
  }

  if (/!{2,}/.test(data.titulo || '')) {
    problemas.push('!!! en título');
  }

  const score = problemas.length;
  if (score >= 5) nivelRiesgo = 'CRITICO';
  else if (score >= 3) nivelRiesgo = 'ALTO';
  else if (score >= 1) nivelRiesgo = 'MEDIO';

  const tieneGrave = problemas.some(p => p.includes('Sensibles') || p.includes('Adjetivos'));
  if (nivelRiesgo === 'MEDIO' && !tieneGrave && palabras >= 250) {
    nivelRiesgo = 'BAJO';
  }

  return {
    id: doc.id,
    titulo: data.titulo || '(sin título)',
    categoria: data.categoria || 'Sin categoría',
    palabras,
    nivelRiesgo,
    problemas,
  };
}

// ─── MAIN ────────────────────────────────────────────────────────
const serviceAccount = require(SERVICE_ACCOUNT_PATH);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  console.log('🔍 Auditando TODAS las noticias...\n');

  const snap = await db.collection('noticias').get();
  console.log(`📰 Total: ${snap.size} noticias\n`);

  const criticas = [], altas = [], medias = [], bajas = [];

  snap.docs.forEach(doc => {
    const a = analizarNoticia(doc);
    if (a.nivelRiesgo === 'CRITICO') criticas.push(a);
    else if (a.nivelRiesgo === 'ALTO') altas.push(a);
    else if (a.nivelRiesgo === 'MEDIO') medias.push(a);
    else bajas.push(a);
  });

  console.log('='.repeat(60));
  console.log(`CRÍTICAS: ${criticas.length} | ALTAS: ${altas.length} | MEDIAS: ${medias.length} | BAJAS: ${bajas.length}`);
  console.log('='.repeat(60));

  if (criticas.length > 0) {
    console.log('\n🔴 CRÍTICAS:');
    criticas.forEach(n => console.log(`   ${n.id} | ${n.categoria} | ${n.titulo.substring(0, 60)}... | ${n.problemas.join('; ')}`));
  }
  if (altas.length > 0) {
    console.log('\n🟠 ALTAS:');
    altas.forEach(n => console.log(`   ${n.id} | ${n.categoria} | ${n.titulo.substring(0, 60)}... | ${n.problemas.join('; ')}`));
  }
  if (medias.length > 0) {
    console.log('\n🟡 MEDIAS:');
    medias.forEach(n => console.log(`   ${n.id} | ${n.categoria} | ${n.titulo.substring(0, 60)}... | ${n.problemas.join('; ')}`));
  }

  console.log(`\n✅ ${bajas.length} noticias BAJAS (aprobables)`);

  // Mostrar resumen por categoría
  const porCat = {};
  snap.docs.forEach(doc => {
    const cat = doc.data().categoria || 'Sin';
    if (!porCat[cat]) porCat[cat] = { total: 0, media: 0, alta: 0, critica: 0 };
    porCat[cat].total++;
  });
  [].concat(criticas, altas, medias).forEach(n => {
    if (!porCat[n.categoria]) porCat[n.categoria] = { total: 0, media: 0, alta: 0, critica: 0 };
    if (n.nivelRiesgo === 'MEDIO') porCat[n.categoria].media++;
    if (n.nivelRiesgo === 'ALTO') porCat[n.categoria].alta++;
    if (n.nivelRiesgo === 'CRITICO') porCat[n.categoria].critica++;
  });

  console.log('\n📊 Por categoría:');
  Object.entries(porCat).forEach(([cat, nums]) => {
    const ok = nums.total - nums.media - nums.alta - nums.critica;
    console.log(`   ${cat}: ${nums.total} total | ${ok} OK | ${nums.media} MEDIA | ${nums.alta} ALTA | ${nums.critica} CRÍTICA`);
  });

  process.exit(0);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
