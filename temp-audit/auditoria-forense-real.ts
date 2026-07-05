import { writeFileSync } from 'fs';
import { analizarNoticia, NoticiaInput } from '../lib/analizador-noticias';

const SITE_URL = 'https://nicaraguainformate.com';
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || process.env.ADMIN_TOKEN || 'ni-admin-2026-informate';

async function fetchAdminNews() {
  const res = await fetch(`${SITE_URL}/api/admin/news`, {
    headers: { 'x-admin-token': ADMIN_TOKEN },
  });
  if (!res.ok) throw new Error(`API admin/news failed: ${res.status}`);
  const data = await res.json();
  const news = Array.isArray(data) ? data : (data.news || []);
  if (!Array.isArray(news)) throw new Error('API no devolvió array de noticias');
  return news;
}

async function runAudit() {
  console.log('[Auditoria Forense REAL] Obteniendo noticias...');
  const noticias = await fetchAdminNews();
  console.log(`[Auditoria Forense REAL] ${noticias.length} noticias encontradas`);

  const nivelesCount: Record<string, number> = {};
  const results: any[] = [];
  let forenseCount = 0, oroCount = 0, plataCount = 0, bronceCount = 0, rechazadoCount = 0;
  let thinCount = 0, emotionalCount = 0, inventedCount = 0, closingCount = 0;

  for (let i = 0; i < noticias.length; i++) {
    const n = noticias[i];
    const input: NoticiaInput = {
      titulo: n.titulo || '',
      contenido: n.contenido || '',
      resumen: n.resumen || '',
      categoria: n.categoria || 'General',
      autor: n.autor || 'Nicaragua Informate',
      fecha: n.fecha || new Date().toISOString(),
      slug: n.slug || n.id || '',
      imagen: n.imagen || '',
    };

    let r: any;
    try {
      r = await analizarNoticia(input);
    } catch (e: any) {
      console.error(`[Auditoria Forense REAL] Error analizando ${n.slug}:`, e.message);
      continue;
    }

    const nivel = r.nivel || 'DESCONOCIDO';
    nivelesCount[nivel] = (nivelesCount[nivel] || 0) + 1;

    if (nivel === 'FORENSE') forenseCount++;
    else if (nivel === 'ORO') oroCount++;
    else if (nivel === 'PLATA') plataCount++;
    else if (nivel === 'BRONCE') bronceCount++;
    else if (nivel === 'RECHAZADO') rechazadoCount++;

    // Thin content check
    const palabras = (n.contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter((w: string) => w.length > 0).length;
    if (palabras < 350) thinCount++;

    // Check emotional words
    const emotionalWords = ['tragedia','trágico','terrible','impactante','devastador','horrible','alarmante','desgarrador','lamentable','dramático','crítico','escalofriante','espeluznante','increíble','inimaginable','escandaloso','vergonzoso','aterrador','mortífero','sangriento','brutal','salvaje','violento','agresivo','fatal','horror','consternación','dolor','perdió la vida','pesar','conmoción','tristeza','angustia','desolación'];
    const lowerContent = (n.contenido || '').toLowerCase();
    const foundEmotional = emotionalWords.filter(w => lowerContent.includes(w));
    if (foundEmotional.length > 0) emotionalCount++;

    // Check invented sources
    const inventedPatterns = [
      /La\s+Polic[ií]a\s+Nacional\s+(de\s+Nicaragua\s+)?(confirm[oó]|inform[oó]|precis[oó]|señal[oó])/i,
      /El\s+MINSA\s+(confirm[oó]|inform[oó]|precis[oó]|señal[oó])/i,
      /Las\s+autoridades\s+(confirmaron|informaron|precisaron|señalaron)/i,
      /Fuentes\s+policiales\s+(indicaron|confirmaron)/i,
      /El\s+Ministerio\s+de\s+\w+\s+(confirm[oó]|inform[oó]|precis[oó])/i,
      /La\s+Fiscal[ií]a\s+(confirm[oó]|inform[oó]|precis[oó])/i,
      /Las\s+fuentes\s+oficiales\s+(indicaron|confirmaron)/i,
    ];
    let foundInvented = false;
    for (const p of inventedPatterns) {
      if (p.test(n.contenido || '')) { foundInvented = true; break; }
    }
    if (foundInvented) inventedCount++;

    // Check generic closings
    const genericClosings = ['autoridades investigan','se desconocen las causas','se espera más información','las autoridades no se han pronunciado','hasta el momento no hay detenidos'];
    const lowerContent2 = (n.contenido || '').toLowerCase();
    let foundClosing = false;
    for (const phrase of genericClosings) {
      if (lowerContent2.includes(phrase)) { foundClosing = true; break; }
    }
    if (foundClosing) closingCount++;

    results.push({
      titulo: n.titulo || '(Sin título)',
      slug: n.slug || n.id || '',
      id: n.id,
      nivel,
      aprobado: r.aprobado,
      score: r.score,
      palabras,
      filtros: r.filtros,
      checks: r.checks,
      acciones: r.acciones,
      foundEmotional,
      foundInvented,
      foundClosing,
    });

    if ((i + 1) % 10 === 0) {
      process.stdout.write(`\r[Auditoria Forense REAL] Procesados ${i + 1}/${noticias.length}`);
    }
  }
  console.log();

  // Generar reporte
  const now = new Date().toLocaleString('es-NI');
  let md = `# Auditoria Forense REAL — ${noticias.length} Noticias\n\n`;
  md += `**Fecha:** ${now}\n`;
  md += `**Dominio:** ${SITE_URL}\n`;
  md += `**Analizador:** Nicaragua Informate v2.0 (min 350 palabras)\n\n`;

  md += `## Resumen Ejecutivo\n\n`;
  md += `- **Total noticias:** ${noticias.length}\n`;
  md += `- **FORENSE:** ${forenseCount} (${Math.round((forenseCount / noticias.length) * 100)}%)\n`;
  md += `- **ORO:** ${oroCount} (${Math.round((oroCount / noticias.length) * 100)}%)\n`;
  md += `- **PLATA:** ${plataCount} (${Math.round((plataCount / noticias.length) * 100)}%)\n`;
  md += `- **BRONCE:** ${bronceCount} (${Math.round((bronceCount / noticias.length) * 100)}%)\n`;
  md += `- **RECHAZADO:** ${rechazadoCount} (${Math.round((rechazadoCount / noticias.length) * 100)}%)\n\n`;

  md += `## Problemas detectados\n\n`;
  md += `- **Thin content (<350 palabras):** ${thinCount} noticias (${Math.round((thinCount / noticias.length) * 100)}%)\n`;
  md += `- **Relleno emocional:** ${emotionalCount} noticias (${Math.round((emotionalCount / noticias.length) * 100)}%)\n`;
  md += `- **Fuentes inventadas:** ${inventedCount} noticias (${Math.round((inventedCount / noticias.length) * 100)}%)\n`;
  md += `- **Cierres genericos:** ${closingCount} noticias (${Math.round((closingCount / noticias.length) * 100)}%)\n\n`;

  // Detalle por noticia
  md += `## Detalle por noticia\n\n`;
  for (const r of results) {
    const icon = r.nivel === 'FORENSE' ? '🥇' : r.nivel === 'ORO' ? '🥈' : r.nivel === 'PLATA' ? '🥉' : r.nivel === 'BRONCE' ? '⚠️' : '❌';
    md += `### ${icon} ${r.titulo}\n`;
    md += `- **Slug:** ${r.slug}\n`;
    md += `- **Nivel:** ${r.nivel}\n`;
    md += `- **Score:** ${r.score}\n`;
    md += `- **Aprobado:** ${r.aprobado ? 'Sí' : 'No'}\n`;
    md += `- **Palabras:** ${r.palabras}\n`;

    if (r.filtros) {
      md += `- **Filtros:**\n`;
      for (const [k, v] of Object.entries(r.filtros)) {
        const fv = v as any;
        md += `  - ${k}: ${fv.aprobado ? '✅' : '❌'} (${fv.puntuacion}%)\n`;
      }
    }

    if (r.checks && r.checks.length > 0) {
      const fails = r.checks.filter((c: any) => !c.pasa);
      if (fails.length > 0) {
        md += `- **Checks FALLIDOS:**\n`;
        for (const c of fails) {
          md += `  - ${c.nombre}: ${c.mensaje || 'Falla'}\n`;
        }
      }
    }

    if (r.foundEmotional.length > 0) md += `- **Emocional:** ${r.foundEmotional.join(', ')}\n`;
    if (r.foundInvented) md += `- **⚠️ FUENTES INVENTADAS detectadas**\n`;
    if (r.foundClosing) md += `- **⚠️ CIERRE GENERICO detectado**\n`;
    if (r.acciones && r.acciones.length > 0) md += `- **Acciones:** ${r.acciones.join('; ')}\n`;
    md += `\n`;
  }

  md += `## Recomendaciones para AdSense\n\n`;
  const totalProblematicas = thinCount + emotionalCount + inventedCount + closingCount;
  md += `1. **${rechazadoCount} noticias RECHAZADAS** — deben reescribirse o eliminarse.\n`;
  md += `2. **${bronceCount} noticias BRONCE** — revisar checks fallidos y mejorar.\n`;
  md += `3. **${thinCount} noticias thin content** — expandir a 350+ palabras con datos verificables.\n`;
  md += `4. **Meta crítica:** menos del 10% del sitio debe tener problemas graves.\n\n`;

  const outPath = 'AUDITORIA_FORENSE_REAL.md';
  writeFileSync(outPath, md, 'utf8');
  console.log(`[Auditoria Forense REAL] Reporte guardado en: ${outPath}`);
  console.log(`[Auditoria Forense REAL] FORENSE:${forenseCount} ORO:${oroCount} PLATA:${plataCount} BRONCE:${bronceCount} RECHAZADO:${rechazadoCount}`);
  console.log(`[Auditoria Forense REAL] Thin:${thinCount} Emocional:${emotionalCount} Inventadas:${inventedCount} Cierres:${closingCount}`);
}

runAudit().catch(err => {
  console.error('[Auditoria Forense REAL] Error:', err);
  process.exit(1);
});
