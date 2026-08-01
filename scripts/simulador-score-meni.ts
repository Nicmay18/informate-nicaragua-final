import { promises as fs } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const INPUT_PATH = join(ROOT, 'DIAGNOSTICO-RANKING-227.json');
const MD_PATH = join(ROOT, 'SIMULACION-NUEVO-SCORE-MENI.md');
const JSON_PATH = join(ROOT, 'SIMULACION-NUEVO-SCORE-MENI.json');

const MAP_UTILIDAD: Record<string, number> = {
  'A) Alto valor': 100,
  'B) Medio valor': 60,
  'B) Valor aceptable': 55,
  'C) Bajo valor': 30,
  'C) Poco valor': 25,
  'D) Sin valor': 0,
};

const MAP_3NIVEL: Record<string, number> = {
  'Alta': 95,
  'Alto': 95,
  'Buena': 80,
  'Media': 60,
  'Medio': 60,
  'Baja': 30,
  'Bajo': 30,
  'Muy baja': 10,
  'Muy bajo': 10,
};

function aNumero(label: string | undefined, map: Record<string, number>, log: (s: string) => void): number {
  if (!label) return 0;
  if (map[label] !== undefined) return map[label];
  log(label);
  return 0;
}

function redondear(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

async function main() {
  const input = JSON.parse(await fs.readFile(INPUT_PATH, 'utf-8'));
  const ranking: any[] = input.ranking || [];

  const noticias: any[] = [];
  const sinMapear: Set<string> = new Set();
  const logMissing = (s: string) => sinMapear.add(s);

  for (const n of ranking) {
    const utilidad = aNumero(n.utilidad, MAP_UTILIDAD, logMissing);
    const profundidad = aNumero(n.profundidad, MAP_3NIVEL, logMissing);
    const originalidad = aNumero(n.originalidad, MAP_3NIVEL, logMissing);
    const eeat = aNumero(n.eeat, MAP_3NIVEL, logMissing);
    // Por ausencia de campo directo, se aproxima Aporte Nicaragua Informate con originalidad.
    const aporteNI = originalidad;
    const tecnica = typeof n.puntuacionTecnica === 'number' ? n.puntuacionTecnica : 0;

    const scoreNuevo =
      utilidad * 0.30 +
      profundidad * 0.20 +
      originalidad * 0.15 +
      eeat * 0.15 +
      aporteNI * 0.10 +
      tecnica * 0.10;

    noticias.push({
      slug: n.slug,
      titulo: n.titulo,
      categoria: n.categoria,
      scoreActual: n.scoreMeni,
      scoreNuevo: redondear(scoreNuevo),
      diferencia: redondear(scoreNuevo) - n.scoreMeni,
      componentes: {
        utilidad,
        profundidad,
        originalidad,
        eeat,
        aporteNI,
        tecnica,
      },
    });
  }

  const scoreActualArr = noticias.map((x) => x.scoreActual);
  const scoreNuevoArr = noticias.map((x) => x.scoreNuevo);
  const promActual = scoreActualArr.reduce((a, b) => a + b, 0) / noticias.length;
  const promNuevo = scoreNuevoArr.reduce((a, b) => a + b, 0) / noticias.length;
  const suben = noticias.filter((x) => x.diferencia > 0).length;
  const bajan = noticias.filter((x) => x.diferencia < 0).length;
  const iguales = noticias.filter((x) => x.diferencia === 0).length;
  const mayorMejora = noticias.reduce((p, c) => (c.diferencia > p.diferencia ? c : p), noticias[0]);
  const mayorCaida = noticias.reduce((p, c) => (c.diferencia < p.diferencia ? c : p), noticias[0]);

  // Análisis por categoría
  const porCategoria: Record<string, { count: number; deltaSum: number; actual: number; nuevo: number }> = {};
  for (const n of noticias) {
    const c = n.categoria || 'General';
    const p = porCategoria[c] || { count: 0, deltaSum: 0, actual: 0, nuevo: 0 };
    p.count++;
    p.deltaSum += n.diferencia;
    p.actual += n.scoreActual;
    p.nuevo += n.scoreNuevo;
    porCategoria[c] = p;
  }
  const categoriaMejora = Object.entries(porCategoria).sort((a, b) => b[1].deltaSum / b[1].count - a[1].deltaSum / a[1].count)[0];

  // Análisis por criterio: peso * varianza
  const keys = ['utilidad', 'profundidad', 'originalidad', 'eeat', 'aporteNI', 'tecnica'] as const;
  type ComponenteKey = (typeof keys)[number];
  const pesos: Record<ComponenteKey, number> = { utilidad: 0.30, profundidad: 0.20, originalidad: 0.15, eeat: 0.15, aporteNI: 0.10, tecnica: 0.10 };
  const componentesAvg: Record<ComponenteKey, number> = { utilidad: 0, profundidad: 0, originalidad: 0, eeat: 0, aporteNI: 0, tecnica: 0 };
  for (const k of keys) {
    componentesAvg[k] = noticias.reduce((s, n) => s + n.componentes[k], 0) / noticias.length;
  }
  const componenteMayorImpacto = keys
    .map((k) => ({ k, contribucion: componentesAvg[k] * pesos[k] }))
    .sort((a, b) => b.contribucion - a.contribucion)[0].k;

  // Preguntas
  const umbralExcelente = 95;
  const mediasAExcelentes = noticias.filter((n) => n.scoreActual < umbralExcelente && n.scoreNuevo >= umbralExcelente).length;
  const excelentesBajan = noticias.filter((n) => n.scoreActual >= umbralExcelente && n.scoreNuevo < umbralExcelente).length;

  // Validación: MENI alto pero originalidad baja o utilidad media
  const altoMeniBajaOriginalidad = noticias.filter(
    (n) => n.scoreActual >= 95 && ['Media', 'Baja', 'Muy baja'].some((x) => ranking.find((r) => r.slug === n.slug)?.originalidad === x)
  );
  const altoMeniUtilidadMedia = noticias.filter(
    (n) => n.scoreActual >= 95 && ranking.find((r) => r.slug === n.slug)?.utilidad !== 'A) Alto valor'
  );

  const reporte = {
    total: noticias.length,
    promedioScoreActual: Number(promActual.toFixed(2)),
    promedioScoreNuevo: Number(promNuevo.toFixed(2)),
    suben,
    bajan,
    iguales,
    mayorMejora: { slug: mayorMejora.slug, titulo: mayorMejora.titulo, diferencia: mayorMejora.diferencia },
    mayorCaida: { slug: mayorCaida.slug, titulo: mayorCaida.titulo, diferencia: mayorCaida.diferencia },
    categoriaMejora: categoriaMejora ? { categoria: categoriaMejora[0], deltaPromedio: Number((categoriaMejora[1].deltaSum / categoriaMejora[1].count).toFixed(2)) } : null,
    componenteMayorImpacto,
    mediasAExcelentes,
    excelentesBajan,
    altoMeniBajaOriginalidadCount: altoMeniBajaOriginalidad.length,
    altoMeniUtilidadMediaCount: altoMeniUtilidadMedia.length,
    noticias,
  };

  await fs.writeFile(JSON_PATH, JSON.stringify(reporte, null, 2), 'utf-8');

  const md: string[] = [];
  md.push('# Simulación de nuevo score MENI');
  md.push('');
  md.push('Fuente: `DIAGNOSTICO-RANKING-227.json`.');
  md.push('');
  md.push('## Fórmula alternativa');
  md.push('');
  md.push('| Criterio | Peso |');
  md.push('| --- | --- |');
  md.push('| Valor para el lector (Utilidad) | 30% |');
  md.push('| Profundidad | 20% |');
  md.push('| Originalidad | 15% |');
  md.push('| EEAT | 15% |');
  md.push('| Aporte Nicaragua Informate | 10% |');
  md.push('| Penalizaciones técnicas (puntuación técnica) | 10% |');
  md.push('');
  md.push('## Conversión de etiquetas a números');
  md.push('');
  md.push('| Concepto | Etiquetas → Valor |');
  md.push('| --- | --- |');
  md.push('| Utilidad | `A) Alto valor` = 100, `B) Medio valor` = 60, `C) Bajo valor` = 30, `D) Sin valor` = 0 |');
  md.push('| Profundidad, Originalidad, EEAT | `Alta/Alto` = 95, `Media/Medio` = 60, `Baja/Bajo` = 30, `Muy baja` = 10 |');
  md.push('| Técnica | `puntuacionTecnica` directa (0-100) |');
  md.push('| Aporte Nicaragua Informate | Sin campo directo: se aproxima con Originalidad |');
  md.push('');
  md.push('## Estadísticas generales');
  md.push('');
  md.push(`- Total noticias: ${noticias.length}`);
  md.push(`- Promedio score actual: ${promActual.toFixed(2)}`);
  md.push(`- Promedio score nuevo: ${promNuevo.toFixed(2)}`);
  md.push(`- Suben: ${suben}`);
  md.push(`- Bajan: ${bajan}`);
  md.push(`- Iguales: ${iguales}`);
  md.push(`- Mayor mejora: ${mayorMejora.titulo} (${mayorMejora.diferencia} pts)`);
  md.push(`- Mayor caída: ${mayorCaida.titulo} (${mayorCaida.diferencia} pts)`);
  md.push('');
  md.push('## Distribución por categorías');
  md.push('');
  md.push('| Categoría | N | Score actual | Score nuevo | Δ promedio |');
  md.push('| --- | --- | --- | --- | --- |');
  for (const [cat, vals] of Object.entries(porCategoria).sort((a, b) => (b[1].nuevo / b[1].count) - (a[1].nuevo / a[1].count))) {
    md.push(`| ${cat} | ${vals.count} | ${(vals.actual / vals.count).toFixed(2)} | ${(vals.nuevo / vals.count).toFixed(2)} | ${(vals.deltaSum / vals.count).toFixed(2)} |`);
  }
  md.push('');
  md.push('## Análisis');
  md.push('');
  md.push(`1. **Noticias medias que pasarían a excelentes (≥${umbralExcelente}):** ${mediasAExcelentes}`);
  md.push(`2. **Noticias excelentes actuales que bajarían (<${umbralExcelente}):** ${excelentesBajan}`);
  md.push(`3. **Categoría que más mejora:** ${categoriaMejora ? categoriaMejora[0] : 'N/A'} (Δ promedio ${categoriaMejora ? (categoriaMejora[1].deltaSum / categoriaMejora[1].count).toFixed(2) : '0'})`);
  md.push(`4. **Criterio con mayor contribución ponderada promedio:** ${componenteMayorImpacto}`);
  md.push(`5. **¿Representa mejor el valor editorial?** El nuevo score separa noticias con MENI alto pero Originalidad baja o Utilidad media: ${altoMeniBajaOriginalidad.length} casos con originalidad baja y ${altoMeniUtilidadMedia.length} con utilidad no-alta bajan de rango.`);
  md.push('');
  md.push('## Casos de validación (MENI alto, editorial débil)');
  md.push('');
  md.push('| # | Slug | Título | Actual | Nuevo | Δ |');
  md.push('| --- | --- | --- | --- | --- | --- |');
  const muestra = altoMeniBajaOriginalidad.slice(0, 15);
  for (let i = 0; i < muestra.length; i++) {
    const n = muestra[i];
    md.push(`| ${i + 1} | ${n.slug} | ${n.titulo.slice(0, 60)} | ${n.scoreActual} | ${n.scoreNuevo} | ${n.diferencia} |`);
  }
  md.push('');
  md.push(`Resultado JSON guardado en \`${JSON_PATH}\`.`);

  await fs.writeFile(MD_PATH, md.join('\n'), 'utf-8');

  console.log('=== SIMULACIÓN NUEVO SCORE MENI ===');
  console.log(`Total noticias: ${noticias.length}`);
  console.log(`Promedio actual: ${promActual.toFixed(2)}`);
  console.log(`Promedio nuevo: ${promNuevo.toFixed(2)}`);
  console.log(`Suben: ${suben} | Bajan: ${bajan} | Iguales: ${iguales}`);
  console.log(`Mayor mejora: ${mayorMejora.titulo} (${mayorMejora.diferencia})`);
  console.log(`Mayor caída: ${mayorCaida.titulo} (${mayorCaida.diferencia})`);
  console.log(`Categoría que más mejora: ${categoriaMejora ? categoriaMejora[0] : 'N/A'}`);
  console.log(`Medias a excelentes: ${mediasAExcelentes}`);
  console.log(`Excelentes que bajan: ${excelentesBajan}`);
  console.log(`MENI alto + originalidad baja: ${altoMeniBajaOriginalidad.length}`);
  console.log(`MENI alto + utilidad media/baja: ${altoMeniUtilidadMedia.length}`);
  console.log('');
  console.log('Primeras 15 noticias:');
  console.log('Slug | Titulo | Actual | Nuevo | Δ');
  for (const n of noticias.slice(0, 15)) {
    console.log(`${n.slug} | ${n.titulo.slice(0, 55)} | ${n.scoreActual} | ${n.scoreNuevo} | ${n.diferencia}`);
  }
  if (sinMapear.size > 0) {
    console.log('');
    console.log('Etiquetas no mapeadas:', [...sinMapear]);
  }
  console.log('');
  console.log(`Reporte MD: ${MD_PATH}`);
  console.log(`Reporte JSON: ${JSON_PATH}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
