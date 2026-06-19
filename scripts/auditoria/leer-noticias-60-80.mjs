import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDVsqRGr7dtdi5ecO14THIdbnEzZKOJxcA",
  authDomain: "informate-instant-nicaragua.firebaseapp.com",
  projectId: "informate-instant-nicaragua",
  storageBucket: "informate-instant-nicaragua.firebasestorage.app",
  messagingSenderId: "24988088146",
  appId: "1:24988088146:web:d26a207508da055668ec8b",
  measurementId: "G-W1B5J61WEP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));

  const noticias6080 = [];
  noticias.forEach(n => {
    const contenido = n.contenido || '';
    const palabras = contenido.trim().split(/\s+/).length;
    const tituloLen = (n.titulo || '').length;
    const resumenLen = (n.resumen || '').length;
    const numeros = contenido.match(/\d+/g) || [];
    const datosPor100 = palabras > 0 ? ((numeros.length / palabras) * 100).toFixed(1) : 0;

    const ptsLongitud = palabras > 600 ? 20 : palabras > 350 ? 15 : palabras > 200 ? 10 : 5;
    const ptsTitular = tituloLen >= 30 && tituloLen <= 70 ? 15 : 8;
    const ptsMeta = resumenLen >= 120 && resumenLen <= 160 ? 15 : resumenLen > 0 ? 8 : 0;
    const ptsImagen = n.imagen ? 15 : 0;
    const ptsEstructura = contenido.includes('**') || contenido.includes('##') || contenido.includes('<h2>') ? 15 : 8;
    const ptsCategoria = n.categoria && n.departamento ? 10 : 5;
    const ptsDatos = datosPor100 >= 5 ? 10 : datosPor100 >= 2 ? 6 : 3;

    const total = ptsLongitud + ptsTitular + ptsMeta + ptsImagen + ptsEstructura + ptsCategoria + ptsDatos;
    const porcentaje = Math.round((total / 100) * 100);

    if (porcentaje >= 60 && porcentaje <= 79) {
      noticias6080.push({
        id: n.id,
        titulo: n.titulo || '(Sin título)',
        categoria: n.categoria || '',
        departamento: n.departamento || '',
        resumen: n.resumen || '',
        contenido,
        porcentaje,
        total,
        palabras,
        tituloLen,
        resumenLen,
        datosPor100
      });
    }
  });

  noticias6080.sort((a, b) => b.porcentaje - a.porcentaje);

  const output = noticias6080.map(n => ({
    id: n.id,
    titulo: n.titulo,
    categoria: n.categoria,
    departamento: n.departamento,
    resumen: n.resumen,
    contenido: n.contenido,
    porcentaje: n.porcentaje,
    total: n.total,
    palabras: n.palabras,
    tituloLen: n.tituloLen,
    resumenLen: n.resumenLen,
    datosPor100: n.datosPor100
  }));

  const fs = await import('fs');
  fs.writeFileSync('noticias-60-80.json', JSON.stringify(output, null, 2));
  console.log(`✅ Guardadas ${output.length} noticias en noticias-60-80.json`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
