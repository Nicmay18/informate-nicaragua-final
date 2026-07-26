import { writeFileSync } from 'fs';
import { resolve } from 'path';
const SITE_URL = 'https://nicaraguainformate.com';

async function fetchNoticias() {
  const res = await fetch(`${SITE_URL}/api/auditor`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API auditor failed: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('No array');
  return data;
}

async function checkUrl(slug) {
  if (!slug) return { ok: false, status: 0 };
  const url = `${SITE_URL}/noticias/${slug}`;
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const res = await fetch(url, { signal: c.signal, method: 'GET', redirect: 'follow' });
    clearTimeout(t);
    return { ok: res.ok, status: res.status };
  } catch (e) { clearTimeout(t); return { ok: false, status: 0 }; }
}

async function checkStructural() {
  const checks = {};
  const paths = [
    ['privacidad', '/privacidad'], ['terminos', '/terminos'],
    ['sobre-nosotros', '/sobre-nosotros'], ['contacto', '/contacto'],
    ['robots', '/robots.txt'], ['sitemap', '/sitemap.xml'],
    ['noticias-home', '/noticias'], ['home', '/'],
  ];
  for (const [key, path] of paths) {
    try {
      const res = await fetch(`${SITE_URL}${path}`, { method: 'GET' });
      checks[key] = { ok: res.ok, status: res.status };
    } catch (e) { checks[key] = { ok: false, status: 0 }; }
  }
  return checks;
}

const PROHIBITED = ['porno','xxx','sexo explicito','desnudo','escort','prostituta','cocaina','heroina','crack','hackear','torrent','warez','apuesta','casino','ruleta','tortura','violar'];

async function runBatch(items, bs, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += bs) {
    const batch = items.slice(i, i + bs);
    out.push(...await Promise.all(batch.map(fn)));
    process.stdout.write(`\r[Veredicto] URLs ${Math.min(i+bs,items.length)}/${items.length}`);
  }
  console.log();
  return out;
}

async function run() {
  console.log('[Veredicto] Obteniendo datos del Editor Jefe IA...');
  const noticias = await fetchNoticias();
  console.log(`[Veredicto] ${noticias.length} noticias`);

  console.log('[Veredicto] Verificando URLs...');
  const urlChecks = await runBatch(noticias, 5, n => checkUrl(n.slug));
  console.log('[Veredicto] Verificando paginas estructurales...');
  const struct = await checkStructural();

  let oro=0, bronce=0, peligro=0, urlRotas=0, prohibidas=0, aptas=0, noAptas=0;
  const noAptasLista = [];

  for (let i = 0; i < noticias.length; i++) {
    const n = noticias[i];
    const uc = urlChecks[i];
    const nivel = n.nivel || '', score = n.score || 0, pal = n.palabras || 0;
    if (nivel.includes('ORO')) oro++;
    else if (nivel.includes('BRONCE')) bronce++;
    else peligro++;

    const issues = [];
    if (!uc.ok) { issues.push(`URL no responde (HTTP ${uc.status||'timeout'})`); urlRotas++; }
    const lower = (n.titulo||'').toLowerCase();
    if (PROHIBITED.some(kw => lower.includes(kw))) { issues.push('Contenido prohibido'); prohibidas++; }
    if (score < 75) issues.push(`Score: ${score} (req 75+)`);
    if (pal < 350) issues.push(`Palabras: ${pal} (min 350)`);

    if (issues.length === 0) aptas++;
    else { noAptas++; noAptasLista.push({ titulo:n.titulo, slug:n.slug, nivel, score, pal, issues, urlOk:uc.ok }); }
  }

  const faltantes = Object.entries(struct).filter(([,v]) => !v.ok);
  let md = `# VEREDICTO FINAL ADSENSE — Nicaragua Informate\n\n`;
  md += `**Fecha:** ${new Date().toLocaleString('es-NI')}\n`;
  md += `**Dominio:** ${SITE_URL}\n`;
  md += `**Metodo:** Editor Jefe IA real + HTTP GET + paginas estructurales\n\n`;
  md += `## Resumen\n\n`;
  md += `| Metrica | Valor |\n|---------|-------|\n`;
  md += `| Total | ${noticias.length} |\n`;
  md += `| ORO | ${oro} (${Math.round(oro/noticias.length*100)}%) |\n`;
  md += `| BRONCE | ${bronce} (${Math.round(bronce/noticias.length*100)}%) |\n`;
  md += `| PELIGRO | ${peligro} (${Math.round(peligro/noticias.length*100)}%) |\n`;
  md += `| Aptas AdSense | ${aptas} (${Math.round(aptas/noticias.length*100)}%) |\n`;
  md += `| No aptas | ${noAptas} (${Math.round(noAptas/noticias.length*100)}%) |\n`;
  md += `| URLs rotas | ${urlRotas} |\n`;
  md += `| Prohibido | ${prohibidas} |\n\n`;
  md += `## Paginas estructurales\n\n`;
  for (const [k,v] of Object.entries(struct)) md += `- ${k}: ${v.ok?'OK':'FALTA'}\n`;
  md += `\n`;

  if (noAptas === 0 && faltantes.length === 0) {
    md += `## VEREDICTO: APTO PARA APLICAR A ADSENSE\n\nLas ${noticias.length} notas pasan el Editor Jefe IA. Sin URLs rotas, sin contenido prohibido, paginas estructurales completas.\n\n`;
  } else if (noAptas <= Math.ceil(noticias.length*0.10) && faltantes.length === 0) {
    md += `## VEREDICTO: CONDICIONALMENTE APTO\n\n${noAptas} notas no pasan (${Math.round(noAptas/noticias.length*100)}%), bajo el 10% de tolerancia. Corregir antes de aplicar recomendado pero no bloqueante.\n\n`;
  } else {
    md += `## VEREDICTO: NO APTO AUN\n\n${noAptas} notas no pasan. ${faltantes.length>0?`Faltan paginas: ${faltantes.map(([k])=>k).join(', ')}.`:''} Corregir antes de aplicar.\n\n`;
  }

  if (noAptasLista.length > 0) {
    md += `## No aptas (${noAptasLista.length})\n\n`;
    for (const d of noAptasLista) {
      md += `### ${d.titulo}\n- Slug: ${d.slug} | ${d.nivel} | Score: ${d.score} | Pal: ${d.pal}\n- URL: ${d.urlOk?'OK':'ROTA'}\n- Problemas:\n`;
      for (const i of d.issues) md += `  - ${i}\n`;
      md += `\n`;
    }
  }

  md += `## Distribucion de scores\n\n`;
  const r = { '90-100':0, '80-89':0, '75-79':0, '<75':0 };
  for (const n of noticias) { const s=n.score||0; if(s>=90)r['90-100']++; else if(s>=80)r['80-89']++; else if(s>=75)r['75-79']++; else r['<75']++; }
  for (const [k,v] of Object.entries(r)) md += `- ${k}: ${v}\n`;
  md += `\n*Generado por auditoria forense real*\n`;

  const out = resolve(process.cwd(), 'VEREDICTO_ADSENSE_FINAL.md');
  writeFileSync(out, md, 'utf8');
  console.log(`[Veredicto] Reporte: ${out}`);
  console.log(`[Veredicto] APTAS: ${aptas} | NO APTAS: ${noAptas} | URLs rotas: ${urlRotas}`);
  console.log(`[Veredicto] ORO: ${oro} | BRONCE: ${bronce} | PELIGRO: ${peligro}`);
}

run().catch(e => { console.error('[Veredicto] Error:', e); process.exit(1); });
