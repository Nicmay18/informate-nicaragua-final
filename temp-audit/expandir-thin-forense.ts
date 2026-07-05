import { writeFileSync } from 'fs';
import { analizarNoticia, NoticiaInput } from '../lib/analizador-noticias';

const SITE_URL = 'https://nicaraguainformate.com';
const ADMIN_TOKEN = 'ni-admin-2026-informate';

// Las 15 thin content identificadas en REPARACION_NOTICIAS.md
const THIN_SLUGS = [
  'caen-cinco-rivenses-con-100-frascos-de-ketamina-en-chontales',
  'hallan-fallecida-a-mujer-de-73-anos-en-matiguas-matagalpa',
  'incendio-destruye-negocios-en-el-barrio-altagracia-managua',
  'lluvias-vientos-y-rayos-dejan-danos-y-dos-fallecidos',
  'tres-accidentes-transito-managua-boaco',
  'incendio-destruye-negocio-y-deja-perdidas-por-c-200-mil-en-nindiri',
  'dos-muertos-y-dos-heridos-en-accidentes-laborales-en-nicaragua',
  'julieta-venegas-presenta-tierra-de-esperanza-rumbo-al-mundial-2026',
  'accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte',
  'fin-de-semana-violento-deja-muertos-y-herido-en-leon-ocotal-y-managua',
  'canada-reporta-virus-por-roedores-en-columbia',
  'policia-decomisa-mercaderia-en-operativo-de-penas',
  'turismo-en-nicaragua-crece-11-en-primer-trimestre-de-2026-segun-intur',
  'ineter-pronostican-lluvias-y-tormentas-electricas-en',
  'microsoft-corrige-fallo-de-seguridad-en-navegador-edge',
];

async function fetchAdminNews() {
  const res = await fetch(`${SITE_URL}/api/admin/news`, {
    headers: { 'x-admin-token': ADMIN_TOKEN },
  });
  if (!res.ok) throw new Error(`API admin/news failed: ${res.status}`);
  const data = await res.json();
  const news = Array.isArray(data) ? data : (data.news || []);
  return news;
}

