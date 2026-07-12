const SITE_URL = 'https://nicaraguainformate.com';
const ADMIN_TOKEN = 'ni-admin-2026-informate';

// ─── MAPAS DE CORRECCIÓN ───

const EMOTIONAL_REPLACEMENTS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\btrágico\b/gi, replacement: 'grave' },
  { pattern: /\btragedia\b/gi, replacement: 'incidente' },
  { pattern: /\bterrible\b/gi, replacement: 'grave' },
  { pattern: /\bimpactante\b/gi, replacement: 'significativo' },
  { pattern: /\bdevastador\b/gi, replacement: 'de gran magnitud' },
  { pattern: /\bhorrible\b/gi, replacement: 'grave' },
  { pattern: /\balarmante\b/gi, replacement: 'preocupante' },
  { pattern: /\bdesgarrador\b/gi, replacement: 'grave' },
  { pattern: /\blamentable\b/gi, replacement: '' },
  { pattern: /\bdramático\b/gi, replacement: 'intenso' },
  { pattern: /\bescalofriante\b/gi, replacement: '' },
  { pattern: /\bespeluznante\b/gi, replacement: '' },
  { pattern: /\bincreíble\b/gi, replacement: '' },
  { pattern: /\binimaginable\b/gi, replacement: '' },
  { pattern: /\bescandaloso\b/gi, replacement: '' },
  { pattern: /\bvergonzoso\b/gi, replacement: '' },
  { pattern: /\baterrador\b/gi, replacement: '' },
  { pattern: /\bmortífero\b/gi, replacement: 'con resultado fatal' },
  { pattern: /\bsangriento\b/gi, replacement: '' },
  { pattern: /\bbrutal\b/gi, replacement: 'violento' },
  { pattern: /\bsalvaje\b/gi, replacement: '' },
  { pattern: /\bagresivo\b/gi, replacement: '' },
  { pattern: /\bhorror\b/gi, replacement: '' },
  { pattern: /\bconsternación\b/gi, replacement: 'preocupación' },
  { pattern: /\bdolor\b/gi, replacement: 'afectación' },
  { pattern: /\bperdió la vida\b/gi, replacement: 'falleció' },
  { pattern: /\bpesar\b/gi, replacement: '' },
  { pattern: /\bconmoción\b/gi, replacement: 'repercusión' },
  { pattern: /\btristeza\b/gi, replacement: '' },
  { pattern: /\bangustia\b/gi, replacement: 'preocupación' },
  { pattern: /\bdesolación\b/gi, replacement: '' },
];

const INVENTED_FIXES: { pattern: RegExp; replacement: string }[] = [
  { pattern: /La\s+Polic[ií]a\s+Nacional\s+(de\s+Nicaragua\s+)?(confirm[oó]|inform[oó]|precis[oó]|señal[oó])\s+que/gi, replacement: 'Según versiones recogidas en el lugar,' },
  { pattern: /El\s+MINSA\s+(confirm[oó]|inform[oó]|precis[oó]|señal[oó])\s+que/gi, replacement: 'Hasta el momento no se han conocido declaraciones oficiales del Ministerio de Salud sobre' },
  { pattern: /Las\s+autoridades\s+(confirmaron|informaron|precisaron|señalaron)\s+que/gi, replacement: 'Según información recopilada en la zona del incidente,' },
  { pattern: /Fuentes\s+policiales\s+(indicaron|confirmaron)\s+que/gi, replacement: 'Según reportes recibidos,' },
  { pattern: /El\s+Ministerio\s+de\s+(\w+)\s+(confirm[oó]|inform[oó]|precis[oó])\s+que/gi, replacement: 'No se dispone de declaraciones oficiales del Ministerio de $1 sobre' },
  { pattern: /La\s+Fiscal[ií]a\s+(confirm[oó]|inform[oó]|precis[oó])\s+que/gi, replacement: 'Según versiones recogidas,' },
  { pattern: /Las\s+fuentes\s+oficiales\s+(indicaron|confirmaron)\s+que/gi, replacement: 'Según información recopilada,' },
];

