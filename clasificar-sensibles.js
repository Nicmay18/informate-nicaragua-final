/**
 * CLASIFICAR NOTICIAS: Sensibles vs Seguras para AdSense
 * Marca noticias con contenido violento/sensible que AdSense rechaza
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (getApps().length === 0) {
  initializeApp({ credential: cert(require('./scripts/firebase-admin-key.json')) });
}

const db = getFirestore();

// Palabras que hacen que AdSense rechace automáticamente
const PALABRAS_SENSIBLES = [
  'muere', 'murió', 'fallece', 'falleció', 'muerto', 'fallecido', 'muerta', 'fallecida',
  'asesinato', 'asesinado', 'asesinada', 'asesinaron', 'homicidio',
  'accidente', 'atropello', 'atropellado', 'vuelco', 'colisión',
  'cocaína', 'droga', 'marihuana', 'incautaron', 'narcotráfico', 'narco',
  'detenido', 'detuvieron', 'capturado', 'capturaron', 'preso',
  'policía', 'policial', 'investiga', 'investigan', 'fiscalía',
  'recluso', 'cárcel', 'prisión', 'penal',
  'violencia', 'violento', 'agresión', 'agredieron', 'riña',
  'ahogado', 'ahogada', 'incendio', 'quemado',
  'suicidio', 'suicidó',
  'desaparecido', 'secuestro',
  'intoxicado', 'intoxicación',
  'arma', 'arma de fuego', 'bala', 'disparo',
];

const PALABRAS_SEGURAS = [
  'tecnología', 'celular', 'iphone', 'samsung', 'app', 'aplicación',
  'deporte', 'fútbol', 'béisbol', 'olimpiada', 'campeonato', 'deportivo',
  'turismo', 'turista', 'viaje', 'hotel', 'playa',
  'cultura', 'arte', 'música', 'concierto', 'festival',
  'economía', 'inversión', 'empresa', 'negocio', 'mercado',
  'educación', 'escuela', 'universidad', 'estudiante',
  'salud', 'medicina', 'vacuna', 'hospital', 'bienestar',
  'clima', 'lluvia', 'temperatura', 'pronostican',
  ' inaugur', 'celebr', 'aniversario', 'feria', 'evento',
];

function clasificar(titulo, contenido) {
  const texto = (titulo + ' ' + contenido).toLowerCase();
  let sensibles = 0;
  let seguras = 0;

  PALABRAS_SENSIBLES.forEach(p => { if (texto.includes(p)) sensibles++; });
  PALABRAS_SEGURAS.forEach(p => { if (texto.includes(p)) seguras++; });

  // Si tiene 2+ palabras sensibles, es sensible
  if (sensibles >= 2) return 'SENSIBLE';
  if (sensibles >= 1 && seguras === 0) return 'SENSIBLE';
  if (seguras >= 1 && sensibles === 0) return 'SEGURA';
  return 'NEUTRA';
}

async function main() {
  console.log('🔍 CLASIFICANDO NOTICIAS PARA ADSENSE\n');

  const snapshot = await db.collection('noticias').get();
  const noticias = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  let sensible = 0, segura = 0, neutra = 0;
  const ejemplosSensible = [];
  const ejemplosSegura = [];

  for (const n of noticias) {
    const categoria = clasificar(n.titulo || '', n.contenido || '');

    await db.collection('noticias').doc(n.id).update({
      adsenseCategoria: categoria,
      adsenseClasificadoEn: new Date()
    });

    if (categoria === 'SENSIBLE') { sensible++; ejemplosSensible.push(n.titulo); }
    else if (categoria === 'SEGURA') { segura++; ejemplosSegura.push(n.titulo); }
    else neutra++;

    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`📊 RESULTADOS:`);
  console.log(`   🔴 SENSIBLES (AdSense rechaza): ${sensible}`);
  console.log(`   🟢 SEGURAS (AdSense aprueba):   ${segura}`);
  console.log(`   ⚪ NEUTRAS:                    ${neutra}`);
  console.log(`   ─────────────────────────────────`);
  console.log(`   TOTAL: ${noticias.length}\n`);

  console.log('🔴 EJEMPLOS SENSIBLES:');
  ejemplosSensible.slice(0, 10).forEach(t => console.log(`   • ${t.substring(0, 70)}`));
  if (ejemplosSensible.length > 10) console.log(`   ... y ${ejemplosSensible.length - 10} más\n`);

  console.log('\n🟢 EJEMPLOS SEGURAS:');
  ejemplosSegura.slice(0, 10).forEach(t => console.log(`   • ${t.substring(0, 70)}`));
  if (ejemplosSegura.length > 10) console.log(`   ... y ${ejemplosSegura.length - 10} más\n`);

  console.log('\n⚠️ RECOMENDACIÓN:');
  console.log(`   Si ${sensible} noticias sensibles están visibles, AdSense NUNCA aprobará.`);
  console.log(`   Para la revisión de AdSense, ocultar las ${sensible} noticias sensibles.`);
  console.log(`   Mostrar solo las ${segura + neutra} noticias seguras/neutras.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
