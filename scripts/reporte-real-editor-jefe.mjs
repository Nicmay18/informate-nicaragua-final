import { writeFileSync } from 'fs';
import { resolve } from 'path';
const SITE = 'https://nicaraguainformate.com';

async function fetchNoticias() {
  const res = await fetch(`${SITE}/api/auditor`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API auditor: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('No array');
  return data;
}

async function checkUrl(slug) {
  if (!slug) return { ok: false, status: 0 };
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const res = await fetch(`${SITE}/noticias/${slug}`, { signal: c.signal, method: 'GET', redirect: 'follow' });
    clearTimeout(t);
    return { ok: res.ok, status: res.status };
  } catch { clearTimeout(t); return { ok: false, status: 0 }; }
}

async function checkStructural() {
  const paths = [
    ['privacidad', '/privacidad'], ['terminos', '/terminos'],
    ['sobre-nosotros', '/sobre-nosotros'], ['contacto', '/contacto'],
    ['robots', '/robots.txt'], ['sitemap', '/sitemap.xml'],
    ['noticias', '/noticias'], ['home', '/'],
  ];
  const out = {};
  for (const [k, p] of paths) {
    try { const r = await fetch(`${SITE}${p}`); out[k] = { ok: r.ok, status: r.status }; }
    catch { out[k] = { ok: false, status: 0 }; }
  }
  return out;
}

async function batch(items, bs, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += bs) {
    const b = items.slice(i, i + bs);
    out.push(...await Promise.all(b.map(fn)));
    process.stdout.write(`\r  URLs ${Math.min(i+bs,items.length)}/${items.length}`);
  }
  console.log();
  return out;
}