const CLOSING_FIXES: { pattern: RegExp; replacement: string }[] = [
  { pattern: /autoridades\s+investigan/gi, replacement: 'El caso continúa en desarrollo' },
  { pattern: /se\s+desconocen\s+las\s+causas/gi, replacement: 'Las circunstancias del hecho continúan bajo revisión' },
  { pattern: /se\s+espera\s+más\s+información/gi, replacement: 'Se continúa recopilando datos sobre el incidente' },
  { pattern: /las\s+autoridades\s+no\s+se\s+han\s+pronunciado/gi, replacement: 'No se han conocido declaraciones formales al cierre de esta información' },
  { pattern: /hasta\s+el\s+momento\s+no\s+hay\s+detenidos/gi, replacement: 'No se reportan personas bajo custodia al momento de publicar esta nota' },
];

// ─── HELPERS ───

async function fetchAdminNews() {
  const res = await fetch(`${SITE_URL}/api/admin/news`, {
    headers: { 'x-admin-token': ADMIN_TOKEN },
  });
  if (!res.ok) throw new Error(`API admin/news failed: ${res.status}`);
  const data = await res.json();
  const news = Array.isArray(data) ? data : (data.news || []);
  if (!Array.isArray(news)) throw new Error('API no devolvió array');
  return news;
}

function countWords(html: string) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(w => w.length > 0).length;
}

function findEmotionalWords(text: string) {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const { pattern } of EMOTIONAL_REPLACEMENTS) {
    const match = lower.match(pattern);
    if (match) found.push(...match);
  }
  return [...new Set(found)];
}

function findInventedSources(text: string) {
  const found: string[] = [];
  for (const { pattern } of INVENTED_FIXES) {
    const match = text.match(pattern);
    if (match) found.push(match[0]);
  }
  return [...new Set(found)];
}

function findGenericClosings(text: string) {
  const found: string[] = [];
  for (const { pattern } of CLOSING_FIXES) {
    const match = text.match(pattern);
    if (match) found.push(match[0]);
  }
  return [...new Set(found)];
}

function fixEmotional(html: string) {
  let fixed = html;
  for (const { pattern, replacement } of EMOTIONAL_REPLACEMENTS) {
    fixed = fixed.replace(pattern, replacement);
  }
  // Limpiar espacios dobles después de eliminaciones
  fixed = fixed.replace(/  +/g, ' ').replace(/> </g, '><').replace(/<p> /g, '<p>').replace(/ <\/p>/g, '</p>');
  return fixed;
}

function fixInventedSources(html: string) {
  let fixed = html;
  for (const { pattern, replacement } of INVENTED_FIXES) {
    fixed = fixed.replace(pattern, replacement);
  }
  return fixed;
}

function fixGenericClosings(html: string) {
  let fixed = html;
  for (const { pattern, replacement } of CLOSING_FIXES) {
    fixed = fixed.replace(pattern, replacement);
  }
  return fixed;
}

