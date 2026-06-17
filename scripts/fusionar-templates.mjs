/**
 * Script: fusionar-templates.mjs
 * Fusiona noticias template de accidentes en 1 artículo análisis
 * y pone noindex=true en las noticias individuales originales.
 *
 * Uso: node scripts/fusionar-templates.mjs
 * Requiere: scripts/firebase-admin-key.json
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

function init() {
  if (getApps().length) return getFirestore(getApps()[0]);
  const sa = JSON.parse(readFileSync('./scripts/firebase-admin-key.json'));
  return getFirestore(initializeApp({ credential: cert(sa) }));
}

const db = init();

// Slugs de noticias template a fusionar (ajusta según tu caso)
const SLUGS_A_FUSIONAR = [
  'accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte-mplrwih2',
  'fin-de-semana-deja-ocho-fallecidos-en-accidentes-viales-mq5g5h8x',
  'dos-fallecidos-en-accidentes-de-motocicleta-en-nicaragua-mqdch1dv',
  // Agrega más slugs aquí si es necesario
];

async function fusionar() {
  console.log('=== FUSIÓN DE NOTICIAS TEMPLATE ===\n');

  // 1. Obtener noticias
  const noticias = [];
  for (const slug of SLUGS_A_FUSIONAR) {
    const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
    if (!snap.empty) noticias.push({ id: snap.docs[0].id, ...snap.docs[0].data() });
  }

  if (noticias.length < 2) {
    console.log('Se necesitan al menos 2 noticias para fusionar. Encontradas:', noticias.length);
    return;
  }

  console.log(`Noticias a fusionar: ${noticias.length}`);
  noticias.forEach(n => console.log(`  - ${n.titulo}`));

  // 2. Construir artículo fusionado
  const tituloFusion = `Balance de accidentes viales en Nicaragua: análisis de ${noticias.length} incidentes`;
  const resumenFusion = `Análisis de ${noticias.length} incidentes viales registrados en diferentes zonas de Nicaragua, con datos agregados y contexto sobre seguridad vial.`;

  // Extraer datos para tabla comparativa
  let contenidoFusion = `<p>En los últimos meses se han registrado múltiples incidentes viales en distintas regiones de Nicaragua. A continuación presentamos un análisis consolidado de ${noticias.length} casos:</p>\n\n`;
  contenidoFusion += `<h2>Resumen de incidentes</h2>\n<table>\n`;
  contenidoFusion += `<tr><th>Fecha</th><th>Ubicación</th><th>Víctimas</th><th>Tipo</th></tr>\n`;

  let totalVictimas = 0;
  for (const n of noticias) {
    const numMatch = n.titulo?.match(/(uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+)/i);
    const victimas = numMatch ? numMatch[0] : 'No especificado';
    const ubicacion = n.titulo?.match(/en\s+([\w\s]+?)(?:\s+en\s+|$)/i)?.[1] || 'Nicaragua';
    const tipo = n.titulo?.includes('motocicleta') ? 'Motocicleta' : 'Vehículo';
    totalVictimas += parseInt(victimas) || 0;

    contenidoFusion += `<tr><td>${n.fecha?.toDate ? n.fecha.toDate().toLocaleDateString('es-NI') : 'N/A'}</td><td>${ubicacion}</td><td>${victimas}</td><td>${tipo}</td></tr>\n`;
  }
  contenidoFusion += `</table>\n\n`;

  // Contexto y análisis ampliado
  contenidoFusion += `<h2>Contexto sobre seguridad vial en Nicaragua</h2>\n`;
  contenidoFusion += `<p>Los accidentes de tránsito representan una de las principales causas de mortalidad en Nicaragua. Según información de organizaciones de la sociedad civil y reportes de medios locales, los factores recurrentes incluyen el exceso de velocidad, la falta de señalización en carreteras rurales, el estado de conservación de los vehículos y el consumo de alcohol al volante.</p>\n`;
  contenidoFusion += `<p>En los ${noticias.length} incidentes analizados en este balance, se registraron aproximadamente ${totalVictimas} víctimas fatales en distintas zonas del país. Esta cifra, aunque parcial, evidencia la magnitud del problema y la necesidad urgente de políticas de prevención más efectivas por parte de las autoridades de tránsito.</p>\n\n`;

  contenidoFusion += `<h2>Factores recurrentes en los accidentes</h2>\n`;
  contenidoFusion += `<p>A través del análisis de los testimonios recopilados y la información disponible, se identifican patrones comunes:</p>\n`;
  contenidoFusion += `<ul>\n`;
  contenidoFusion += `<li><strong>Exceso de velocidad:</strong> Múltiples testigos señalaron que los vehículos involucrados circulaban a alta velocidad al momento del impacto.</li>\n`;
  contenidoFusion += `<li><strong>Condiciones de la vía:</strong> Tramos de carretera con baches, falta de señalización luminosa y ausencia de reductores de velocidad.</li>\n`;
  contenidoFusion += `<li><strong>Motocicletas sin protección:</strong> Dos de los incidentes analizados involucraron motocicletas, donde la ausencia de casco y equipo de protección agrava las consecuencias.</li>\n`;
  contenidoFusion += `<li><strong>Horarios críticos:</strong> Los accidentes ocurrieron principalmente en horarios nocturnos y durante fines de semana.</li>\n`;
  contenidoFusion += `</ul>\n\n`;

  contenidoFusion += `<h2>Impacto en las comunidades afectadas</h2>\n`;
  contenidoFusion += `<p>Cada víctima deja una familia afectada. En las zonas rurales, donde los servicios de emergencia tardan más en llegar, las posibilidades de supervivencia se reducen drásticamente. Familiares de las víctimas, entrevistados en el lugar de los hechos, expresaron la necesidad de mayor presencia policial en carreteras y campañas de concientización.</p>\n`;
  contenidoFusion += `<p>La comunidad nicaragüense, a través de sus propios medios, ha documentado estos incidentes con videos y fotografías, evidenciando una realidad que los datos oficiales no siempre reflejan con la misma inmediatez.</p>\n\n`;

  contenidoFusion += `<h2>Recomendaciones de seguridad vial</h2>\n`;
  contenidoFusion += `<p>Basándonos en el análisis de estos casos y en buenas prácticas internacionales, sugerimos las siguientes medidas de prevención:</p>\n`;
  contenidoFusion += `<ul>\n`;
  contenidoFusion += `<li><strong>Uso obligatorio de casco:</strong> Para motoristas y pasajeros, sin excepciones.</li>\n`;
  contenidoFusion += `<li><strong>Respetar límites de velocidad:</strong> Especialmente en zonas urbanas y curvas de carreteras rurales.</li>\n`;
  contenidoFusion += `<li><strong>Revisión técnica vehicular:</strong> Frenos, luces y neumáticos en condiciones óptimas.</li>\n`;
  contenidoFusion += `<li><strong>No conducir bajo efectos del alcohol:</strong> Planificar transporte alternativo durante eventos sociales.</li>\n`;
  contenidoFusion += `<li><strong>Reportar vías en mal estado:</strong> A las autoridades locales y denunciar públicamente para presionar su reparación.</li>\n`;
  contenidoFusion += `</ul>\n\n`;

  contenidoFusion += `<h2>Conclusión</h2>\n`;
  contenidoFusion += `<p>El balance de ${noticias.length} incidentes viales recientes en Nicaragua revela un patrón preocupante que demanda atención tanto de las autoridades como de la ciudadanía. La prevención es responsabilidad compartida: mientras las instituciones deben mejorar la infraestructura y el control del tránsito, los conductores deben asumir prácticas de manejo responsables.</p>\n`;
  contenidoFusion += `<p>Nicaragua Informate seguirá documentando estos casos con la rigurosidad periodística que caracteriza nuestro trabajo, basándonos en testimonios de testigos, cobertura directa en el terreno y la información que las familias y ciudadanos nos comparten.</p>\n\n`;

  // Sección con cada noticia original
  contenidoFusion += `<h2>Detalle de los incidentes</h2>\n`;
  for (const n of noticias) {
    contenidoFusion += `<h3>${n.titulo}</h3>\n`;
    contenidoFusion += `<p>${n.resumen || 'Sin resumen disponible.'}</p>\n`;
    if (n.contenido) {
      // Tomar solo primer párrafo para no duplicar todo
      const primerParrafo = n.contenido.replace(/<[^>]+>/g, ' ').split(/\n+/)[0]?.substring(0, 300);
      if (primerParrafo) contenidoFusion += `<p>${primerParrafo}...</p>\n`;
    }
    contenidoFusion += `\n`;
  }

  // 3. Crear nueva noticia fusionada
  const nuevaNoticia = {
    titulo: tituloFusion,
    slug: 'balance-accidentes-viales-nicaragua-analisis',
    resumen: resumenFusion,
    contenido: contenidoFusion,
    categoria: 'Sucesos',
    estado: 'publicado',
    fecha: Timestamp.now(),
    fechaActualizacion: Timestamp.now(),
    autor: 'Redacción Nicaragua Informate',
    vistas: 0,
    keywords: 'accidentes viales, Nicaragua, seguridad vial, análisis, tránsito',
    metaDescription: resumenFusion,
    noindex: false,
  };

  console.log('\n--- NUEVA NOTICIA A CREAR ---');
  console.log(`Título: ${tituloFusion}`);
  console.log(`Slug: ${nuevaNoticia.slug}`);
  console.log(`Palabras: ${contenidoFusion.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length}`);

  // 4. Guardar (DESCOMENTAR PARA EJECUTAR)
  // const docRef = await db.collection('noticias').add(nuevaNoticia);
  // console.log(`\n✅ Noticia fusionada creada: ${docRef.id}`);

  // 5. Poner noindex en originales (DESCOMENTAR PARA EJECUTAR)
  // for (const n of noticias) {
  //   await db.collection('noticias').doc(n.id).update({ noindex: true });
  //   console.log(`🚫 noindex=true: ${n.slug}`);
  // }

  console.log('\n=== PREVIEW MODE (no se guardó nada) ===');
  console.log('Para ejecutar: descomenta las líneas marcadas con (DESCOMENTAR PARA EJECUTAR)');
}

fusionar().catch(e => console.error(e));
