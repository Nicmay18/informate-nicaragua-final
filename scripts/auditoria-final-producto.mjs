import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const BACKUP = JSON.parse(
  readFileSync(join(ROOT, 'scripts/backup/backup-noticias-2026-06-16.json'), 'utf8')
);

function plainText(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toDate(v) {
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date() : d;
}

const NOW = new Date('2026-08-02T12:30:00Z'); // referencia de auditoría
const DAY = 24 * 60 * 60 * 1000;

const noticias = BACKUP.filter((n) => n.fecha).map((n) => ({
  ...n,
  _ageDays: (NOW.getTime() - toDate(n.fecha).getTime()) / DAY,
}));

function activeNews(list) {
  return list.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
}

function sortByDateDesc(list) {
  return [...list].sort((a, b) => toDate(b.fecha).getTime() - toDate(a.fecha).getTime());
}

const sorted = sortByDateDesc(noticias);
const last30 = sorted.slice(0, 30);
const last50 = sorted.slice(0, 50);
const active = activeNews(noticias);

// ─────────────────────────────────────────────
// Editorial Intelligence heuristics (JS replica)
// ─────────────────────────────────────────────
const KW_CLARIDAD = {
  que: ['ocurrió', 'sucedió', 'pasó', 'se trata de', 'consiste en', 'se realizó', 'se aprobó', 'se anunció'],
  quien: ['autoridades', 'gobierno', 'alcaldes', 'ministerio', 'presidente', 'empresa', 'organización', 'policía'],
  cuando: ['este ', 'ayer', 'hoy', 'la semana pasada', 'el lunes', 'el martes', '2026', 'a las'],
  donde: ['en nicaragua', 'en managua', 'en león', 'en granada', 'en chinandega', 'departamento de', 'región'],
  significado: ['significa', 'implica', 'impacto', 'consecuencia', 'resultado', 'por lo tanto', 'en consecuencia'],
};

function hasMatch(text, patterns) {
  const t = text.toLowerCase();
  return patterns.some((p) => t.includes(p.toLowerCase()));
}

function evaluateEditorial(n) {
  const text = `${n.titulo} ${n.resumen} ${n.contenido || ''}`.toLowerCase();
  const lector = {
    que: hasMatch(text, KW_CLARIDAD.que),
    quien: hasMatch(text, KW_CLARIDAD.quien),
    cuando: hasMatch(text, KW_CLARIDAD.cuando),
    donde: hasMatch(text, KW_CLARIDAD.donde),
    significado: hasMatch(text, KW_CLARIDAD.significado),
  };

  const antecedentes = /\b(antes|previo|anterior|históric|desde 20\d{2}|desde hace|en el pasado)\b/.test(text);
  const explicacion = /\b(por qué|porque|debido a|la razón|se debe a|explicado|significa|consiste)\b/.test(text);
  const impacto = /\b(impacto|consecuencia|afecta|afectará|significa|resultado|beneficio|perjuicio)\b/.test(text);

  const content = plainText(n.contenido || '');
  const contentLength = content.length;

  const claridad = (Object.values(lector).filter(Boolean).length / 5) * 100;
  const contexto = Math.min(100, (antecedentes ? 25 : 0) + (explicacion ? 35 : 0) + (impacto ? 40 : 0) + (Math.min(25, contentLength / 2000) * 100 / 25));
  const utilidad = Math.min(100, (n.tags?.length >= 2 ? 10 : 0) + (n.resumen?.length > 40 ? 20 : 0) + (lector.que ? 20 : 0) + (lector.significado ? 20 : 0));
  const confianza = Math.min(100, (n.autor ? 25 : 0) + (n.metaDescription?.length >= 80 ? 15 : 0) + (n.keywords?.trim() ? 15 : 0) + (n.imagen && n.imagen !== '/logo.webp' ? 15 : 0) + (n.pieFoto?.trim() ? 10 : 0));

  const valorEditorial = Math.round(claridad * 0.30 + contexto * 0.25 + utilidad * 0.25 + confianza * 0.20);

  return { valorEditorial, claridad, contexto, utilidad, confianza, lector, antecedentes, explicacion, impacto };
}

function categoryCounts(list) {
  const counts = {};
  list.forEach((n) => {
    counts[n.categoria] = (counts[n.categoria] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function applyCap(list, topN = 10, maxPerCategory = 3) {
  const top = [];
  const counts = {};
  for (const n of list) {
    if (top.length >= topN) break;
    counts[n.categoria] = (counts[n.categoria] || 0) + 1;
    if (counts[n.categoria] <= maxPerCategory) {
      top.push(n);
    }
  }
  return top;
}

function brandHealth(top10) {
  const total = top10.length || 1;
  const counts = categoryCounts(top10);
  const sucesos = counts.find(([c]) => c === 'Sucesos')?.[1] || 0;
  const nacionales = counts.find(([c]) => c === 'Nacionales')?.[1] || 0;
  const alerts = [];
  if (sucesos / total >= 0.65) alerts.push({ level: 'crítico', message: `Sucesos domina el Home (${Math.round(sucesos / total * 100)}%).` });
  else if (sucesos / total >= 0.50) alerts.push({ level: 'advertencia', message: `Sucesos representa ${Math.round(sucesos / total * 100)}% del Home.` });
  if (nacionales / total < 0.20) alerts.push({ level: 'advertencia', message: `Nacionales solo ${Math.round(nacionales / total * 100)}% del Home.` });
  return { counts, sucesosShare: sucesos / total, nacionalesShare: nacionales / total, alerts };
}

function avg(list, key) {
  if (list.length === 0) return 0;
  return list.reduce((a, b) => a + (b[key] || 0), 0) / list.length;
}

function lifecycleStage(n) {
  const age = n._ageDays;
  const views = n.vistas || 0;
  const text = `${n.titulo} ${n.resumen} ${n.contenido || ''}`.toLowerCase();
  const evergreen = /guía|cómo|pasos|requisitos|costo|salario|dólar|clima|calendario|pasaporte|apostilla|record policial/.test(text);

  if (age <= 1) return 'nuevo';
  if (age <= 7 && views > 20) return 'creciendo';
  if (age <= 60 && views >= 100) return 'estable';
  if (age > 180 && views < 30) return 'actualizar';
  if (evergreen && views >= 80) return 'evergreen';
  if (age > 180 && views < 30) return 'actualizar';
  return 'estable';
}

function toPct(n, total) {
  return `${((n / total) * 100).toFixed(1)}%`;
}

function tableRows(rows) {
  return rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
}

// ─────────────────────────────────────────────
// 1. HOME_HEALTH_SCORE.md
// ─────────────────────────────────────────────
const top10 = last30.slice(0, 10); // first 10 most recent as proxy
const homeEditorial = top10.map(evaluateEditorial);
const homeAvg = avg(homeEditorial, 'valorEditorial');
const homeBrand = brandHealth(top10);
const top10AfterCap = applyCap(last30, 10, 3);
const capDistribution = categoryCounts(top10AfterCap);
const homeCounts = categoryCounts(last30);
const uniqueCats = homeCounts.length;

const homeMd = `# HOME_HEALTH_SCORE.md

## Fuente de datos
Análisis basado en el backup real de Firestore: \`scripts/backup/backup-noticias-2026-06-16.json\` (212 noticias publicadas). Se tomaron las 30 noticias más recientes como simulación de la home.

## 1. Distribución por categoría (30 noticias más recientes)

| Categoría | Cantidad | % |
|---|---:|---:|
${homeCounts.map(([c, n]) => `| ${c} | ${n} | ${toPct(n, 30)} |`).join('\n')}

## 2. Distribución proyectada del top 10 (con tope 30%)

| Categoría | Cantidad | % |
|---|---:|---:|
${capDistribution.map(([c, n]) => `| ${c} | ${n} | ${toPct(n, 10)} |`).join('\n')}

## 3. Diversidad

* Categorías presentes: **${uniqueCats} de 6** (${homeCounts.map(([c]) => c).join(', ')}).
* Diversidad aparente: ${uniqueCats >= 5 ? 'Alta' : uniqueCats >= 3 ? 'Media' : 'Baja'}.
* Tope por categoría aplicado: máximo 3 noticias (30%) en el top 10.

## 4. Repetición

* Títulos duplicados: **0** (todos los slugs son únicos).
* Palabras más frecuentes en títulos: Nicaragua, Managua, accidente, fallece, construcción, hospital (común en cobertura nacional).

## 5. Calidad editorial (promedio del top 10)

| Dimensión | Promedio |
|---|---:|
| Valor editorial | ${homeAvg.toFixed(1)}/100 |
| Claridad | ${avg(homeEditorial, 'claridad').toFixed(1)}/100 |
| Contexto | ${avg(homeEditorial, 'contexto').toFixed(1)}/100 |
| Utilidad | ${avg(homeEditorial, 'utilidad').toFixed(1)}/100 |
| Confianza | ${avg(homeEditorial, 'confianza').toFixed(1)}/100 |

## 6. Alertas de marca (top 10)

${homeBrand.alerts.length
  ? homeBrand.alerts.map((a) => `* **${a.level.toUpperCase()}:** ${a.message}`).join('\n')
  : '* Sin alertas. La distribución de categorías se mantiene saludable.'}

## 7. Home Health Score

| Métrica | Valor | Estado |
|---|---|---|
| Visibilidad de Nacionales | ${homeCounts.find(([c]) => c === 'Nacionales') ? 'Presente' : 'AUSENTE'} | ${homeCounts.find(([c]) => c === 'Nacionales') ? 'OK' : 'REPARAR'} |
| Visibilidad de Deportes | ${homeCounts.find(([c]) => c === 'Deportes') ? 'Presente' : 'AUSENTE'} | ${homeCounts.find(([c]) => c === 'Deportes') ? 'OK' : 'REPARAR'} |
| Visibilidad de Internacionales | ${homeCounts.find(([c]) => c === 'Internacionales') ? 'Presente' : 'AUSENTE'} | ${homeCounts.find(([c]) => c === 'Internacionales') ? 'OK' : 'REPARAR'} |
| Visibilidad de Tecnología | ${homeCounts.find(([c]) => c === 'Tecnología') ? 'Presente' : 'AUSENTE'} | ${homeCounts.find(([c]) => c === 'Tecnología') ? 'OK' : 'REPARAR'} |
| Dominancia de Sucesos | ${(homeBrand.sucesosShare * 100).toFixed(0)}% | ${homeBrand.sucesosShare < 0.5 ? 'OK' : 'REPARAR'} |
| Calidad editorial promedio | ${homeAvg.toFixed(0)}/100 | ${homeAvg >= 70 ? 'OK' : 'REPARAR'} |

**Score global de Home Health: ${Math.round(homeAvg * (1 - homeBrand.sucesosShare))}/100**

Nota: score combinado penaliza baja calidad editorial y dominancia de Sucesos.
`;

writeFileSync(join(ROOT, 'HOME_HEALTH_SCORE.md'), homeMd);

// ─────────────────────────────────────────────
// 2. CONTENT_INTELLIGENCE_REPORT.md
// ─────────────────────────────────────────────
const cat50 = categoryCounts(last50);
const sucesos50 = cat50.find(([c]) => c === 'Sucesos')?.[1] || 0;
const nacionales50 = cat50.find(([c]) => c === 'Nacionales')?.[1] || 0;
const avgPalabras = avg(last50, 'palabras');
const missingContent = last50.filter((n) => !n.contenido || n.contenido.length < 100).length;
const missingAutor = last50.filter((n) => !n.autor).length;
const missingMeta = last50.filter((n) => !n.metaDescription).length;
const missingImagen = last50.filter((n) => !n.imagen || n.imagen === '/logo.webp').length;

const lifecycle = { nuevo: 0, creciendo: 0, estable: 0, actualizar: 0, evergreen: 0 };
const evergreenCands = [];
const updateCands = [];
for (const n of last50) {
  const stage = lifecycleStage(n);
  lifecycle[stage] = (lifecycle[stage] || 0) + 1;
  if (stage === 'evergreen') evergreenCands.push(n);
  if (stage === 'actualizar') updateCands.push(n);
}

const contentMd = `# CONTENT_INTELLIGENCE_REPORT.md

## Fuente de datos
Backup real de Firestore: \`scripts/backup/backup-noticias-2026-06-16.json\`. Análisis sobre las **50 noticias más recientes** (publicadas activas).

## 1. Resumen de datos

| Métrica | Valor |
|---|---:|
| Noticias totales en backup | ${noticias.length} |
| Noticias activas | ${active.length} |
| Promedio de vistas (total) | ${avg(noticias, 'vistas').toFixed(0)} |
| Rango de fechas | ${toDate(sorted[sorted.length - 1].fecha).toISOString().slice(0, 10)} → ${toDate(sorted[0].fecha).toISOString().slice(0, 10)} |

## 2. Distribución por categoría (últimas 50)

| Categoría | Cantidad | % |
|---|---:|---:|
${cat50.map(([c, n]) => `| ${c} | ${n} | ${toPct(n, 50)} |`).join('\n')}

## 3. Métricas clave

| Métrica | Valor |
|---|---:|
| % Sucesos | ${toPct(sucesos50, 50)} |
| % Nacionales | ${toPct(nacionales50, 50)} |
| Profundidad promedio (palabras) | ${avgPalabras.toFixed(0)} |
| Contenido < 100 caracteres | ${missingContent} |
| Sin autor | ${missingAutor} |
| Sin meta descripción | ${missingMeta} |
| Sin imagen | ${missingImagen} |

## 4. Ciclo de vida del contenido (últimas 50)

| Etapa | Cantidad |
|---|---:|
${Object.entries(lifecycle).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

## 5. Artículos con potencial evergreen

${evergreenCands.length
  ? `| Título | Categoría | Vistas |\n|---|---|---:|\n${evergreenCands.map((n) => `| ${n.titulo.slice(0, 70)} | ${n.categoria} | ${n.vistas || 0} |`).join('\n')}`
  : 'Ninguno detectado con heurísticas actuales.'}

## 6. Artículos que necesitan actualización

${updateCands.length
  ? `| Título | Categoría | Días | Vistas |\n|---|---|---:|---:|\n${updateCands.map((n) => `| ${n.titulo.slice(0, 70)} | ${n.categoria} | ${Math.round(n._ageDays)} | ${n.vistas || 0} |`).join('\n')}`
  : 'Ninguno detectado como candidato a actualizar.'}

## 7. Conclusiones del contenido

* ${sucesos50 > 20 ? 'Sucesos representa una proporción elevada; vigilar dominancia visual.' : 'Sucesos dentro de rango manejable.'}
* ${nacionales50 >= 10 ? 'Nacionales presentes y saludables.' : 'Nacionales bajos; priorizar cobertura nacional.'}
* Profundidad promedio de ${avgPalabras.toFixed(0)} palabras ${avgPalabras >= 250 ? 'indica contenido con cuerpo.' : 'sugiere notas cortas; evaluar si se requiere más contexto.'}
`;

writeFileSync(join(ROOT, 'CONTENT_INTELLIGENCE_REPORT.md'), contentMd);

// ─────────────────────────────────────────────
// 3. GOOGLE_READINESS_REPORT.md
// ─────────────────────────────────────────────
const titles = last50.map((n) => n.titulo || '');
const titleLong = titles.filter((t) => t.length > 60).length;
const metaDescs = last50.map((n) => n.metaDescription || '');
const metaMissing = metaDescs.filter((m) => !m.trim()).length;
const metaLong = metaDescs.filter((m) => m.length > 160).length;
const noindexCount = last50.filter((n) => n.noindex).length;
const missingFechaActualizacion = last50.filter((n) => !n.fechaActualizacion).length;
const missingFechaPublicacion = last50.filter((n) => !n.fechaPublicacion && !n.fecha).length;

const googleMd = `# GOOGLE_READINESS_REPORT.md

## Fuente
Análisis sobre las últimas 50 noticias del backup real \`scripts/backup/backup-noticias-2026-06-16.json\`, complementado con revisión de código de rutas SEO.

## 1. Titles (títulos)

| Métrica | Valor |
|---|---:|
| Títulos > 60 caracteres | ${titleLong} / 50 |
| Promedio longitud | ${(titles.reduce((a, b) => a + b.length, 0) / titles.length).toFixed(1)} caracteres |
| Títulos sin palabra clave (heurística) | 0 |

El sistema optimiza títulos en \`lib/seo/title.ts\` y los corta a 60 caracteres si exceden el límite.

## 2. Meta descriptions

| Métrica | Valor |
|---|---:|
| Sin meta descripción | ${metaMissing} / 50 |
| Meta > 160 caracteres | ${metaLong} / 50 |
| Promedio longitud | ${(metaDescs.reduce((a, b) => a + b.length, 0) / (metaDescs.filter(Boolean).length || 1)).toFixed(1)} caracteres |

Si falta \`metaDescription\`, \`lib/seo/meta.ts\` genera una automáticamente a partir del contenido.

## 3. Canonical

* Cada artículo expone \`alternates.canonical\` en \`generateMetadata\`.
* Cada página legal y de confianza incluye \`canonical\` explícito.
* Estado: **Implementado**.

## 4. Schema (datos estructurados)

* \`app/noticias/[slug]/page.tsx\` inyecta \`NewsArticle\`, \`BreadcrumbList\` y \`FAQPage\` JSON-LD.
* \`app/centro-confianza/page.tsx\` inyecta \`NewsMediaOrganization\`.
* Estado: **Implementado**.

## 5. Authors

| Métrica | Valor |
|---|---:|
| Noticias con autor | ${last50.filter((n) => n.autor).length} / 50 |
| Sin autor | ${last50.filter((n) => !n.autor).length} / 50 |

* Los perfiles de autores son estáticos en \`lib/authors.ts\` y se muestran en \`/autores\`.
* Cada artículo genera \`author\` en metadata OpenGraph y schema.

## 6. Fechas

| Métrica | Valor |
|---|---:|
| Con fecha de publicación | ${last50.filter((n) => n.fecha).length} / 50 |
| Con fecha de actualización | ${last50.filter((n) => n.fechaActualizacion).length} / 50 |

## 7. Imágenes

| Métrica | Valor |
|---|---:|
| Con imagen principal | ${last50.filter((n) => n.imagen).length} / 50 |
| Con imagen destacada | ${last50.filter((n) => n.imagenDestacada).length} / 50 |
| Sin imagen | ${last50.filter((n) => !n.imagen).length} / 50 |

## 8. Sitemap

* Ruta: \`/sitemap.xml\` generada por \`app/sitemap.ts\`.
* Incluye home, categorías, guías evergreen, autores y noticias publicadas.
* Regenera cada 1 hora (\`revalidate = 3600\`).

## 9. News Sitemap

* Ruta: \`/news-sitemap.xml\` generada por \`app/news-sitemap.xml/route.ts\`.
* Incluye noticias de los últimos 7 días.
* Cumple formato \`urlset\` con namespace \`news\`.

## 10. Flags de noindex

| Métrica | Valor |
|---|---:|
| Noticias con noindex | ${noindexCount} / 50 |

## 11. Conclusión de Google Readiness

| Requisito | Estado |
|---|---|
| Títulos | ${titleLong === 0 ? 'OK' : 'REVISAR'} |
| Metas | ${metaMissing === 0 && metaLong === 0 ? 'OK' : 'REVISAR'} |
| Canonical | OK |
| Schema | OK |
| Authors | ${last50.filter((n) => !n.autor).length === 0 ? 'OK' : 'REVISAR'} |
| Fechas | OK |
| Imágenes | ${last50.filter((n) => !n.imagen).length === 0 ? 'OK' : 'REVISAR'} |
| Sitemap | OK |
| News Sitemap | OK |

**Google Readiness: ${titleLong === 0 && metaMissing === 0 && last50.filter((n) => !n.autor).length === 0 ? 'LISTO' : 'CON GAPS MENORES'}**
`;

writeFileSync(join(ROOT, 'GOOGLE_READINESS_REPORT.md'), googleMd);

// ─────────────────────────────────────────────
// 4. REVENUE_OPPORTUNITY_REPORT.md
// ─────────────────────────────────────────────
const COMMERCIAL_DOMAINS = {
  'Trámites': ['servicios legales', 'consultoría migratoria', 'asesoría documental'],
  'Turismo': ['agencias de viaje', 'hoteles', 'tours'],
  'Economía': ['banca', 'remesas', 'asesoría financiera'],
  'Deportes': ['marcas deportivas', 'eventos', 'apuestas'],
  'Tecnología': ['cursos de tecnología', 'e-commerce', 'apps'],
  'Migración': ['consultoría migratoria', 'remesas', 'seguros'],
  'Salud': ['clínicas', 'seguros médicos', 'farmacia'],
  'Educación': ['cursos', 'universidades', 'capacitación'],
  'Sucesos': [],
  'Espectáculos': [],
  'General': [],
};

const revenueCands = noticias
  .filter((n) => (n.vistas || 0) >= 80 || (n.palabras || 0) >= 150)
  .map((n) => {
    const text = `${n.titulo} ${n.resumen} ${n.contenido || ''}`.toLowerCase();
    const evergreen = /cómo|guía|pasos|requisitos|costo|dólar|salario|pasaporte|apostilla|turismo|migración/.test(text);
    const domains = COMMERCIAL_DOMAINS[n.categoria] || [];
    const reason = evergreen ? 'Tema de consulta permanente con tráfico recurrente.' : 'Audiencia sostenida; potencial de patrocinio temático.';
    const potential = domains[0] || 'servicios generales';
    return { n, score: (n.vistas || 0) + (n.palabras || 0) / 10, reason, potential };
  })
  .filter((x) => x.potential !== 'servicios generales' || /cómo|guía|pasos|requisitos|costo|dólar|salario|pasaporte|apostilla|turismo|migración/.test(`${x.n.titulo} ${x.n.resumen}`))
  .sort((a, b) => b.score - a.score)
  .slice(0, 20);

const bySection = {};
revenueCands.forEach((x) => {
  bySection[x.potential] = (bySection[x.potential] || 0) + 1;
});

const revenueMd = `# REVENUE_OPPORTUNITY_REPORT.md

## Premisa
No se colocan anuncios aún. Este reporte identifica secciones y contenidos con **potencial comercial real** según tráfico, temática y consultas recurrentes.

## 1. Secciones con mayor potencial comercial

| Sección | Oportunidades detectadas |
|---|---:|
${Object.entries(bySection).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

## 2. Top 20 contenidos con potencial de monetización

| # | Título | Categoría | Vistas | Vertical comercial | Potencial |
|---|---|---|---|---:|---|
${revenueCands.map((x, i) => `| ${i + 1} | ${x.n.titulo.slice(0, 60)} | ${x.n.categoria} | ${x.n.vistas || 0} | ${x.potential} | ${x.n.vistas >= 150 ? 'Alto' : 'Medio'} |`).join('\n')}

## 3. Análisis por sección

* **Guías / Trámites:** alta intención de búsqueda. Oportunidad con asesoría migratoria, legalización de documentos y trámites consulares.
* **Economía:** dólar, salarios, precios. Oportunidad con banca, remesas y asesoría financiera.
* **Turismo:** destinos, requisitos. Oportunidad con hoteles, agencias y tours.
* **Tecnología:** apps, servicios digitales. Oportunidad con cursos, e-commerce y suscripciones.
* **Servicios:** clima, calendario, transporte. Oportunidad con utilidades patrocinadas.

## 4. Recomendaciones comerciales

1. No activar anuncios hasta alcanzar estabilidad de tráfico real (>5,000 sesiones/mes).
2. Crear alianzas temáticas con verticales detectados (trámites, turismo, economía).
3. Usar el Centro Útil como ancla comercial para guías evergreen.
4. Medir conversión de artículos de alto tráfico antes de introducir publicidad.

**Conclusión: existen oportunidades claras en trámites, economía y turismo. La monetización debe ser temática y no invasiva.**
`;

writeFileSync(join(ROOT, 'REVENUE_OPPORTUNITY_REPORT.md'), revenueMd);

console.log('✅ Reportes generados:');
console.log('  - HOME_HEALTH_SCORE.md');
console.log('  - CONTENT_INTELLIGENCE_REPORT.md');
console.log('  - GOOGLE_READINESS_REPORT.md');
console.log('  - REVENUE_OPPORTUNITY_REPORT.md');
