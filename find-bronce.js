const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (getApps().length === 0) {
  initializeApp({ credential: cert(require('./scripts/firebase-admin-key.json')) });
}

const db = getFirestore();

async function main() {
  const snap = await db.collection('noticias').get();
  console.log('\nNoticias en BRONCE (faltan para ORO):\n');
  
  snap.forEach(d => {
    const n = d.data();
    const texto = n.contenido || '';
    const palabras = (texto.match(/\b[a-záéíóúñA-ZÁÉÍÓÚÑ]+\b/g) || []).length;
    let score = 0;
    if (palabras >= 500) score += 20;
    else if (palabras >= 350) score += 10;
    else if (palabras >= 300) score += 5;
    
    const relleno = ['consternada','tragedia','dolor','perdió la vida'].filter(f => texto.toLowerCase().includes(f)).length;
    if (relleno === 0) score += 15; else if (relleno <= 2) score += 5;
    
    const trans = ['además','sin embargo','finalmente','es importante destacar'].reduce((a,t) => a + (texto.toLowerCase().split(t).length - 1), 0);
    if (trans === 0) score += 15; else if (trans <= 2) score += 5;
    
    const fuentes = (texto.match(/(?:afirmó|indicó|declaró|señaló|dijo|precisó|explicó|reportó)\s+/gi) || []).length;
    if (fuentes >= 2) score += 15; else if (fuentes === 1) score += 8;
    
    const citas = (texto.match(/"[^"]{10,200}"/g) || []).length;
    if (citas >= 1) score += 10;
    
    const datos = (texto.match(/\b\d{1,3}\s*años?\b/gi) || []).length + (texto.match(/\b\d{1,2}:\d{2}\b/g) || []).length;
    if (datos >= 3) score += 15; else if (datos >= 1) score += 8;
    
    if (score < 80) {
      console.log(`Score ${score}: ${n.titulo}`);
      console.log(`  Palabras: ${palabras}, Relleno: ${relleno}, Trans: ${trans}, Fuentes: ${fuentes}, Citas: ${citas}, Datos: ${datos}`);
      console.log('');
    }
  });
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
