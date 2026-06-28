const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (getApps().length === 0) {
  initializeApp({ credential: cert(require('./scripts/firebase-admin-key.json')) });
}

const db = getFirestore();

const RELLENO_EMOCIONAL = [
  "consternada", "consternado", "conmoción", "conmocionó", "dolor",
  "tragedia", "trágico", "tragico", "último adiós", "ultimo adios",
  "perdió la batalla", "perdio la batalla", "fatal desenlace",
  "cristiana sepultura", "honras fúnebres", "honras funebres",
  "enlutó", "enluta", "consternación", "consternacion",
  "ambiente de dolor", "salir del asombro", "asombro",
  "familiares lamentan", "lamentan la pérdida", "lamentan la perdida",
  "comunidad consternada", "hecho conmocionó", "conmocionó a",
  "profundo dolor", "profunda tristeza", "vida truncada",
  "jóven promesa", "joven promesa", "amado", "querido",
  "incomprensible", "indignante", "irresponsable", "criminal",
  "brindan apoyo", "organizaciones brindan", "darán el último",
  "recibirá cristiana", "perdió la vida"
];

const TRANSICIONES_IA = [
  "además", "por otro lado", "en cuanto a", "en relación a",
  "por su parte", "asimismo", "del mismo modo", "en consecuencia",
  "en conclusión", "finalmente", "para finalizar",
  "es importante destacar", "cabe señalar", "cabe senalar",
  "en este sentido", "al respecto", "por lo tanto",
  "de igual manera", "de la misma forma", "en tanto que",
  "no obstante", "sin embargo", "por el contrario",
  "en primer lugar", "en segundo lugar", "en tercer lugar"
];

async function main() {
  const snap = await db.collection('noticias').get();
  let oro = 0, bronce = 0, peligro = 0;
  
  snap.forEach(d => {
    const n = d.data();
    const texto = n.contenido || '';
    const textoLower = texto.toLowerCase();
    
    const palabrasArr = texto.match(/\b[a-záéíóúñA-ZÁÉÍÓÚÑ]+\b/g);
    const palabras = palabrasArr ? palabrasArr.length : 0;
    
    const relleno = RELLENO_EMOCIONAL.filter(f => textoLower.includes(f)).length;
    const transiciones = TRANSICIONES_IA.reduce((acc, t) => acc + (textoLower.split(t).length - 1), 0);
    
    const fuentes = (texto.match(/(?:afirmó|indicó|declaró|señaló|dijo|precisó|explicó|reportó)\s+/gi) || []).length;
    const citas = (texto.match(/"[^"]{10,200}"/g) || []).length;
    const edades = (texto.match(/\b\d{1,3}\s*años?\b/gi) || []).length;
    const horas = (texto.match(/\b\d{1,2}:\d{2}\b/g) || []).length;
    const datos = edades + horas;
    
    let score = 0;
    if (palabras >= 500) score += 20;
    else if (palabras >= 350) score += 10;
    else if (palabras >= 300) score += 5;
    
    if (relleno === 0) score += 15;
    else if (relleno <= 2) score += 5;
    
    if (transiciones === 0) score += 15;
    else if (transiciones <= 2) score += 5;
    
    if (fuentes >= 2) score += 15;
    else if (fuentes === 1) score += 8;
    
    if (citas >= 1) score += 10;
    if (datos >= 3) score += 15;
    else if (datos >= 1) score += 8;
    
    const nivel = score >= 80 ? 'ORO' : score >= 60 ? 'BRONCE' : 'PELIGRO';
    if (nivel === 'ORO') oro++;
    else if (nivel === 'BRONCE') bronce++;
    else peligro++;
  });
  
  const total = oro + bronce + peligro;
  console.log('\n📊 AUDITORÍA FINAL:');
  console.log('   🟢 ORO: ' + oro);
  console.log('   🟡 BRONCE: ' + bronce);
  console.log('   🔴 PELIGRO: ' + peligro);
  console.log('   Total: ' + total);
  
  if (oro === total) {
    console.log('\n✅ 100% ORO — LISTO PARA ADSENSE');
    console.log('   Todas las noticias cumplen con la calidad requerida.');
  } else {
    console.log('\n⚠️ Aún hay ' + (bronce + peligro) + ' noticias por corregir');
  }
  process.exit(0);
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
