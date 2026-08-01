import { promises as fs } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const MENI_DIR = join(ROOT, 'lib', 'meni');
const MD_PATH = join(ROOT, 'AUDITORIA-CODIGO-MENI.md');

async function walk(dir: string): Promise<string[]> {
  const result: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      result.push(...(await walk(full)));
    } else if (e.isFile() && e.name.endsWith('.ts')) {
      result.push(full);
    }
  }
  return result;
}

function findLine(text: string, query: string): number {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(query)) return i + 1;
  }
  return 0;
}

async function main() {
  const files = await walk(MENI_DIR);
  const fileMap: Record<string, string> = {};
  for (const f of files) {
    fileMap[f] = await fs.readFile(f, 'utf-8');
  }

  // FASE 1: localizar scoreFinal
  const coreTs = fileMap[join(MENI_DIR, 'core.ts')] || '';
  const brainTs = fileMap[join(MENI_DIR, 'editorial-brain', 'index.ts')] || '';
  const dnaTs = fileMap[join(MENI_DIR, 'editorial-dna', 'engine.ts')] || '';
  const scoringTs = fileMap[join(MENI_DIR, 'scoring.ts')] || '';
  const auditorTs = fileMap[join(MENI_DIR, 'auditor.ts')] || '';

  const scoreFinalLine = findLine(coreTs, 'const scoreFinal = editorialDecision.score;');
  const scoreReturnLine = findLine(coreTs, 'scoreFinal,');
  const evaluateLine = findLine(coreTs, 'function evaluateMeni');
  const runMeniLine = findLine(coreTs, 'export function runMeni(');
  const runMeniAsyncLine = findLine(coreTs, 'export async function runMeniAsync(');

  const runEditorialBrainLine = findLine(brainTs, 'export function runEditorialBrain(');
  const calcScoreLine = findLine(brainTs, 'function calcularScoreEjecutivo(');
  const calcEvalCategoriaLine = findLine(brainTs, 'function calcularEvaluacionCategoria(');
  const computeDnaLine = findLine(dnaTs, 'export function computeEditorialDNA(');
  const adnNisLine = findLine(dnaTs, 'const adnNI = Math.round(');

  const minScoreLine = findLine(scoringTs, 'MIN_APPROVED_SCORE');
  const auditLine = findLine(auditorTs, 'export function audit(');

  // FASE 2: listar funciones exportadas
  const funciones: { file: string; name: string; line: number }[] = [];
  const regex = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/m;
  for (const [f, text] of Object.entries(fileMap)) {
    const rel = relative(ROOT, f).replace(/\\/g, '/');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = regex.exec(lines[i]);
      if (m) {
        funciones.push({ file: rel, name: m[1], line: i + 1 });
      }
    }
  }

  // FASE 4: dependencias detectadas
  const dependencyKeywords: Record<string, string[]> = {};
  const concepts = ['html', 'textoPlano', 'palabra', 'h2', 'strong', 'keywords', 'schema', 'autor', 'fuente', 'categoria', 'resumen', 'lead', 'longitud', 'institucion', 'fecha', 'cifra'];
  for (const c of concepts) {
    dependencyKeywords[c] = [];
  }
  for (const [f, text] of Object.entries(fileMap)) {
    const rel = relative(ROOT, f).replace(/\\/g, '/');
    const lower = text.toLowerCase();
    if (lower.includes('textoplanes')) dependencyKeywords['textoPlano'].push(rel);
    if (lower.includes('h2count')) dependencyKeywords['h2'].push(rel);
    if (lower.includes('strongcount')) dependencyKeywords['strong'].push(rel);
    if (lower.includes('keywords')) dependencyKeywords['keywords'].push(rel);
    if (lower.includes('schema')) dependencyKeywords['schema'].push(rel);
    if (lower.includes('autor')) dependencyKeywords['autor'].push(rel);
    if (lower.includes('fuente')) dependencyKeywords['fuente'].push(rel);
    if (lower.includes('categoria')) dependencyKeywords['categoria'].push(rel);
    if (lower.includes('resumen')) dependencyKeywords['resumen'].push(rel);
    if (lower.includes('lead')) dependencyKeywords['lead'].push(rel);
    if (lower.includes('longitud') || lower.includes('length')) dependencyKeywords['longitud'].push(rel);
    if (lower.includes('institucion')) dependencyKeywords['institucion'].push(rel);
    if (lower.includes('fecha')) dependencyKeywords['fecha'].push(rel);
    if (lower.includes('cifra')) dependencyKeywords['cifra'].push(rel);
  }

  // FASE 5: pesos
  const adnPesos: { name: string; value: number }[] = [];
  const selloPesos: { name: string; value: number }[] = [];
  const dnaLines = dnaTs.split('\n');
  for (let i = 0; i < dnaLines.length; i++) {
    const m = dnaLines[i].match(/(\w+):\s*(0\.\d+),?/);
    if (m && dnaLines[i - 1]?.includes('DEFAULT_ADN_WEIGHTS')) {
      adnPesos.push({ name: m[1], value: parseFloat(m[2]) });
    } else if (m && dnaLines[i - 1]?.includes('DEFAULT_SELLO_WEIGHTS')) {
      selloPesos.push({ name: m[1], value: parseFloat(m[2]) });
    }
  }

  // FASE 6: saturación
  const capped: { file: string; line: number; text: string }[] = [];
  for (const [f, text] of Object.entries(fileMap)) {
    const rel = relative(ROOT, f).replace(/\\/g, '/');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.includes('Math.min(100') || l.includes('Math.max(0, Math.min(100') || l.includes('clamp(') && l.includes('100')) {
        capped.push({ file: rel, line: i + 1, text: l.trim() });
      }
      if (/=\s*100[^0-9]/.test(l) && !l.includes('//')) {
        capped.push({ file: rel, line: i + 1, text: l.trim() });
      }
    }
  }

  const unused: string[] = [];
  for (const fn of funciones) {
    const others = funciones.filter((x) => x !== fn).map((x) => x.name);
    if (!others.includes(fn.name) && !['runMeni', 'runMeniAsync', 'ingestArticleToMemory', 'buildMeniDiagnostics', 'buildDuplicateBlockingIssue', 'audit', 'buildRecomendaciones', 'buildValorEditorial', 'buildDiagnostico', 'buildEditorialReason', 'normalizeCategory', 'scoreToGrade', 'computePriority', 'approved'].includes(fn.name)) {
      unused.push(`${fn.file}:${fn.line} ${fn.name}`);
    }
  }

  // Construir Markdown
  const md: string[] = [];
  md.push('# AUDITORÍA FORENSE DEL MOTOR MENI');
  md.push('');
  md.push('Generado automáticamente por `scripts/auditar-motor-meni.ts`.');
  md.push('');
  md.push('## FASE 1 — Localización del scoreFinal');
  md.push('');
  md.push(`- **Asignación a scoreFinal**: \`lib/meni/core.ts\` línea ${scoreFinalLine}  \`const scoreFinal = editorialDecision.score;\``);
  md.push(`- **Devuelve en MeniResult**: \`lib/meni/core.ts\` línea ${scoreReturnLine} dentro del objeto retornado.`);
  md.push(`- **evaluateMeni**: \`lib/meni/core.ts\` línea ${evaluateLine}`);
  md.push(`- **runMeni**: \`lib/meni/core.ts\` línea ${runMeniLine}`);
  md.push(`- **runMeniAsync**: \`lib/meni/core.ts\` línea ${runMeniAsyncLine}`);
  md.push(`- **runEditorialBrain**: \`lib/meni/editorial-brain/index.ts\` línea ${runEditorialBrainLine}`);
  md.push(`- **calcularScoreEjecutivo**: \`lib/meni/editorial-brain/index.ts\` línea ${calcScoreLine}`);
  md.push(`- **calcularEvaluacionCategoria**: \`lib/meni/editorial-brain/index.ts\` línea ${calcEvalCategoriaLine}`);
  md.push(`- **computeEditorialDNA**: \`lib/meni/editorial-dna/engine.ts\` línea ${computeDnaLine}`);
  md.push(`- **adnNI**: \`lib/meni/editorial-dna/engine.ts\` línea ${adnNisLine}`);
  md.push('');
  md.push('### Cadena de llamadas (scoreFinal)');
  md.push('');
  md.push('```text');
  md.push('runMeniAsync()');
  md.push('  └─ runMeni()');
  md.push('       └─ evaluateMeni()');
  md.push('            └─ runEditorialBrain()');
  md.push('                 ├─ computeEditorialDNA()  → adnNI (NO es scoreFinal)');
  md.push('                 ├─ calcularEvaluacionCategoria()  → puntos perdidos');
  md.push('                 └─ calcularScoreEjecutivo()  → score que devuelve editorialDecision');
  md.push('            └─ editorialDecision.score asignado a scoreFinal');
  md.push('```');
  md.push('');
  md.push('## FASE 2 — Mapa de puntajes');
  md.push('');
  md.push('El scoreFinal **NO deriva** de los módulos secundarios. Estos devuelven valores informativos:');
  md.push('');
  md.push('| Criterio | Función | Archivo | Origen del valor | Observación |');
  md.push('| --- | --- | --- | --- | --- |');
  md.push(`| **Score final** | calcularScoreEjecutivo | lib/meni/editorial-brain/index.ts:${calcScoreLine} | 100 − suma(puntos perdidos) | Único valor que llega a scoreFinal |`);
  md.push(`| **Originalidad (auditoría)** | audit | lib/meni/auditor.ts:${auditLine} | \`result.valorEditorial.score\` | No afecta scoreFinal |`);
  md.push(`| **Redacción / Profundidad (auditoría)** | audit | lib/meni/auditor.ts:${auditLine} | \`(seo+eeat+forense)/3\` | No afecta scoreFinal |`);
  md.push(`| **Utilidad (auditoría)** | audit | lib/meni/auditor.ts:${auditLine} | \`result.valorEditorial.score\` | No afecta scoreFinal |`);
  md.push(`| **EEAT** | analyzeEEAT | lib/meni/eeat.ts | \`result.eeat.score\` | Secundario, no pesa en scoreFinal |`);
  md.push(`| **SEO** | analyzeSEO | lib/meni/seo.ts | \`result.seo.score\` | Secundario |`);
  md.push(`| **Discover** | analyzeDiscover | lib/meni/discover.ts | \`result.discover.score\` | Secundario |`);
  md.push(`| **AdSense** | analyzeAdSense | lib/meni/adsense.ts | \`result.adsense.score\` | Secundario |`);
  md.push(`| **Forense** | analyzeForensic | lib/meni/forensic.ts | \`result.forense.score\` | Secundario |`);
  md.push(`| **Aporte propio** | buildValorEditorial | lib/meni/editor-chief.ts | \`result.evidence.originality.tieneAportePropio\` | No pesa en scoreFinal |`);
  md.push(`| **ADN NI** | computeEditorialDNA | lib/meni/editorial-dna/engine.ts:${computeDnaLine} | Promedio ponderado de dimensiones | No pasa a scoreFinal |`);
  md.push('');
  md.push('### Pesos ADN NI (computeEditorialDNA)');
  md.push('');
  md.push('| Variable | Peso | Máximo | Mínimo | Función |');
  md.push('| --- | --- | --- | --- | --- |');
  for (const p of adnPesos) {
    md.push(`| ${p.name} | ${p.value} | 100 | 0 | computeEditorialDNA |`);
  }
  md.push('');
  md.push('### Pesos Sello NI (computeEditorialDNA)');
  md.push('');
  md.push('| Variable | Peso | Máximo | Mínimo | Función |');
  md.push('| --- | --- | --- | --- | --- |');
  for (const p of selloPesos) {
    md.push(`| ${p.name} | ${p.value} | 100 | 0 | computeEditorialDNA |`);
  }
  md.push('');
  md.push(`\`MIN_APPROVED_SCORE\`: \`lib/meni/scoring.ts\` línea ${minScoreLine}; valor = \`Number(process.env.MENI_MIN_APPROVED_SCORE || '90')\`.`);
  md.push('');
  md.push('## FASE 3 — Trazabilidad');
  md.push('');
  md.push('```text');
  md.push('runMeniAsync(input)');
  md.push('  └─ runMeni(input)');
  md.push('       └─ evaluateMeni(input)');
  md.push('            ├─ detectTier(input.titulo, contenido, categoria)');
  md.push('            ├─ getPerfilEditorial(...)');
  md.push('            ├─ runEditorialBrain({...input, tierThresholds})');
  md.push('            │    ├─ runNewsValueEngine');
  md.push('            │    ├─ runCompetitionEngine');
  md.push('            │    ├─ runNicaraguaInformateEngine');
  md.push('            │    ├─ runReaderQuestionsEngine');
  md.push('            │    ├─ runExplanationEngine');
  md.push('            │    ├─ runEditorialDifferenceEngine');
  md.push('            │    ├─ runPublicValueEngine');
  md.push('            │    ├─ runReaderRetentionEngine');
  md.push('            │    ├─ runStoryCompletenessEngine');
  md.push('            │    ├─ runIntelligenceEngine');
  md.push('            │    ├─ runStoryPlanner');
  md.push('            │    ├─ runAntiClickbait');
  md.push('            │    ├─ runReaderJourney');
  md.push('            │    ├─ runUtilityGate');
  md.push('            │    ├─ buildDiagnostico');
  md.push('            │    ├─ computeEditorialDNA (adnNI)');
  md.push('            │    ├─ calcularEvaluacionCategoria');
  md.push('            │    └─ calcularScoreEjecutivo → { score, puntosPerdidos }');
  md.push('            ├─ pipelineV4(input) → EvaluacionEditorial (secundaria)');
  md.push('            ├─ analyzeSEO, analyzeForensic, analyzeEEAT, analyzeDiscover, analyzeAdSense, buildValorEditorial, audit');
  md.push('            ├─ runQualityGate (bloqueos técnicos)');
  md.push('            ├─ scoreFinal = editorialDecision.score');
  md.push('            └─ return MeniResult');
  md.push('```');
  md.push('');
  md.push('## FASE 4 — Dependencias detectadas');
  md.push('');
  for (const [k, v] of Object.entries(dependencyKeywords)) {
    if (v.length) {
      md.push(`- **${k}**: ${[...new Set(v)].join(', ')}`);
    }
  }
  md.push('');
  md.push('## FASE 5 — Pesos reales');
  md.push('');
  md.push('### Peso de los puntos perdidos (calcularScoreEjecutivo)');
  md.push('');
  md.push('| Concepto | Puntos |');
  md.push('| --- | --- |');
  md.push('| Transcribir / copiar / plagiar / boletín | 10 |');
  md.push('| Sensacionalismo / clickbait / prohibida | 8 |');
  md.push('| Dato / cifra / nombre / fuente | 4 |');
  md.push('| Longitud / extensión / relleno / redacción | 3 |');
  md.push('| No enseña nada nuevo al lector | 25 |');
  md.push('| No aporta razón para leerla en Nicaragua Informate | 25 |');
  md.push('| Aporte editorial inválido (SEO/redacción no son valor) | 15 |');
  md.push('| Términos faltantes de la matriz de categoría | 2 |');
  md.push('');
  md.push('### Puntos por categoría (calcularEvaluacionCategoria)');
  md.push('');
  md.push('- Cada intención de contexto, explicación y servicio: **2 puntos**.');
  md.push('- Score de categoría = `100 - (perdidos / total) * 100`.');
  md.push('- Los términos se buscan en `titulo + contenido + resumen`, normalizados (minúsculas, sin tildes).');
  md.push('');
  md.push('## FASE 6 — Saturación');
  md.push('');
  md.push('Funciones / líneas donde se detectan techos o saturaciones:');
  md.push('');
  md.push('| Archivo | Línea | Código |');
  md.push('| --- | --- | --- |');
  for (const c of capped) {
    md.push(`| ${c.file} | ${c.line} | \`${c.text.replace(/`/g, '\\`')}\` |`);
  }
  md.push('');
  md.push('## FASE 7 — Explicación de los Δ = 0');
  md.push('');
  md.push('### Causa matemática');
  md.push('');
  md.push('1. El único valor que llega a `scoreFinal` es `editorialDecision.score`, generado por `calcularScoreEjecutivo`.');
  md.push('2. `calcularScoreEjecutivo` no suma puntos. Parte de 100 y **resta** por cada problema.');
  md.push('3. Los problemas se dividen en:');
  md.push('   - **puntosCategoria**: términos del contrato editorial que faltan en `titulo + contenido + resumen`.');
  md.push('   - **acciones**: recomendaciones de los sub-motores cuyo texto contiene palabras clave.');
  md.push('   - **readerLearning / editorialContribution**: penalizaciones si no responde a `>10` caracteres o si el aporte es SEO/redacción.');
  md.push('4. Ninguno de los 10 experimentos agregó los **sinónimos exactos** que el contrato busca, por lo que `puntosPerdidos` no cambió.');
  md.push('5. Los módulos secundarios (`analyzeSEO`, `analyzeEEAT`, `audit`, etc.) ya devolvían 100 antes de los experimentos y no participan en `scoreFinal`.');
  md.push('');
  md.push('### Función que impide el aumento');
  md.push('');
  md.push('`calcularScoreEjecutivo` en `lib/meni/editorial-brain/index.ts` es una resta decreciente. Aunque el HTML mejore la estructura, si no se cubren los términos de la matriz de categoría y no desaparecen las acciones/penalizaciones, el score no puede subir.');
  md.push('');
  md.push('### Por qué reorganizar no tiene efecto');
  md.push('');
  md.push('- `calcularEvaluacionCategoria` hace `texto = titulo + contenido + resumen`, normalizado, y busca substrings.');
  md.push('- No evalúa jerarquía HTML, H2, párrafos ni secciones. Sólo importa si el texto contiene los sinónimos.');
  md.push('- `calcularScoreEjecutivo` y `calcularEvaluacionCategoria` son insensibles a cambios estructurales puros.');
  md.push('');
  md.push('## FASE 8 — Recomendaciones (sin modificar código)');
  md.push('');
  md.push('Para que MENI premie antecedentes, contexto, impacto ciudadano, cronología, marco legal o explicación práctica, habría que modificar:');
  md.push('');
  md.push('- `lib/meni/editorial-brain/index.ts` → `calcularScoreEjecutivo` para cambiar la fórmula de 100 − X a una que sume bonificaciones.');
  md.push('- `lib/meni/editorial-brain/index.ts` → `calcularEvaluacionCategoria` para reconocer secciones estructurales (H2) como cumplimiento, no sólo substrings.');
  md.push('- `lib/meni/editorial-dna/engine.ts` → `computeEditorialDNA` para que `adnNI` influya en el score final.');
  md.push('- `lib/meni/core.ts` → `evaluateMeni` para usar `editorialDna.adnNI` o una combinación con `editorialDecision.score`.');
  md.push('- `lib/meni/editorial-contract.ts` → `CONTRATO_GLOBAL` para ampliar sinónimos de contexto/explicación/servicio.');
  md.push('- `lib/meni/auditor.ts` → `audit` si se desea que `originalidad`, `utilidad`, `redaccion` aporten al score.');
  md.push('');

  await fs.writeFile(MD_PATH, md.join('\n'), 'utf-8');

  // Impresión en consola
  console.log('=== AUDITORÍA FORENSE MENI ===');
  console.log(`Archivos escaneados en ${MENI_DIR}: ${files.length}`);
  console.log(`Funciones exportadas/encontradas: ${funciones.length}`);
  console.log('');
  console.log('--- Funciones encontradas ---');
  for (const fn of funciones.slice(0, 30)) {
    console.log(`${fn.file}:${fn.line} → ${fn.name}`);
  }
  if (funciones.length > 30) console.log(`... y ${funciones.length - 30} más.`);
  console.log('');
  console.log('--- Mapa del score ---');
  console.log(`scoreFinal asignado en lib/meni/core.ts:${scoreFinalLine}`);
  console.log(`score final calculado en lib/meni/editorial-brain/index.ts:${calcScoreLine} (calcularScoreEjecutivo)`);
  console.log(`evaluación de categoría en lib/meni/editorial-brain/index.ts:${calcEvalCategoriaLine}`);
  console.log(`ADN NI en lib/meni/editorial-dna/engine.ts:${computeDnaLine}`);
  console.log('');
  console.log('--- Variables saturadas / con cap 0-100 ---');
  for (const c of capped.slice(0, 20)) {
    console.log(`${c.file}:${c.line} → ${c.text.slice(0, 100)}`);
  }
  console.log('');
  console.log('--- Variables sin uso aparente ---');
  for (const u of unused.slice(0, 20)) {
    console.log(u);
  }
  console.log('');
  console.log('--- Pesos detectados ---');
  for (const p of adnPesos) console.log(`ADN ${p.name} = ${p.value}`);
  for (const p of selloPesos) console.log(`SelloNI ${p.name} = ${p.value}`);
  console.log('');
  console.log(`Reporte escrito en: ${MD_PATH}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
