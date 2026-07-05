import { writeFileSync } from 'fs';

const SITE_URL = 'https://nicaraguainformate.com';
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || process.env.ADMIN_TOKEN || '';

// Palabras de relleno emocional a detectar
const EMOTIONAL_WORDS = [
  'tragedia', 'trágico', 'terrible', 'impactante', 'devastador', 'horrible',
  'alarmante', 'desgarrador', 'lamentable', 'dramático', 'crítico', 'escalofriante',
  'espeluznante', 'increíble', 'inimaginable', 'escandaloso', 'vergonzoso',
  'aterrador', 'mortífero', 'sangriento', 'brutal', 'salvaje', 'violento',
  'agresivo', 'fatal', 'horror', 'consternación', 'dolor', 'perdió la vida',
  'pesar', 'conmoción', 'tristeza', 'angustia', 'desolación'
];

// Patrones de fuentes inventadas (atribuciones sin nombre propio)
const INVENTED_SOURCE_PATTERNS = [
  /La\s+Polic[ií]a\s+Nacional\s+(de\s+Nicaragua\s+)?(confirm[oó]|inform[oó]|precis[oó]|señal[oó])/i,
  /El\s+MINSA\s+(confirm[oó]|inform[oó]|precis[oó]|señal[oó])/i,
  /Las\s+autoridades\s+(confirmaron|informaron|precisaron|señalaron)/i,
  /Fuentes\s+policiales\s+(indicaron|confirmaron)/i,
  /El\s+Ministerio\s+de\s+\w+\s+(confirm[oó]|inform[oó]|precis[oó])/i,
  /La\s+Fiscal[ií]a\s+(confirm[oó]|inform[oó]|precis[oó])/i,
  /Las\s+fuentes\s+oficiales\s+(indicaron|confirmaron)/i,
];

// Cierres genéricos prohibidos
const GENERIC_CLOSINGS = [
  'autoridades investigan',
  'se desconocen las causas',
  'se espera más información',
  'las autoridades no se han pronunciado',
  'hasta el momento no hay detenidos',
];

async function fetchNoticias() {
  const res = await fetch(`${SITE_URL}/api/list-all`);
  if (!res.ok) throw new Error(`API list-all failed: ${res.status}`);
  const data = await res.json();
  const articles = Array.isArray(data) ? data : (data.articles || []);
  if (!Array.isArray(articles)) throw new Error('API no devolvió array');
  return articles;
}

// La API list-all solo devuelve metadatos, no el contenido completo.
// Estimamos palabras como contenidoLength / 5 (promedio de chars por palabra en español)
function estimateWords(contenidoLength) {
  if (!contenidoLength || contenidoLength <= 0) return 0;
  return Math.round(contenidoLength / 5);
}

async function analyzeNoticia(n) {
  const words = estimateWords(n.contenidoLength);

  // Determinar estado
  let estado = 'APTO';
  const problems = [];

  if (words < 250) {
    problems.push(`THIN CONTENT: ~${words} palabras estimadas (mínimo 350 recomendado)`);
    estado = 'NO APTO';
  } else if (words < 350) {
    problems.push(`CORTA: ~${words} palabras estimadas (ideal 350+)`);
    if (estado === 'APTO') estado = 'REVISIÓN';
  }

  if (!n.titulo || n.titulo.length < 10) {
    problems.push('Título ausente o muy corto');
    if (estado === 'APTO') estado = 'REVISIÓN';
  }

  // Nota: sin acceso al contenido completo, no podemos detectar:
  // - fuentes inventadas
  // - relleno emocional
  // - cierres genéricos

  return {
    titulo: n.titulo || '(Sin título)',
    slug: n.slug || n.id || '',
    palabras: words,
    estado,
    problems,
  };
}