async function updateNoticia(id: string, changes: Record<string, unknown>) {
  const res = await fetch(`${SITE_URL}/api/admin/news/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
    body: JSON.stringify(changes),
  });
  return res.ok;
}

function countWords(html: string) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(w => w.length > 0).length;
}

async function expandirViaEndpoint(noticiaId: string): Promise<{ contenido: string | null; palabrasAntes: number; palabrasDespues: number; scoreDespues: number } | null> {
  const res = await fetch(`${SITE_URL}/api/admin/expandir-thin-content?dryRun=false&soloId=${encodeURIComponent(noticiaId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
  });

  if (!res.ok) {
    console.error(`Endpoint error: ${res.status}`);
    return null;
  }

  const data = await res.json() as any;
  const resultado = data.resultados?.[0];
  if (!resultado || !resultado.aplicado) {
    return null;
  }

  const newsRes = await fetch(`${SITE_URL}/api/admin/news`, {
    headers: { 'x-admin-token': ADMIN_TOKEN },
  });
  const newsData = await newsRes.json();
  const noticias = Array.isArray(newsData) ? newsData : (newsData.news || []);
  const n = noticias.find((x: any) => x.id === noticiaId);

  return {
    contenido: n?.contenido || null,
    palabrasAntes: resultado.palabrasAntes,
    palabrasDespues: resultado.palabrasDespues,
    scoreDespues: resultado.scoreDespues,
  };
}

async function run() {
  console.log('[Expandir Thin] Obteniendo noticias...');
  const noticias = await fetchAdminNews();

  // Filtrar solo las 15 thin por slug
  const thinNoticias = noticias.filter((n: any) => THIN_SLUGS.includes(n.slug));
  console.log(`[Expandir Thin] ${thinNoticias.length} noticias thin encontradas`);

  const report: any[] = [];

  for (let i = 0; i < thinNoticias.length; i++) {
    const n = thinNoticias[i];
    const wordsBefore = countWords(n.contenido || '');
    console.log(`\n[${i + 1}/${thinNoticias.length}] ${n.titulo} — ${wordsBefore} palabras`);

    if (wordsBefore >= 350) {
      console.log('  → Ya tiene 350+ palabras, saltando.');
      continue;
    }

    // Expandir vía endpoint (Gemini en servidor)
    console.log('  → Expandiendo vía endpoint...');
    const expansion = await expandirViaEndpoint(n.id);

    if (!expansion || !expansion.contenido) {
      console.error('  → Expansión fallida');
      report.push({ titulo: n.titulo, slug: n.slug, error: 'Expansión fallida', aplicado: false });
      continue;
    }

    console.log(`  → Expandido a ${expansion.palabrasDespues} palabras`);

    // Analizar con forense
    const input: NoticiaInput = {
      titulo: n.titulo,
      contenido: expansion.contenido,
      resumen: n.resumen,
      categoria: n.categoria || 'General',
      autor: n.autor || 'Nicaragua Informate',
      fecha: n.fecha || new Date().toISOString(),
      slug: n.slug || n.id,
      imagen: n.imagen || '',
    };

    const analisis = await analizarNoticia(input);
    console.log(`  → Análisis: ${analisis.nivel} | Aprobado: ${analisis.aprobado}`);

    if (analisis.nivel === 'ORO' || analisis.nivel === 'FORENSE') {
      console.log('  → ✅ EXPANSIÓN ACEPTADA');
      report.push({
        titulo: n.titulo,
        slug: n.slug,
        palabrasAntes: expansion.palabrasAntes,
        palabrasDespues: expansion.palabrasDespues,
        nivel: analisis.nivel,
        aplicado: true,
      });
    } else {
      console.log(`  → ❌ EXPANSIÓN RECHAZADA (${analisis.nivel}) — Revirtiendo...`);
      await updateNoticia(n.id, { contenido: n.contenido });
      report.push({
        titulo: n.titulo,
        slug: n.slug,
        palabrasAntes: expansion.palabrasAntes,
        palabrasDespues: expansion.palabrasDespues,
        nivel: analisis.nivel,
        aplicado: false,
        razon: `Nivel ${analisis.nivel} no alcanza ORO/FORENSE`,
      });
    }
  }

  // Reporte
  let md = `# Expansión Thin Content — Reporte\n\n`;
  md += `**Fecha:** ${new Date().toLocaleString('es-NI')}\n\n`;

  const aplicadas = report.filter(r => r.aplicado);
  const fallidas = report.filter(r => !r.aplicado);

  md += `## Resumen\n\n`;
  md += `- **Expandidas y guardadas:** ${aplicadas.length}\n`;
  md += `- **Fallidas:** ${fallidas.length}\n\n`;

  if (aplicadas.length > 0) {
    md += `## Guardadas con éxito\n\n`;
    for (const r of aplicadas) {
      md += `- **${r.titulo}** — ${r.palabrasAntes}→${r.palabrasDespues} palabras | ${r.nivel} | Score ${r.score}\n`;
    }
    md += `\n`;
  }

  if (fallidas.length > 0) {
    md += `## Fallidas (requieren revisión manual)\n\n`;
    for (const r of fallidas) {
      md += `- **${r.titulo}** — ${r.error || r.razon}\n`;
    }
    md += `\n`;
  }

  writeFileSync('EXPANSION_THIN_REPORT.md', md, 'utf8');
  console.log(`\n[Expandir Thin] Reporte guardado en EXPANSION_THIN_REPORT.md`);
  console.log(`[Expandir Thin] Guardadas: ${aplicadas.length} | Fallidas: ${fallidas.length}`);
}

run().catch(err => {
  console.error('[Expandir Thin] Error:', err);
  process.exit(1);
});
