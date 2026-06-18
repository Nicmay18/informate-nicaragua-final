#!/usr/bin/env node
/**
 * DIAGNOSTICO ADSENSE FORENSE
 * Analiza TODAS las noticias de Firestore para evaluar riesgo de rechazo AdSense
 * NO modifica nada. Solo lectura y reporte.
 */
import dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

dotenv.config({ path: '.env.local' });
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);

  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try {
    const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  } catch {}

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('Faltan credenciales Firebase. Verifica variables de entorno.');
  }
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

function contarPalabras(texto) {
  if (!texto) return 0;
  const plano = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return plano.split(' ').filter(w => w.length > 0).length;
}

function analizarNoticia(n) {
  const contenido = n.contenido || '';
  const contenidoLower = contenido.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const palabras = contarPalabras(contenido);

  // 1. Thin content
  const esThin = palabras < 200;
  const esMuyCorto = palabras < 150;

  // 2. Fuentes realistas
  const esGuiaInformativa = /\b(c[oó]mo|tramitar|requisitos|pasos|gu[ií]a|documentos necesarios|donde|cuanto cuesta)\b/i.test((n.titulo || '') + ' ' + contenidoLower) && n.categoria === 'Nacionales';
  const tieneFuentesGuia = esGuiaInformativa && /polic[ií]a nacional|migraci[oó]n|ministerio|instituci[oó]n|oficial|gobierno|reglamento|decreto|ley \d|segun el|de acuerdo con el/i.test(contenidoLower);
  const tieneFuentesNoticia = /testigo|familiar|vecino|habitante|morador|comerciante|conductor|pasajero|declar[oó]|indic[oó]|dijo|mencion[oó]|precis[oó]|señal[oó]|confirm[oó]|report[oó]|versiones|segun [A-Z]|de acuerdo con [A-Z]|redes sociales|videos compartidos/i.test(contenidoLower);
  const tieneFuentes = tieneFuentesGuia || tieneFuentesNoticia;

  // 3. Patrones IA detectables
  const conectoresIA = ['asimismo', 'por otra parte', 'en este contexto', 'cabe destacar', 'es importante señalar', 'sin embargo', 'por ende', 'en conclusión', 'además', 'por su parte', 'en ese sentido', 'no obstante'];
  const tieneConectoresIA = conectoresIA.some(c => contenidoLower.includes(c));

  // 4. Atribuciones falsas a instituciones estatales
  const atribFalsas = /\bla policia\s+(?:inform[oó]|confirm[oó])\b|\blas\s+autoridades\s+(?:confirmaron|informaron)\b|\bel\s+ministerio\s+de\s+salud\s+(?:precis[oó]|confirm[oó])\b|\bla\s+alcald[ií]a\s+(?:inform[oó]|confirm[oó])\b/i.test(contenidoLower);

  // 5. Citas con atribucion real (detecta multiples formatos)
  const blockquotes = (contenido.match(/<blockquote>/g) || []).length;
  const citasConAtribucion = (contenido.match(/<blockquote>[^]*?—\s*[A-ZÁÉÍÓÚÑ][^]*?<\/blockquote>/gi) || []).length;
  // Formatos adicionales de atribucion real en blockquotes
  const citasConAtribucion2 = (contenido.match(/<blockquote>[^]*?[-–—]\s*[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][^]*?<\/blockquote>/gi) || []).length;
  const citasConAtribucion3 = (contenido.match(/<blockquote>\s*(?:[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+,?\s+)*(?:vecino|vecina|habitante|morador|residente|testigo|familiar|comerciante|conductor|pasajero|param[eé]dico|m[eé]dico|doctor|enfermera|polic[ií]a|bombero|oficial|portavoz|vocero|director|alcaldesa|alcalde|ministro)[^]*?<\/blockquote>/gi) || []).length;
  const citasConAtribucion4 = (contenido.match(/<blockquote>[^]*?(?:declar[oó]|indic[oó]|dijo|precis[oó]|señal[oó]|mencion[oó]|confirm[oó]|report[oó]|relat[oó]|coment[oó]|manifest[oó])[^]*?<\/blockquote>/gi) || []).length;
  const citasConAtribucion5 = (contenido.match(/<blockquote>[^]*?(?:seg[uú]n|de acuerdo con|versiones de|testimonio de|declaraci[oó]n de)[^]*?<\/blockquote>/gi) || []).length;
  const totalCitasAtribuidas = citasConAtribucion + citasConAtribucion2 + citasConAtribucion3 + citasConAtribucion4 + citasConAtribucion5;
  const citasSospechosas = blockquotes > 0 && totalCitasAtribuidas === 0;

  // 6. Palabras de inferencia
  const palabrasInferencia = ['podria', 'podrian', 'probablemente', 'posiblemente', 'se cree que', 'se supone que', 'se estima que', 'al parecer', 'quizas', 'tal vez'];
  const tieneInferencias = palabrasInferencia.some(p => contenidoLower.includes(p));

  // 7. Datos concretos locales
  const datosConcretos = (contenidoLower.match(/\b\d{1,2}\s+de\s+\w+\b/g) || []).length
    + (contenidoLower.match(/\b(?:managua|granada|leon|masaya|esteli|chinandega|matagalpa|jinotega|rivas|carazo|nicaragua)\b/g) || []).length
    + (contenidoLower.match(/\b(?:policia|ministerio|hospital|alcaldia|comisaria|inss|municipio|departamento)\b/g) || []).length;

  // 8. Imagen y autor
  const tieneImagen = !!(n.imagenDestacada || n.imagenUrl || n.imagen);
  const tieneAutor = !!(n.autor && n.autor.length > 2);
  const tieneFecha = !!(n.fecha || n.fechaPublicacion || n.createdAt);

  // Score de riesgo: cuántos problemas tiene
  const problemas = [];
  if (esThin) problemas.push('thin_content');
  if (!tieneFuentes) problemas.push('sin_fuentes');
  if (tieneConectoresIA) problemas.push('patrones_ia');
  if (atribFalsas) problemas.push('atribucion_falsa_institucion');
  if (citasSospechosas) problemas.push('citas_sin_atribucion');
  if (tieneInferencias) problemas.push('inferencias');
  if (!tieneImagen) problemas.push('sin_imagen');
  if (!tieneAutor) problemas.push('sin_autor');

  // Filtrar problemas reales (excluyendo citas_sin_atribucion que es falso positico frecuente)
  const problemasReales = problemas.filter(p => p !== 'citas_sin_atribucion');

  let nivelRiesgo = 'APROBADO';
  if (problemas.includes('atribucion_falsa_institucion')) {
    nivelRiesgo = 'CRITICO';
  } else if (problemasReales.length >= 3) {
    nivelRiesgo = 'ALTO';
  } else if (problemasReales.length >= 1) {
    nivelRiesgo = 'REVISAR';
  }

  return {
    id: n.id,
    titulo: (n.titulo || '').slice(0, 60),
    palabras,
    esThin,
    esMuyCorto,
    tieneFuentes,
    tieneConectoresIA,
    atribFalsas,
    citasSospechosas,
    tieneInferencias,
    datosConcretos,
    tieneImagen,
    tieneAutor,
    tieneFecha,
    problemas,
    nivelRiesgo,
    categoria: n.categoria || 'sin_categoria',
  };
}

async function main() {
  console.log('🔍 Iniciando diagnóstico AdSense Forense...');
  const db = initFirebase();
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  console.log(`📰 Total noticias en Firestore: ${docs.length}\n`);

  const resultados = docs.map(analizarNoticia);

  // Estadísticas agregadas
  const total = resultados.length;
  const thin = resultados.filter(r => r.esThin).length;
  const muyCorto = resultados.filter(r => r.esMuyCorto).length;
  const sinFuentes = resultados.filter(r => !r.tieneFuentes).length;
  const conIA = resultados.filter(r => r.tieneConectoresIA).length;
  const conAtribFalsa = resultados.filter(r => r.atribFalsas).length;
  const conCitasSospechosas = resultados.filter(r => r.citasSospechosas).length;
  const conInferencias = resultados.filter(r => r.tieneInferencias).length;
  const sinImagen = resultados.filter(r => !r.tieneImagen).length;
  const sinAutor = resultados.filter(r => !r.tieneAutor).length;

  const critico = resultados.filter(r => r.nivelRiesgo === 'CRITICO').length;
  const alto = resultados.filter(r => r.nivelRiesgo === 'ALTO').length;
  const revisar = resultados.filter(r => r.nivelRiesgo === 'REVISAR').length;
  const aprobado = resultados.filter(r => r.nivelRiesgo === 'APROBADO').length;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('              REPORTE ADSENSE — RIESGO GLOBAL');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 TOTAL NOTICIAS: ${total}`);
  console.log(`   ───────────────────────────────────────────`);
  console.log(`   ✅ APROBADO:        ${aprobado}  (${Math.round(aprobado/total*100)}%)`);
  console.log(`   🟡 REVISAR:         ${revisar}  (${Math.round(revisar/total*100)}%)`);
  console.log(`   🟠 Riesgo ALTO:     ${alto}  (${Math.round(alto/total*100)}%)`);
  console.log(`   🔴 Riesgo CRÍTICO:  ${critico}  (${Math.round(critico/total*100)}%)\n`);

  console.log(`📏 EXTENSIÓN`);
  console.log(`   Muy cortas (<150 palabras): ${muyCorto}`);
  console.log(`   Thin content (<200 palabras): ${thin}`);
  console.log(`   Promedio palabras: ${Math.round(resultados.reduce((a,r) => a + r.palabras, 0) / total)}\n`);

  console.log(`🔍 PROBLEMAS ESPECÍFICOS`);
  console.log(`   Sin fuentes claras:            ${sinFuentes}`);
  console.log(`   Con conectores IA detectables: ${conIA}`);
  console.log(`   Atribuciones falsas (EEAT):    ${conAtribFalsa}`);
  console.log(`   Citas sin atribución:          ${conCitasSospechosas}`);
  console.log(`   Con inferencias/suposiciones:  ${conInferencias}`);
  console.log(`   Sin imagen destacada:          ${sinImagen}`);
  console.log(`   Sin autor:                     ${sinAutor}\n`);

  // Top 20 de riesgo crítico
  const criticas = resultados.filter(r => r.nivelRiesgo === 'CRITICO').sort((a,b) => b.problemas.length - a.problemas.length);
  if (criticas.length > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🔴 NOTICIAS CON RIESGO CRÍTICO (revisar primero)');
    console.log('═══════════════════════════════════════════════════════════');
    criticas.slice(0, 20).forEach((r, i) => {
      console.log(`  ${i+1}. [${r.palabras} pal] ${r.titulo}`);
      console.log(`     Problemas: ${r.problemas.join(', ')}`);
    });
    if (criticas.length > 20) {
      console.log(`  ... y ${criticas.length - 20} más.`);
    }
  }

  // Top 20 de riesgo alto
  const altas = resultados.filter(r => r.nivelRiesgo === 'ALTO').sort((a,b) => b.problemas.length - a.problemas.length);
  if (altas.length > 0) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  🟠 NOTICIAS CON RIESGO ALTO');
    console.log('═══════════════════════════════════════════════════════════');
    altas.slice(0, 15).forEach((r, i) => {
      console.log(`  ${i+1}. [${r.palabras} pal] ${r.titulo}`);
      console.log(`     Problemas: ${r.problemas.join(', ')}`);
    });
    if (altas.length > 15) {
      console.log(`  ... y ${altas.length - 15} más.`);
    }
  }

  // Guardar JSON completo
  const reportePath = join(__dirname, 'reporte-adsense-forense.json');
  writeFileSync(reportePath, JSON.stringify({
    fecha: new Date().toISOString(),
    total,
    resumen: {
      riesgoCritico: critico,
      riesgoAlto: alto,
      aprobado: aprobado,
      revisar: revisar,
      thinContent: thin,
      muyCortas: muyCorto,
      sinFuentes,
      conIA: conIA,
      conAtribFalsa,
      conCitasSospechosas,
      conInferencias,
      sinImagen,
      sinAutor,
      promedioPalabras: Math.round(resultados.reduce((a,r) => a + r.palabras, 0) / total),
    },
    noticiasCriticas: criticas.map(r => ({ id: r.id, titulo: r.titulo, palabras: r.palabras, problemas: r.problemas })),
    noticiasAltas: altas.slice(0, 30).map(r => ({ id: r.id, titulo: r.titulo, palabras: r.palabras, problemas: r.problemas })),
    todas: resultados,
  }, null, 2));

  console.log(`\n✅ Reporte guardado en: ${reportePath}`);
  console.log(`   Abre ese archivo para ver el detalle completo de cada noticia.`);

  // Veredicto final
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    VEREDICTO ADSENSE');
  console.log('═══════════════════════════════════════════════════════════');
  if (critico === 0 && alto === 0 && revisar / total < 0.15) {
    console.log('  ✅ SITIO LIMPIO: Excelente estado para AdSense.');
    console.log('     La gran mayoría de noticias cumplen con los criterios.');
  } else if (critico === 0 && alto / total < 0.05) {
    console.log('  🟡 CASI LISTO: Algunas noticias necesitan revisión menor.');
    console.log('     Revisa las marcadas como REVISAR.');
  } else {
    console.log('  🔴 ATENCIÓN: Hay noticias con problemas importantes.');
    console.log('     Corregir las CRÍTICAS y de ALTO riesgo antes de aplicar.');
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message || err);
  if (err.stack) console.error(err.stack);
  writeFileSync(join(__dirname, 'diagnostico-error.json'), JSON.stringify({
    error: err.message || String(err),
    stack: err.stack || '',
    time: new Date().toISOString()
  }, null, 2));
  process.exit(1);
});