async function runAudit() {
  console.log('[Auditoría 179] Obteniendo noticias...');
  const noticias = await fetchNoticias();
  console.log(`[Auditoría 179] ${noticias.length} noticias encontradas`);

  const results = [];
  let apto = 0, revision = 0, noApto = 0;
  let thinCount = 0;

  for (let i = 0; i < noticias.length; i++) {
    const n = noticias[i];
    const r = await analyzeNoticia(n);
    results.push(r);

    if (r.estado === 'APTO') apto++;
    else if (r.estado === 'REVISIÓN') revision++;
    else noApto++;

    if (r.palabras < 350) thinCount++;

    if ((i + 1) % 20 === 0) {
      process.stdout.write(`\r[Auditoría 179] Procesados ${i + 1}/${noticias.length}`);
    }
  }
  console.log();

  // Generar reporte
  const now = new Date().toLocaleString('es-NI');
  let md = `# Auditoría Forense — ${noticias.length} Noticias\n\n`;
  md += `**Fecha:** ${now}\n`;
  md += `**Dominio:** ${SITE_URL}\n\n`;

  md += `## Resumen Ejecutivo\n\n`;
  md += `- **Total noticias:** ${noticias.length}\n`;
  md += `- **APTO:** ${apto} (${Math.round((apto / noticias.length) * 100)}%)\n`;
  md += `- **REVISIÓN:** ${revision} (${Math.round((revision / noticias.length) * 100)}%)\n`;
  md += `- **NO APTO:** ${noApto} (${Math.round((noApto / noticias.length) * 100)}%)\n\n`;

  md += `## Problemas por categoría\n\n`;
  md += `- **Thin content (<350 palabras):** ${thinCount} noticias (${Math.round((thinCount / noticias.length) * 100)}%)\n`;
  md += `> **Nota:** La API list-all no devuelve el contenido completo, por lo que no se pueden detectar fuentes inventadas, relleno emocional ni cierres genéricos en este análisis. Solo se evalúa longitud estimada.\n\n`;

  md += `## ⚠️ Noticias NO APTAS (${noApto})\n\n`;
  for (const r of results.filter(x => x.estado === 'NO APTO')) {
    md += `### ${r.titulo}\n`;
    md += `- **Slug:** ${r.slug}\n`;
    md += `- **Palabras:** ${r.palabras}\n`;
    md += `- **Problemas:**\n`;
    for (const p of r.problems) md += `  - ${p}\n`;
    md += `\n`;
  }

  md += `## ⚠️ Noticias en REVISIÓN (${revision})\n\n`;
  for (const r of results.filter(x => x.estado === 'REVISIÓN')) {
    md += `### ${r.titulo}\n`;
    md += `- **Slug:** ${r.slug}\n`;
    md += `- **Palabras:** ${r.palabras}\n`;
    md += `- **Problemas:**\n`;
    for (const p of r.problems) md += `  - ${p}\n`;
    md += `\n`;
  }

  md += `## ✅ Noticias APTAS (${apto})\n\n`;
  for (const r of results.filter(x => x.estado === 'APTO')) {
    md += `- **${r.titulo}** — ${r.palabras} palabras\n`;
  }
  md += `\n`;

  md += `## Recomendaciones\n\n`;
  md += `1. **Eliminar o reescribir** las ${noApto} noticias NO APTAS antes de aplicar a AdSense.\n`;
  md += `2. **Revisar** las ${revision} noticias en revisión (quitar relleno emocional, expandir a 350+ palabras).\n`;
  md += `3. **Mantener** las ${apto} noticias APTAS como referencia de calidad.\n`;
  md += `4. **Meta crítica:** menos del 10% del sitio debe ser thin content para AdSense.\n\n`;

  const outPath = 'AUDITORIA_179_RESULT.md';
  writeFileSync(outPath, md, 'utf8');
  console.log(`[Auditoría 179] Reporte guardado en: ${outPath}`);
  console.log(`[Auditoría 179] APTO: ${apto} | REVISIÓN: ${revision} | NO APTO: ${noApto}`);
  console.log(`[Auditoría 179] Thin: ${thinCount}`);
}

runAudit().catch(err => {
  console.error('[Auditoría 179] Error:', err);
  process.exit(1);
});