async function run() {
  console.log('1. Obteniendo evaluaciones del Editor Jefe IA...');
  const noticias = await fetchNoticias();
  console.log(`   ${noticias.length} notas evaluadas`);

  console.log('2. Verificando URLs en vivo...');
  const urls = await batch(noticias, 5, n => checkUrl(n.slug));

  console.log('3. Verificando paginas estructurales...');
  const struct = await checkStructural();

  // Contar niveles
  let oro = 0, bronce = 0, peligro = 0;
  let urlRotas = 0;
  const peligroLista = [];
  const bronceLista = [];
  const oroLista = [];

  for (let i = 0; i < noticias.length; i++) {
    const n = noticias[i];
    const u = urls[i];
    const nivel = n.nivel || '';
    const score = n.score || 0;
    const pal = n.palabras || 0;

    if (nivel.includes('ORO')) { oro++; oroLista.push({ ...n, urlOk: u.ok, urlStatus: u.status }); }
    else if (nivel.includes('BRONCE')) { bronce++; bronceLista.push({ ...n, urlOk: u.ok, urlStatus: u.status }); }
    else { peligro++; peligroLista.push({ ...n, urlOk: u.ok, urlStatus: u.status }); }

    if (!u.ok) urlRotas++;
  }

  // Score promedio
  const avgScore = Math.round(noticias.reduce((s, n) => s + (n.score || 0), 0) / noticias.length);
  const minScore = Math.min(...noticias.map(n => n.score || 0));
  const maxScore = Math.max(...noticias.map(n => n.score || 0));

  // Palabras promedio
  const avgPal = Math.round(noticias.reduce((s, n) => s + (n.palabras || 0), 0) / noticias.length);
  const minPal = Math.min(...noticias.map(n => n.palabras || 0));
  const maxPal = Math.max(...noticias.map(n => n.palabras || 0));

  // Relleno promedio
  const avgRelleno = (noticias.reduce((s, n) => s + (n.relleno || 0), 0) / noticias.length).toFixed(1);
  const avgTrans = (noticias.reduce((s, n) => s + (n.transiciones_ia || 0), 0) / noticias.length).toFixed(1);
  const avgFuentes = (noticias.reduce((s, n) => s + (n.fuentes_atribuidas || 0), 0) / noticias.length).toFixed(1);
  const avgCitas = (noticias.reduce((s, n) => s + (n.citas || 0), 0) / noticias.length).toFixed(1);
  const avgDens = (noticias.reduce((s, n) => s + (n.densidad || 0), 0) / noticias.length).toFixed(1);

  // Páginas estructurales
  const structOk = Object.values(struct).every(v => v.ok);
  const structFaltan = Object.entries(struct).filter(([, v]) => !v.ok).map(([k]) => k);

  // ==========================================================================
  // REPORTE
  // ==========================================================================
  let md = `# REPORTE REAL DEL EDITOR JEFE IA — Nicaragua Informate\n\n`;
  md += `**Fecha:** ${new Date().toLocaleString('es-NI')}\n`;
  md += `**Dominio:** ${SITE}\n`;
  md += `**Fuente de datos:** /api/auditor (Editor Jefe IA real, sin criterios inventados)\n\n`;

  md += `## Como puntua el Editor Jefe IA\n\n`;
  md += `| Criterio | Max | Detalle |\n|----------|-----|---------|\n`;
  md += `| Palabras | 20 | 450+ = 20 pts, 350-449 = 14 pts, 250-349 = 7 pts |\n`;
  md += `| Relleno emocional | 20 | 0-1 palabras = 20 pts, 2-3 = 10 pts, 4+ = 0 pts |\n`;
  md += `| Transiciones IA | 20 | 0-2 = 20 pts, 3-5 = 10 pts, 6+ = 0 pts |\n`;
  md += `| Densidad de datos | 15 | >=2% = 15 pts, >=1% = 11 pts, >0% = 6 pts |\n`;
  md += `| Variacion | 10 | Siempre 10 pts |\n`;
  md += `| Contexto geografico | 10 | >=1 lugar = 10 pts |\n`;
  md += `| Fuentes/citas | 5 | >=1 fuente o cita = 5 pts |\n`;
  md += `| **TOTAL** | **100** | **>=90 = ORO, >=75 = BRONCE, <75 = PELIGRO** |\n\n`;

  md += `## Resumen general\n\n`;
  md += `| Metrica | Valor |\n|---------|-------|\n`;
  md += `| Total notas | ${noticias.length} |\n`;
  md += `| ORO (score 90+) | ${oro} (${Math.round(oro/noticias.length*100)}%) |\n`;
  md += `| BRONCE (score 75-89) | ${bronce} (${Math.round(bronce/noticias.length*100)}%) |\n`;
  md += `| PELIGRO (score <75) | ${peligro} (${Math.round(peligro/noticias.length*100)}%) |\n`;
  md += `| Score promedio | ${avgScore} |\n`;
  md += `| Score minimo | ${minScore} |\n`;
  md += `| Score maximo | ${maxScore} |\n`;
  md += `| Palabras promedio | ${avgPal} |\n`;
  md += `| Palabras minimo | ${minPal} |\n`;
  md += `| Palabras maximo | ${maxPal} |\n`;
  md += `| Relleno promedio | ${avgRelleno} |\n`;
  md += `| Transiciones promedio | ${avgTrans} |\n`;
  md += `| Fuentes promedio | ${avgFuentes} |\n`;
  md += `| Citas promedio | ${avgCitas} |\n`;
  md += `| Densidad promedio | ${avgDens}% |\n`;
  md += `| URLs rotas | ${urlRotas} |\n\n`;

  md += `## Paginas estructurales (obligatorias AdSense)\n\n`;
  for (const [k, v] of Object.entries(struct)) {
    md += `- ${k}: ${v.ok ? 'OK' : 'FALTA (HTTP ' + v.status + ')'}\n`;
  }
  md += `\n`;

  // Veredicto
  md += `## VEREDICTO\n\n`;
  const todoBien = peligro === 0 && urlRotas === 0 && structOk;
  if (todoBien) {
    md += `**APTO PARA APLICAR A ADSENSE.**\n\n`;
    md += `- ${noticias.length}/${noticias.length} notas con score >= 75 (BRONCE u ORO)\n`;
    md += `- 0 notas en PELIGRO\n`;
    md += `- 0 URLs rotas\n`;
    md += `- ${Object.keys(struct).length}/${Object.keys(struct).length} paginas estructurales presentes\n`;
    md += `- Score promedio: ${avgScore}/100\n\n`;
  } else {
    md += `**NO APTO AUN.** Pendiente:\n`;
    if (peligro > 0) md += `- ${peligro} notas en PELIGRO (score <75)\n`;
    if (urlRotas > 0) md += `- ${urlRotas} URLs rotas\n`;
    if (!structOk) md += `- Paginas faltantes: ${structFaltan.join(', ')}\n`;
    md += `\n`;
  }

  // ==========================================================================
  // DETALLE DE CADA NOTA
  // ==========================================================================
  md += `## Detalle de las ${noticias.length} notas\n\n`;
  md += `| # | Titulo | Nivel | Score | Palabras | Relleno | Trans | Fuentes | Citas | Dens% | URL |\n`;
  md += `|---|--------|-------|-------|----------|---------|-------|---------|-------|-------|-----|\n`;

  const sorted = [...noticias].map((n, i) => ({ ...n, urlOk: urls[i].ok, urlStatus: urls[i].status }))
    .sort((a, b) => (a.score || 0) - (b.score || 0));

  sorted.forEach((n, idx) => {
    const titulo = (n.titulo || '').substring(0, 50);
    const urlStatus = n.urlOk ? 'OK' : 'ROTA';
    md += `| ${idx+1} | ${titulo} | ${n.nivel || ''} | ${n.score || 0} | ${n.palabras || 0} | ${n.relleno || 0} | ${n.transiciones_ia || 0} | ${n.fuentes_atribuidas || 0} | ${n.citas || 0} | ${n.densidad || 0} | ${urlStatus} |\n`;
  });

  // Notas en PELIGRO si las hay
  if (peligroLista.length > 0) {
    md += `\n## Notas en PELIGRO (${peligroLista.length})\n\n`;
    for (const n of peligroLista) {
      md += `### ${n.titulo}\n`;
      md += `- Score: ${n.score} | Palabras: ${n.palabras} | Relleno: ${n.relleno} | Trans: ${n.transiciones_ia} | Fuentes: ${n.fuentes_atribuidas} | Citas: ${n.citas} | Dens: ${n.densidad}%\n`;
      md += `- URL: ${n.urlOk ? 'OK' : 'ROTA'}\n\n`;
    }
  }

  // Notas BRONCE con score mas bajo (las 10 mas bajas)
  md += `\n## Las 10 notas con score mas bajo\n\n`;
  const lowest10 = sorted.slice(0, 10);
  for (const n of lowest10) {
    md += `### ${n.titulo}\n`;
    md += `- Nivel: ${n.nivel} | Score: ${n.score} | Palabras: ${n.palabras} | Relleno: ${n.relleno} | Trans: ${n.transiciones_ia} | Fuentes: ${n.fuentes_atribuidas} | Citas: ${n.citas} | Dens: ${n.densidad}%\n`;
    md += `- URL: ${n.urlOk ? 'OK' : 'ROTA'}\n`;
    md += `- Slug: ${n.slug}\n\n`;
  }

  // Las 10 con score mas alto
  md += `\n## Las 10 notas con score mas alto\n\n`;
  const top10 = sorted.slice(-10).reverse();
  for (const n of top10) {
    md += `### ${n.titulo}\n`;
    md += `- Nivel: ${n.nivel} | Score: ${n.score} | Palabras: ${n.palabras} | Relleno: ${n.relleno} | Trans: ${n.transiciones_ia} | Fuentes: ${n.fuentes_atribuidas} | Citas: ${n.citas} | Dens: ${n.densidad}%\n`;
    md += `- URL: ${n.urlOk ? 'OK' : 'ROTA'}\n`;
    md += `- Slug: ${n.slug}\n\n`;
  }

  md += `\n---\n*Reporte generado por el Editor Jefe IA real. Sin criterios inventados.*\n`;

  const out = resolve(process.cwd(), 'REPORTE_REAL_EDITOR_JEFE_IA.md');
  writeFileSync(out, md, 'utf8');
  console.log(`\nReporte: ${out}`);
  console.log(`\n=== RESUMEN ===`);
  console.log(`ORO: ${oro} | BRONCE: ${bronce} | PELIGRO: ${peligro}`);
  console.log(`Score promedio: ${avgScore} | URLs rotas: ${urlRotas}`);
  console.log(`Paginas estructurales: ${structOk ? 'TODAS OK' : 'FALTAN: ' + structFaltan.join(', ')}`);
  console.log(`Veredicto: ${todoBien ? 'APTO PARA ADSENSE' : 'NO APTO AUN'}`);
}

run().catch(e => { console.error('Error:', e); process.exit(1); });
