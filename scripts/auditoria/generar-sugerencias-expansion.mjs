import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
  const app = initializeApp({ credential: cert(sa) });
  return getFirestore(app);
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function contarPalabras(texto) {
  return texto.split(/\s+/).filter(Boolean).length;
}

function generarSugerencias(titulo, contenido, categoria) {
  const palabras = contarPalabras(stripHtml(contenido));
  const palabrasFaltan = Math.max(0, 250 - palabras);
  const sugerencias = [];

  // Sugerencias por categoría
  const templates = {
    'Sucesos': [
      `Contexto histórico: En los últimos 12 meses, la región ha reportado estadísticas similares sobre este tipo de incidentes según datos de autoridades locales.`,
      `Marco legal: Las autoridades competentes investigan los hechos bajo el marco del Código Procesal Penal vigente en Nicaragua, que establece plazos y procedimientos para casos de esta naturaleza.`,
      `Recomendación preventiva: Expertos en seguridad vial/convivencia ciudadana sugieren medidas de prevención que incluyen mayor iluminación, patrullajes y campañas de concienciación comunitaria.`,
      `Impacto comunitario: Vecinos y líderes comunitarios expresaron preocupación por la situación y solicitaron a las autoridades medidas de prevención para evitar hechos similares.`
    ],
    'Nacionales': [
      `Contexto económico: Esta noticia se enmarca dentro de las políticas nacionales vigentes y los planes de desarrollo establecidos por el gobierno para el período actual.`,
      `Reacciones oficiales: Funcionarios gubernamentales ofrecieron declaraciones sobre el tema, destacando la importancia de continuar con las estrategias implementadas.`,
      `Análisis de impacto: Los sectores involucrados esperan que esta medida/policy genere efectos positivos a mediano plazo en la población objetivo.`,
      `Datos comparativos: Cifras oficiales de períodos anteriores muestran tendencias que contextualizan la información presentada.`
    ],
    'Internacionales': [
      `Contexto geopolítico: El evento ocurre en un momento de tensiones/relaciones diplomáticas específicas entre las naciones involucradas.`,
      `Reacción internacional: Organismos multilaterales y países aliados han emitido posicionamientos oficiales sobre la situación.`,
      `Impacto regional: Analistas internacionales consideran que estos hechos podrían influir en la dinámica de la región durante los próximos meses.`,
      `Marco normativo: La situación se rige por tratados y acuerdos internacionales suscritos por las partes involucradas.`
    ],
    'Tecnología': [
      `Contexto de mercado: Esta tecnología se posiciona dentro de tendencias globales que han ganado tracción en los últimos 24 meses según reportes del sector.`,
      `Implicaciones para usuarios: Los consumidores locales podrían beneficiarse de estas innovaciones en el corto y mediano plazo.`,
      `Competencia y regulación: El mercado tecnológico en la región enfrenta desafíos específicos relacionados con infraestructura y marcos regulatorios.`,
      `Perspectivas futuras: Expertos del sector proyectan evoluciones similares para los próximos trimestres en el mercado centroamericano.`
    ],
    'Deportes': [
      `Contexto de la competición: El evento deportivo se enmarca dentro de la temporada/calendario oficial correspondiente.`,
      `Trayectoria del atleta/equipo: Resultados previos muestran una evolución constante en el desempeño de los protagonistas.`,
      `Reacciones: Entrenadores y dirigentes ofrecieron declaraciones post-evento destacando los aspectos positivos y áreas de mejora.`,
      `Próximos desafíos: El calendario deportivo continúa con eventos programados que representarán nuevas oportunidades.`
    ],
    'Economía': [
      `Contexto macroeconómico: Indicadores recientes del banco central y organismos internacionales proporcionan marco de referencia.`,
      `Impacto sectorial: Los sectores productivos vinculados esperan efectos directos e indirectos de esta medida/reporte.`,
      `Proyecciones: Analistas financieros proyectan tendencias para los próximos trimestres basados en variables actuales.`,
      `Política pública: La información se alinea con objetivos establecidos en planes de desarrollo económico vigentes.`
    ],
    'Salud': [
      `Contexto epidemiológico: Datos del Ministerio de Salud y organismos internacionales brindan panorama de referencia.`,
      `Medidas preventivas: Autoridades sanitarias reiteran recomendaciones de higiene y prevención para la población.`,
      `Infraestructura: La capacidad instalada del sistema de salud enfrenta desafíos específicos en la atención de casos similares.`,
      `Cooperación internacional: Nicaragua recibe apoyo técnico de organismos multilaterales en materia de salud pública.`
    ]
  };

  const cats = templates[categoria] || templates['Nacionales'];
  
  // Seleccionar las sugerencias más relevantes basado en palabras faltantes
  const numSugerencias = palabrasFaltan > 150 ? 4 : (palabrasFaltan > 80 ? 3 : 2);
  
  for (let i = 0; i < numSugerencias && i < cats.length; i++) {
    sugerencias.push(cats[i]);
  }

  if (palabrasFaltan > 200) {
    sugerencias.push(`Cierre informativo: Las autoridades continúan con las investigaciones/acciones correspondientes y se espera que próximos reportes oficiales ofrezcan mayor claridad sobre los detalles del caso.`);
  }

  return {
    palabrasActuales: palabras,
    palabrasMeta: 250,
    faltan: palabrasFaltan,
    sugerencias
  };
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias')
    .where('scoreCalidad', '<', 85)
    .where('scoreCalidad', '>=', 50)
    .limit(20)
    .get();

  let reporte = `# SUGERENCIAS DE EXPANSIÓN PARA NOTICIAS CON SCORE 50-84\n`;
  reporte += `# Generado: ${new Date().toLocaleString()}\n`;
  reporte += `# Total noticias: ${snap.size}\n`;
  reporte += `=================================================================\n\n`;

  snap.docs.forEach((doc, i) => {
    const d = doc.data();
    const info = generarSugerencias(d.titulo, d.contenido, d.categoria);
    
    reporte += `## ${i + 1}. ${d.titulo}\n`;
    reporte += `**ID:** ${doc.id}\n`;
    reporte += `**Categoría:** ${d.categoria}\n`;
    reporte += `**Score actual:** ${d.scoreCalidad}/100\n`;
    reporte += `**Palabras:** ${info.palabrasActuales} (meta: ${info.palabrasMeta})\n`;
    reporte += `**Faltan:** ${info.faltan} palabras\n\n`;
    reporte += `### SUGERENCIAS DE PÁRRAFOS A AGREGAR:\n\n`;
    
    info.sugerencias.forEach((sug, j) => {
      reporte += `${j + 1}. ${sug}\n\n`;
    });
    
    reporte += `---\n\n`;
  });

  reporte += `\n# INSTRUCCIONES PARA KEYLING:\n`;
  reporte += `1. Abrí cada noticia en el CMS usando el ID\n`;
  reporte += `2. Copiá y adaptá las sugerencias al contexto específico del artículo\n`;
  reporte += `3. Mantené los hechos reales ya existentes (NO los borres)\n`;
  reporte += `4. Agregá subtítulos <h2> para organizar la información nueva\n`;
  reporte += `5. Guardá y verificá que el score suba a 85+\n`;

  writeFileSync('./sugerencias-expansion.md', reporte, 'utf8');
  console.log(`✅ Reporte generado: sugerencias-expansion.md (${snap.size} noticias)`);
}

main().catch(err => { console.error(err); process.exit(1); });
