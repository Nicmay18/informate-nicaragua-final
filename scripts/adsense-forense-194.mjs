import { writeFileSync } from 'fs';
import { resolve } from 'path';

const SITE_URL = 'https://nicaraguainformate.com';

// ============================================================================
// 1. OBTENER LAS 194 NOTICIAS CON DATOS REALES (slug correcto + métricas de calidad)
//    Usamos /api/auditor porque list-all no devuelve slug real (usa doc.id, causa 404s falsos)
// ============================================================================
async function fetchNoticias() {
  const res = await fetch(`${SITE_URL}/api/auditor`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API auditor failed: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('API auditor no devolvió un array');
  return data;
}

// ============================================================================
// 2. VERIFICAR URL EN VIVO CON EL SLUG REAL
// ============================================================================
async function checkUrl(slug) {
  if (!slug) return { ok: false, status: 0, url: null, error: 'sin slug' };
  const url = `${SITE_URL}/noticias/${slug}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal, method: 'GET', redirect: 'follow' });
    clearTimeout(timeout);
    return { ok: res.ok, status: res.status, url };
  } catch (err) {
    clearTimeout(timeout);
    return { ok: false, status: 0, url, error: err.message };
  }
}

// ============================================================================
// 3. VERIFICACIÓN DE ELEMENTOS ESTRUCTURALES DEL SITIO (para AdSense)
// ============================================================================
async function checkStructural() {
  const checks = {};
  const paths = [
    { key: 'privacidad', path: '/privacidad' },
    { key: 'terminos', path: '/terminos' },
    { key: 'sobre-nosotros', path: '/sobre-nosotros' },
    { key: 'contacto', path: '/contacto' },
    { key: 'robots', path: '/robots.txt' },
    { key: 'sitemap', path: '/sitemap.xml' },
  ];
  for (const p of paths) {
    try {
      const res = await fetch(`${SITE_URL}${p.path}`, { method: 'GET' });
      checks[p.key] = { ok: res.ok, status: res.status };
    } catch (err) {
      checks[p.key] = { ok: false, status: 0, error: err.message };
    }
  }
  return checks;
}

// ============================================================================
// 4. EJECUCIÓN CON CONCURRENCIA CONTROLADA
// ============================================================================
async function runBatch(items, batchSize, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    process.stdout.write(`\r[Forense] Procesados ${Math.min(i + batchSize, items.length)}/${items.length}`);
  }
  console.log();
  return results;
}

function evaluarCalidad(n) {
  const issues = [];
  let penal = 0;

  if (n.palabras < 350) { issues.push(`Thin content: ${n.palabras} palabras (mínimo 350)`); penal += 30; }
  else if (n.palabras < 500) { issues.push(`Contenido corto: ${n.palabras} palabras (ideal 500+)`); penal += 10; }

  if (n.relleno >= 4) { issues.push(`Alto relleno emocional (${n.relleno} términos)`); penal += 15; }
  else if (n.relleno >= 2) { issues.push(`Relleno emocional moderado (${n.relleno} términos)`); penal += 5; }

  if (n.transiciones_ia >= 6) { issues.push(`Alto uso de transiciones genéricas de IA (${n.transiciones_ia})`); penal += 15; }
  else if (n.transiciones_ia >= 3) { issues.push(`Transiciones IA moderadas (${n.transiciones_ia})`); penal += 5; }

  if (n.fuentes_atribuidas === 0 && n.citas === 0) { issues.push('Sin fuentes atribuidas ni citas directas'); penal += 10; }

  if (n.densidad === 0) { issues.push('Sin densidad de datos concretos detectada'); penal += 5; }

  const scoreFinal = Math.max(0, Math.min(100, n.score - penal + (issues.length === 0 ? 0 : 0)));

  return { issues, scoreFinal };
}

async function runAudit() {
  console.log('[Forense] Obteniendo 194 noticias reales desde /api/auditor...');
  const noticias = await fetchNoticias();
  console.log(`[Forense] ${noticias.length} noticias encontradas`);

  console.log('[Forense] Verificando URLs en vivo con slug real (batch de 5)...');
  const urlChecks = await runBatch(noticias, 5, (n) => checkUrl(n.slug));

  console.log('[Forense] Verificando elementos estructurales del sitio...');
  const structural = await checkStructural();

  const results = [];
  let apto = 0, revision = 0, noApto = 0;
  let urlRotas = 0;

  for (let i = 0; i < noticias.length; i++) {
    const n = noticias[i];
    const urlCheck = urlChecks[i];
    const { issues, scoreFinal } = evaluarCalidad(n);

    if (!urlCheck.ok) {
      issues.push(`URL no responde correctamente (HTTP ${urlCheck.status || 'timeout'})`);
      urlRotas++;
    }

    let estado;
    if (scoreFinal >= 85 && urlCheck.ok && issues.length === 0) { estado = 'APTO'; apto++; }
    else if (scoreFinal < 50 || !urlCheck.ok) { estado = 'NO APTO'; noApto++; }
    else { estado = 'REVISIÓN MANUAL'; revision++; }

    results.push({
      titulo: n.titulo,
      slug: n.slug,
      estado,
      palabras: n.palabras,
      scoreOriginal: n.score,
      nivelOriginal: n.nivel,
      scoreFinal,
      issues,
      urlOk: urlCheck.ok,
      urlStatus: urlCheck.status,
    });
  }

  // ==========================================================================
  // GENERAR REPORTE
  // ==========================================================================
  let md = `# Auditoría Forense AdSense — 194 Noticias — Nicaragua Informate\n\n`;
  md += `**Fecha:** ${new Date().toLocaleString('es-NI')}\n`;
  md += `**Dominio:** ${SITE_URL}\n`;
  md += `**Método:** Datos reales vía /api/auditor (contenido, relleno, transiciones IA, fuentes) + verificación HTTP GET de cada URL con slug real\n\n`;

  md += `## Resumen Ejecutivo\n\n`;
  md += `- **Total evaluadas:** ${noticias.length}\n`;
  md += `- **APTO:** ${apto} (${Math.round((apto / noticias.length) * 100)}%)\n`;
  md += `- **REVISIÓN MANUAL:** ${revision} (${Math.round((revision / noticias.length) * 100)}%)\n`;
  md += `- **NO APTO:** ${noApto} (${Math.round((noApto / noticias.length) * 100)}%)\n`;
  md += `- **URLs rotas o inaccesibles:** ${urlRotas}\n\n`;

  md += `## Elementos estructurales del sitio (requeridos por AdSense)\n\n`;
  for (const [key, val] of Object.entries(structural)) {
    md += `- **${key}:** ${val.ok ? '✅ OK' : `❌ FALTA (HTTP ${val.status})`}\n`;
  }
  md += `\n`;

  const faltantes = Object.entries(structural).filter(([, v]) => !v.ok);
  if (faltantes.length > 0) {
    md += `> ⚠️ **Riesgo crítico:** Google AdSense rechaza sitios sin Política de Privacidad, Términos y páginas institucionales accesibles. Faltan: ${faltantes.map(([k]) => k).join(', ')}.\n\n`;
  }

  md += `---\n\n`;

  md += `## ❌ Noticias NO APTAS (${noApto})\n\n`;
  for (const r of results.filter(x => x.estado === 'NO APTO')) {
    md += `### ${r.titulo}\n`;
    md += `- **Slug:** \`${r.slug}\`\n`;
    md += `- **Palabras:** ${r.palabras} | **Score original:** ${r.scoreOriginal} (${r.nivelOriginal}) | **Score forense:** ${r.scoreFinal}\n`;
    md += `- **URL viva:** ${r.urlOk ? 'Sí' : `No (HTTP ${r.urlStatus})`}\n`;
    md += `- **Problemas:**\n`;
    for (const i of r.issues) md += `  - ${i}\n`;
    md += `\n`;
  }

  md += `## ⚠️ Noticias en REVISIÓN MANUAL (${revision})\n\n`;
  for (const r of results.filter(x => x.estado === 'REVISIÓN MANUAL')) {
    md += `### ${r.titulo}\n`;
    md += `- **Slug:** \`${r.slug}\`\n`;
    md += `- **Palabras:** ${r.palabras} | **Score forense:** ${r.scoreFinal}\n`;
    md += `- **Problemas:**\n`;
    for (const i of r.issues) md += `  - ${i}\n`;
    md += `\n`;
  }

  md += `## ✅ Noticias APTAS (${apto})\n\n`;
  for (const r of results.filter(x => x.estado === 'APTO')) {
    md += `- **${r.titulo}** — ${r.palabras} palabras, score ${r.scoreFinal}\n`;
  }
  md += `\n`;

  md += `## Veredicto Forense Final\n\n`;
  const pctNoApto = Math.round((noApto / noticias.length) * 100);
  if (pctNoApto > 10 || faltantes.length > 0) {
    md += `**NO RECOMENDADO aplicar a AdSense todavía.** ${pctNoApto}% de las noticias tienen problemas graves y/o faltan páginas estructurales obligatorias. Google exige que menos del 10% del contenido presente fallas de calidad y que existan páginas institucionales completas.\n\n`;
  } else {
    md += `**Condiciones aceptables para aplicar a AdSense**, con ${pctNoApto}% de contenido problemático (por debajo del umbral de riesgo del 10%).\n\n`;
  }

  md += `## Recomendaciones prioritarias\n\n`;
  md += `1. Corregir o despublicar las ${noApto} noticias NO APTAS antes de aplicar.\n`;
  md += `2. Revisar manualmente las ${revision} noticias en zona gris (relleno emocional, transiciones IA, falta de fuentes).\n`;
  md += `3. Completar cualquier página estructural faltante detectada arriba.\n`;
  md += `4. Volver a correr esta auditoría después de las correcciones para confirmar antes de enviar la solicitud a AdSense.\n`;

  const outPath = resolve(process.cwd(), 'AUDITORIA_FORENSE_194.md');
  writeFileSync(outPath, md, 'utf8');
  console.log(`\n[Forense] Reporte guardado en: ${outPath}`);
  console.log(`[Forense] APTO: ${apto} | REVISIÓN: ${revision} | NO APTO: ${noApto} | URLs rotas: ${urlRotas}`);
}

runAudit().catch(err => {
  console.error('[Forense] Error:', err);
  process.exit(1);
});