async function updateNoticia(id: string, changes: Record<string, unknown>) {
  const res = await fetch(`${SITE_URL}/api/admin/news/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
    body: JSON.stringify(changes),
  });
  return res.ok;
}

// ─── MAIN ───

async function runRepair() {
  console.log('[Reparación] Obteniendo noticias...');
  const noticias = await fetchAdminNews();
  console.log(`[Reparación] ${noticias.length} noticias`);

  const report: any[] = [];
  let repairedEmotional = 0, repairedInvented = 0, repairedClosings = 0;
  const thinNoticias: any[] = [];

  for (let i = 0; i < noticias.length; i++) {
    const n = noticias[i];
    const contenido = n.contenido || '';
    const resumen = n.resumen || '';
    let nuevoContenido = contenido;
    let nuevoResumen = resumen;
    const cambios: string[] = [];

    // 1. Detectar y reparar emocional
    const emotionalBefore = findEmotionalWords(contenido + ' ' + resumen);
    if (emotionalBefore.length > 0) {
      nuevoContenido = fixEmotional(nuevoContenido);
      nuevoResumen = fixEmotional(nuevoResumen);
      cambios.push(`Emocional: ${emotionalBefore.join(', ')}`);
      repairedEmotional++;
    }

    // 2. Detectar y reparar fuentes inventadas
    const inventedBefore = findInventedSources(contenido);
    if (inventedBefore.length > 0) {
      nuevoContenido = fixInventedSources(nuevoContenido);
      cambios.push(`Inventadas: ${inventedBefore.join('; ')}`);
      repairedInvented++;
    }

    // 3. Detectar y reparar cierres genéricos
    const closingsBefore = findGenericClosings(contenido);
    if (closingsBefore.length > 0) {
      nuevoContenido = fixGenericClosings(nuevoContenido);
      cambios.push(`Cierres: ${closingsBefore.join(', ')}`);
      repairedClosings++;
    }

    // 4. Detectar thin content (solo reportar, no reparar automáticamente)
    const words = countWords(contenido);
    const isThin = words < 350;

    // Aplicar cambios si hay
    if (cambios.length > 0) {
      const changes: Record<string, unknown> = {};
      if (nuevoContenido !== contenido) changes.contenido = nuevoContenido;
      if (nuevoResumen !== resumen) changes.resumen = nuevoResumen;

      if (Object.keys(changes).length > 0) {
        console.log(`[Reparación] ${n.slug || n.id}: ${cambios.join(' | ')}`);
        const ok = await updateNoticia(n.id, changes);
        if (!ok) {
          console.error(`[Reparación] FALLÓ actualizar ${n.slug || n.id}`);
        }
      }
    }

    if (isThin) {
      thinNoticias.push({ id: n.id, slug: n.slug, titulo: n.titulo, palabras: words });
    }

    if ((i + 1) % 20 === 0) {
      process.stdout.write(`\r[Reparación] Procesados ${i + 1}/${noticias.length}`);
    }
  }
  console.log();

  // Reporte
  const now = new Date().toLocaleString('es-NI');
  let md = `# Reporte de Reparación — ${noticias.length} Noticias\n\n`;
  md += `**Fecha:** ${now}\n\n`;

  md += `## Correcciones aplicadas automáticamente\n\n`;
  md += `- **Relleno emocional:** ${repairedEmotional} noticias\n`;
  md += `- **Fuentes inventadas:** ${repairedInvented} noticias\n`;
  md += `- **Cierres genéricos:** ${repairedClosings} noticias\n\n`;

  md += `## Thin content — REQUIERE INTERVENCIÓN MANUAL\n\n`;
  md += `${thinNoticias.length} noticias tienen menos de 350 palabras. **No se modificaron automáticamente** para evitar inventar datos.\n\n`;
  for (const t of thinNoticias) {
    md += `- **${t.titulo}** — ${t.palabras} palabras — slug: \`${t.slug}\`\n`;
  }
  md += `\n### Cómo expandir thin content (sin inventar):\n`;
  md += `1. **Contexto geográfico específico:** calles, barrios, puntos de referencia cercanos.\n`;
  md += `2. **Testimonio de segunda fuente:** vecinos, familiares, conductores afectados.\n`;
  md += `3. **Impacto local:** tráfico, cierres de calles, afectación a comercios cercanos.\n`;
  md += `4. **Datos de contacto útiles:** números de emergencia, direcciones de hospitales cercanos.\n`;
  md += `5. **Cronología detallada:** hora exacta, duración del evento, hora de llegada de ayuda.\n\n`;

  const outPath = 'REPARACION_NOTICIAS.md';
  const { writeFileSync } = await import('fs');
  writeFileSync(outPath, md, 'utf8');
  console.log(`[Reparación] Reporte guardado en: ${outPath}`);
  console.log(`[Reparación] Emocional: ${repairedEmotional} | Inventadas: ${repairedInvented} | Cierres: ${repairedClosings} | Thin: ${thinNoticias.length}`);
}

runRepair().catch(err => {
  console.error('[Reparación] Error:', err);
  process.exit(1);
});
