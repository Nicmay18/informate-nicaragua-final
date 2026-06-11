import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

const SITE_URL = 'https://nicaraguainformate.com';

// ============================================================================
// 1. INICIALIZAR FIREBASE ADMIN
// ============================================================================
const credPath = 'G:\\RESPALDO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json';
const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = getFirestore();

// ============================================================================
// 2. CRITERIOS ADSENSE
// ============================================================================
const PROHIBITED_KEYWORDS = [
  'porno', 'xxx', 'sexo explicito', 'desnudo', 'nude', 'escort', 'prostitut',
  'droga', 'cocaina', 'heroina', 'metanfetamina', 'crack', 'marihuana',
  'hackear', 'piratear', 'descargar ilegal', 'torrent', 'warez',
  'apuesta', 'casino', 'ruleta', 'poker online', 'slots',
  'arma', 'asesinato', 'asesino serial', 'tortura', 'violar', 'violacion',
];

function countWords(text) {
  if (!text) return 0;
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.split(/\s+/).filter(Boolean).length;
}

function hasProhibitedContent(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return PROHIBITED_KEYWORDS.some(kw => lower.includes(kw));
}

function checkIssues(n) {
  const issues = [];
  const wordCount = countWords(n.contenido) + countWords(n.resumen);

  if (wordCount < 350) {
    issues.push(`Contenido muy corto (${wordCount} palabras, mínimo recomendado 600)`);
  } else if (wordCount < 600) {
    issues.push(`Contenido por debajo del ideal (${wordCount} palabras, ideal 600+)`);
  }

  if (!n.titulo || n.titulo.length < 10) {
    issues.push('Título ausente o demasiado corto');
  }

  if (!n.resumen || n.resumen.length < 20) {
    issues.push('Resumen ausente o muy corto');
  }

  if (!n.categoria) {
    issues.push('Sin categoría');
  }

  if (!n.imagen || n.imagen.includes('logo')) {
    issues.push('Sin imagen destacada o usa logo genérico');
  }

  if (!n.fecha) {
    issues.push('Sin fecha de publicación');
  }

  const fullText = `${n.titulo || ''} ${n.resumen || ''} ${n.contenido || ''}`;
  if (hasProhibitedContent(fullText)) {
    issues.push('Posible contenido prohibido detectado (revisar manualmente)');
  }

  return { wordCount, issues };
}

function computeScore(wordCount, issueCount) {
  let score = 100;
  if (wordCount < 350) score -= 40;
  else if (wordCount < 600) score -= 15;
  score -= issueCount * 8;
  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// 3. FETCH EN VIVO (con timeout)
// ============================================================================
async function checkUrl(slug) {
  const url = `${SITE_URL}/noticias/${slug}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal, method: 'HEAD' });
    clearTimeout(timeout);
    return { ok: res.ok, status: res.status, url };
  } catch (err) {
    clearTimeout(timeout);
    return { ok: false, status: 0, url, error: err.message };
  }
}

// ============================================================================
// 4. EVALUAR TODAS LAS NOTICIAS
// ============================================================================
async function runAudit() {
  console.log('[AdSense Audit] Leyendo noticias de Firestore...');
  const snap = await db.collection('noticias').limit(250).get();
  const noticias = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`[AdSense Audit] ${noticias.length} noticias encontradas`);
  console.log('[AdSense Audit] Verificando URLs en vivo (esto puede tardar)...');

  const results = [];
  let aptoCount = 0;
  let noAptoCount = 0;
  let revisionCount = 0;

  for (let i = 0; i < noticias.length; i++) {
    const n = noticias[i];
    const slug = n.slug || n.id;
    const { wordCount, issues } = checkIssues(n);
    const urlCheck = await checkUrl(slug);

    if (!urlCheck.ok && urlCheck.status !== 0) {
      issues.push(`URL devuelve HTTP ${urlCheck.status} (página rota)`);
    } else if (!urlCheck.ok && urlCheck.status === 0) {
      issues.push('Timeout al verificar URL (posible 404 o lenta)');
    }

    const score = computeScore(wordCount, issues.length);

    let estado;
    if (score >= 85 && issues.length === 0) {
      estado = 'APTO';
      aptoCount++;
    } else if (score < 50 || issues.some(i => i.includes('prohibido') || i.includes('rota'))) {
      estado = 'NO APTO';
      noAptoCount++;
    } else {
      estado = 'REVISIÓN MANUAL NECESARIA';
      revisionCount++;
    }

    results.push({
      titulo: n.titulo || '(Sin título)',
      slug,
      estado,
      wordCount,
      score,
      issues,
      url: urlCheck.url,
      urlOk: urlCheck.ok,
    });

    process.stdout.write(`\r[AdSense Audit] ${i + 1}/${noticias.length} evaluados`);
  }

  console.log('\n[AdSense Audit] Generando reporte...');

  // ==========================================================================
  // 5. GENERAR REPORTE MARKDOWN
  // ==========================================================================
  let md = `# Auditoría AdSense — Nicaragua Informate\n\n`;
  md += `**Fecha:** ${new Date().toLocaleString('es-NI')}\n`;
  md += `**Total artículos evaluados:** ${noticias.length}\n`;
  md += `**Dominio:** ${SITE_URL}\n\n`;

  md += `## Resumen Ejecutivo\n\n`;
  md += `- **APTO:** ${aptoCount} (${Math.round((aptoCount / noticias.length) * 100)}%)\n`;
  md += `- **NO APTO:** ${noAptoCount} (${Math.round((noAptoCount / noticias.length) * 100)}%)\n`;
  md += `- **REVISIÓN MANUAL:** ${revisionCount} (${Math.round((revisionCount / noticias.length) * 100)}%)\n\n`;

  if (noAptoCount > 0) {
    md += `### ⚠️ Riesgo principal de rechazo\n\n`;
    md += `Artículos NO APTOS detectados. Google AdSense puede rechazar la aplicación si más del 10% del contenido tiene problemas graves.\n\n`;
  }

  md += `---\n\n`;

  for (const r of results) {
    const icon = r.estado === 'APTO' ? '✅' : r.estado === 'NO APTO' ? '❌' : '⚠️';
    md += `## ${icon} ${r.titulo}\n\n`;
    md += `- **Slug:** \`/noticias/${r.slug}\`\n`;
    md += `- **Estado:** ${r.estado}\n`;
    md += `- **Palabras:** ${r.wordCount}\n`;
    md += `- **Score:** ${r.score}%\n`;
    md += `- **URL viva:** ${r.urlOk ? 'Sí' : 'No (revisar)'}\n`;

    if (r.issues.length > 0) {
      md += `- **Problemas:**\n`;
      for (const issue of r.issues) {
        md += `  - ${issue}\n`;
      }
    }

    if (r.estado === 'APTO' && r.score >= 90) {
      md += `- **Nota:** Candidato prioritario para alta densidad de anuncios\n`;
    }

    md += `\n`;
  }

  md += `---\n\n`;
  md += `## ⚠️ PROBLEMAS ESTRUCTURALES GLOBALES (si aplica)\n\n`;
  md += `Verificar manualmente:\n`;
  md += `- Página de Política de Privacidad accesible\n`;
  md += `- Página de Términos y Condiciones\n`;
  md += `- Aviso de cookies funcional\n`;
  md += `- Menú de navegación sin enlaces rotos\n`;
  md += `- No hay pop-ups intrusivos ni redirecciones automáticas\n`;
  md += `- Contenido original (no syndicated/copiado de otras fuentes)\n\n`;

  md += `## Estimación de tiempo de corrección\n\n`;
  const fixHours = Math.ceil(noAptoCount * 0.5 + revisionCount * 0.25);
  md += `**${fixHours} horas hombre** aproximadas para llevar todo el contenido a estado APTO.\n\n`;
  md += `*Generado automáticamente por script de auditoría AdSense*\n`;

  const outPath = new URL('../adsense-audit-report.md', import.meta.url).pathname;
  writeFileSync(outPath, md, 'utf8');
  console.log(`[AdSense Audit] Reporte guardado en: ${outPath}`);
  console.log(`[AdSense Audit] APTO: ${aptoCount} | NO APTO: ${noAptoCount} | REVISIÓN: ${revisionCount}`);
}

runAudit().catch(err => {
  console.error('[AdSense Audit] Error:', err);
  process.exit(1);
});
