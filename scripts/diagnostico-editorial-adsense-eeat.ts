import { promises as fs } from 'fs';
import { join } from 'path';

interface MeniResult {
  slug: string;
  titulo: string;
  categoria: string;
  autor: string;
  palabras: number;
  leadPalabras: number;
  leadTieneQueDondeCuando: boolean;
  rellenoEmocional: string[];
  transicionesIA: string[];
  tieneH2: boolean;
  auditorPuntosCorregir: string[];
  meniScore: number;
  meniAprobado: boolean;
  meniCalificacion: string;
  meniDecision: string;
  meniRecomendacion: string;
  meniDiagnostico: string;
}

interface MeniJson {
  total: number;
  analizadas: number;
  totalFallos: number;
  resultados: MeniResult[];
}

interface V2Result {
  slug: string;
  titulo: string;
  categoria: string;
  scoreMeni: number;
  calificacionMeni: string;
  puntuacionTecnica: number;
  riesgoTecnico: string;
  penalizaciones: Array<{ regla: string; puntos: number; severidad: string }>;
  observaciones: any[];
  recomendaciones: string[];
  mejorasSugeridas: number;
  estadoFinal: string;
}

interface V2Json {
  total: number;
  resultados: V2Result[];
}

interface DiagnosticoItem {
  rank: number;
  slug: string;
  titulo: string;
  categoria: string;
  autor: string;
  scoreMeni: number;
  calificacionMeni: string;
  puntuacionTecnica: number;
  riesgoTecnico: string;
  utilidad: string;
  profundidad: string;
  originalidad: string;
  eeat: string;
  riesgoAdSense: string[];
  recomendacionFinal: string;
  adsenseListo: boolean;
  mejorasSugeridas: number;
  recomendaciones: string[];
}

function parseDiagnosticoNumbers(text: string): { aFavor: number; enContra: number; mejoras: number } {
  const aFavorMatch = text?.match(/(\d+)\s*puntos?\s*a\s*favor/i);
  const enContraMatch = text?.match(/(\d+)\s*en\s*contra/i);
  const mejorasMatch = text?.match(/(\d+)\s*mejora\(s\)/i);
  return {
    aFavor: aFavorMatch ? Number(aFavorMatch[1]) : 0,
    enContra: enContraMatch ? Number(enContraMatch[1]) : 0,
    mejoras: mejorasMatch ? Number(mejorasMatch[1]) : 0,
  };
}

function clasificarUtilidad(score: number): string {
  if (score >= 90) return 'A) Alto valor';
  if (score >= 80) return 'B) Valor aceptable';
  return 'C) Poco valor';
}

function clasificarProfundidad(
  calificacion: string,
  aFavor: number,
  leadContexto: boolean,
  tieneH2: boolean,
  recomendacion: string,
): string {
  if (calificacion === 'NO_PUBLICABLE' || recomendacion === 'no publicar') return 'Baja';

  let base = 'Regular';
  if (calificacion === 'PUBLICABLE ORO') base = 'Alta';
  else if (calificacion === 'PUBLICABLE') base = 'Buena';
  else if (calificacion === 'MEJORAR') base = 'Regular';

  if (aFavor >= 6 && base !== 'Alta') base = 'Alta';
  else if (aFavor >= 4 && base === 'Regular') base = 'Buena';
  else if (aFavor <= 1 && base !== 'Baja') base = 'Regular';

  if ((leadContexto || tieneH2) && (base === 'Regular')) base = 'Buena';

  return base;
}

function clasificarOriginalidad(
  calificacion: string,
  rellenoEmocional: string[],
  transicionesIA: string[],
): string {
  let base = 'Muy baja';
  if (calificacion === 'PUBLICABLE ORO') base = 'Alta';
  else if (calificacion === 'PUBLICABLE') base = 'Media';
  else if (calificacion === 'MEJORAR') base = 'Baja';

  if (calificacion !== 'NO_PUBLICABLE' && (rellenoEmocional.length > 0 || transicionesIA.length > 0)) {
    if (base === 'Alta') base = 'Media';
    else if (base === 'Media') base = 'Baja';
    else if (base === 'Baja') base = 'Muy baja';
  }

  return base;
}

function calcularEeat(
  autor: string,
  categoria: string,
  score: number,
  calificacion: string,
  leadContexto: boolean,
  tieneH2: boolean,
  rellenoEmocional: string[],
  transicionesIA: string[],
): string {
  let pts = 0;
  if (autor && autor.length > 1) pts += 1;
  if (categoria && categoria.length > 1) pts += 1;
  if (score >= 80) pts += 1;
  if (calificacion === 'PUBLICABLE ORO' || calificacion === 'PUBLICABLE') pts += 1;
  if (leadContexto) pts += 1;
  if (tieneH2) pts += 1;
  if (rellenoEmocional.length === 0) pts += 1;
  if (transicionesIA.length === 0) pts += 1;

  if (pts >= 6) return 'Alto';
  if (pts >= 4) return 'Medio';
  return 'Bajo';
}

function construirRiesgosAdSense(
  calificacion: string,
  score: number,
  relleno: string[],
  transiciones: string[],
  riesgoTecnico: string,
  puntuacionTecnica: number,
  leadContexto: boolean,
  aFavor: number,
): string[] {
  const riesgos: string[] = [];

  if (calificacion === 'NO_PUBLICABLE') riesgos.push('Calificación MENI NO PUBLICABLE');
  if (score < 80) riesgos.push('Score MENI bajo');
  if (relleno.length > 0) riesgos.push('Lenguaje emocional detectado');
  if (transiciones.length > 0) riesgos.push('Conectores IA/repetitivos detectados');
  if (riesgoTecnico === 'alto' || riesgoTecnico === 'crítico') riesgos.push(`Riesgo técnico ${riesgoTecnico}`);
  if (puntuacionTecnica < 90) riesgos.push('Puntuación técnica baja');
  if (!leadContexto && score < 90) riesgos.push('Lead sin contexto');
  if (aFavor < 3 && calificacion !== 'PUBLICABLE ORO') riesgos.push('Pocos puntos editoriales a favor');

  return riesgos;
}

function recomendacionFinal(
  meniRecomendacion: string,
  calificacion: string,
  riesgoTecnico: string,
  score: number,
): string {
  if (meniRecomendacion === 'no publicar' || calificacion === 'NO_PUBLICABLE' || score < 60 || riesgoTecnico === 'crítico') {
    return '🔴 Requiere reconstrucción';
  }
  if (meniRecomendacion === 'mejorar' || calificacion === 'MEJORAR' || riesgoTecnico === 'alto') {
    return '🟡 Publicable con mejora editorial';
  }
  if (meniRecomendacion === 'publicar' && (calificacion === 'PUBLICABLE ORO' || calificacion === 'PUBLICABLE') && riesgoTecnico !== 'alto' && riesgoTecnico !== 'crítico') {
    return '🟢 Publicable AdSense';
  }
  return '🟡 Publicable con mejora editorial';
}

function esAdsenseListo(
  meniRecomendacion: string,
  calificacion: string,
  score: number,
  riesgoTecnico: string,
  riesgos: string[],
): boolean {
  return (
    meniRecomendacion === 'publicar' &&
    score >= 90 &&
    (calificacion === 'PUBLICABLE ORO' || calificacion === 'PUBLICABLE') &&
    riesgoTecnico !== 'alto' &&
    riesgoTecnico !== 'crítico' &&
    riesgos.length === 0
  );
}

async function main() {
  const meniPath = join(process.cwd(), 'auditoria-meni-vs-auditor.json');
  const v2Path = join(process.cwd(), 'auditoria-editorial-v2.json');

  const meniData: MeniJson = JSON.parse(await fs.readFile(meniPath, 'utf-8'));
  const v2Data: V2Json = JSON.parse(await fs.readFile(v2Path, 'utf-8'));

  const v2BySlug = new Map<string, V2Result>();
  for (const r of v2Data.resultados) {
    v2BySlug.set(r.slug, r);
  }

  const diagnosticos: DiagnosticoItem[] = [];

  for (const m of meniData.resultados) {
    if (!m || !m.slug || !m.meniCalificacion) continue;

    const v2 = v2BySlug.get(m.slug);
    const v2Puntuacion = v2?.puntuacionTecnica ?? m.meniScore;
    const v2Riesgo = v2?.riesgoTecnico ?? 'medio';

    const { aFavor } = parseDiagnosticoNumbers(m.meniDiagnostico);

    const utilidad = clasificarUtilidad(m.meniScore);
    const profundidad = clasificarProfundidad(
      m.meniCalificacion,
      aFavor,
      m.leadTieneQueDondeCuando,
      m.tieneH2,
      m.meniRecomendacion,
    );
    const originalidad = clasificarOriginalidad(m.meniCalificacion, m.rellenoEmocional, m.transicionesIA);
    const eeat = calcularEeat(
      m.autor,
      m.categoria,
      m.meniScore,
      m.meniCalificacion,
      m.leadTieneQueDondeCuando,
      m.tieneH2,
      m.rellenoEmocional,
      m.transicionesIA,
    );
    const riesgos = construirRiesgosAdSense(
      m.meniCalificacion,
      m.meniScore,
      m.rellenoEmocional,
      m.transicionesIA,
      v2Riesgo,
      v2Puntuacion,
      m.leadTieneQueDondeCuando,
      aFavor,
    );
    const recFinal = recomendacionFinal(m.meniRecomendacion, m.meniCalificacion, v2Riesgo, m.meniScore);
    const adsense = esAdsenseListo(m.meniRecomendacion, m.meniCalificacion, m.meniScore, v2Riesgo, riesgos);

    diagnosticos.push({
      rank: 0,
      slug: m.slug,
      titulo: m.titulo?.replace(/\s+/g, ' ').trim() ?? '',
      categoria: m.categoria,
      autor: m.autor,
      scoreMeni: m.meniScore,
      calificacionMeni: m.meniCalificacion,
      puntuacionTecnica: v2Puntuacion,
      riesgoTecnico: v2Riesgo,
      utilidad,
      profundidad,
      originalidad,
      eeat,
      riesgoAdSense: riesgos,
      recomendacionFinal: recFinal,
      adsenseListo: adsense,
      mejorasSugeridas: v2?.mejorasSugeridas ?? 0,
      recomendaciones: v2?.recomendaciones ?? [],
    });
  }

  // Ranking por MENI, luego técnica.
  diagnosticos.sort((a, b) => {
    if (b.scoreMeni !== a.scoreMeni) return b.scoreMeni - a.scoreMeni;
    return b.puntuacionTecnica - a.puntuacionTecnica;
  });

  for (let i = 0; i < diagnosticos.length; i++) {
    diagnosticos[i].rank = i + 1;
  }

  const total = diagnosticos.length;
  const listasAdSense = diagnosticos.filter((d) => d.adsenseListo).length;
  const porcentajeAdSense = total > 0 ? (listasAdSense / total) * 100 : 0;

  const top20 = diagnosticos.slice(0, 20);
  const bottom20 = diagnosticos.slice(-20).reverse();

  // 10 que deberían actualizarse primero: MEJORAR con mayor MENI, luego PUBLICABLE con riesgo medio.
  const mejorar = diagnosticos
    .filter((d) => d.calificacionMeni === 'MEJORAR' || (d.scoreMeni >= 80 && d.scoreMeni < 90 && d.calificacionMeni !== 'NO_PUBLICABLE'))
    .slice(0, 10);

  const utilidadCounts = { A: 0, B: 0, C: 0 };
  const profundidadCounts = { Alta: 0, Buena: 0, Regular: 0, Baja: 0 };
  const originalidadCounts = { Alta: 0, Media: 0, Baja: 0, 'Muy baja': 0 };
  const eeatCounts = { Alto: 0, Medio: 0, Bajo: 0 };

  for (const d of diagnosticos) {
    if (d.utilidad.startsWith('A')) utilidadCounts.A++;
    else if (d.utilidad.startsWith('B')) utilidadCounts.B++;
    else utilidadCounts.C++;

    profundidadCounts[d.profundidad as keyof typeof profundidadCounts] =
      (profundidadCounts[d.profundidad as keyof typeof profundidadCounts] || 0) + 1;
    originalidadCounts[d.originalidad as keyof typeof originalidadCounts] =
      (originalidadCounts[d.originalidad as keyof typeof originalidadCounts] || 0) + 1;
    eeatCounts[d.eeat as keyof typeof eeatCounts] =
      (eeatCounts[d.eeat as keyof typeof eeatCounts] || 0) + 1;
  }

  // JSON ranking
  await fs.writeFile(
    join(process.cwd(), 'DIAGNOSTICO-RANKING-227.json'),
    JSON.stringify(
      {
        total,
        listasParaAdSense: listasAdSense,
        porcentajeAdSense: Number(porcentajeAdSense.toFixed(2)),
        ranking: diagnosticos,
      },
      null,
      2,
    ),
  );

  // Markdown reporte
  const md: string[] = [];
  md.push('# DIAGNÓSTICO EDITORIAL ADSENSE / EEAT — 227 NOTICIAS');
  md.push('');
  md.push('**Nota metodológica:** Este diagnóstico se basa principalmente en el score MENI (motor editorial humanoide) y en la auditoría técnica v2. No se evalúa por número de palabras, H2 ni conectores comunes. El objetivo es estimar valor real para el lector, preparación EEAT y riesgo AdSense.');
  md.push('');

  md.push('## Resumen ejecutivo');
  md.push('');
  md.push(`- Total noticias evaluadas: **${total}**`);
  md.push(`- Listas para solicitar AdSense (alta probabilidad): **${listasAdSense}** (${porcentajeAdSense.toFixed(2)} %)`);
  md.push(`- Requieren reconstrucción: **${diagnosticos.filter((d) => d.recomendacionFinal.startsWith('🔴')).length}**`);
  md.push(`- Publicables con mejora editorial: **${diagnosticos.filter((d) => d.recomendacionFinal.startsWith('🟡')).length}**`);
  md.push(`- Publicables AdSense: **${diagnosticos.filter((d) => d.recomendacionFinal.startsWith('🟢')).length}**`);
  md.push('');

  md.push('## Distribución de dimensiones editoriales');
  md.push('');
  md.push('### Utilidad para el usuario');
  md.push(`- A) Alto valor: ${utilidadCounts.A} (${((utilidadCounts.A / total) * 100).toFixed(1)} %)`);
  md.push(`- B) Valor aceptable: ${utilidadCounts.B} (${((utilidadCounts.B / total) * 100).toFixed(1)} %)`);
  md.push(`- C) Poco valor: ${utilidadCounts.C} (${((utilidadCounts.C / total) * 100).toFixed(1)} %)`);
  md.push('');

  md.push('### Profundidad periodística');
  md.push(`- Alta: ${profundidadCounts.Alta}`);
  md.push(`- Buena: ${profundidadCounts.Buena}`);
  md.push(`- Regular: ${profundidadCounts.Regular}`);
  md.push(`- Baja: ${profundidadCounts.Baja}`);
  md.push('');

  md.push('### Originalidad Nicaragua Informate');
  md.push(`- Alta: ${originalidadCounts.Alta}`);
  md.push(`- Media: ${originalidadCounts.Media}`);
  md.push(`- Baja: ${originalidadCounts.Baja}`);
  md.push(`- Muy baja: ${originalidadCounts['Muy baja']}`);
  md.push('');

  md.push('### EEAT');
  md.push(`- Alto: ${eeatCounts.Alto}`);
  md.push(`- Medio: ${eeatCounts.Medio}`);
  md.push(`- Bajo: ${eeatCounts.Bajo}`);
  md.push('');

  md.push('## Top 20 mejores noticias');
  md.push('');
  md.push('| # | slug | MENI | Técnica | Utilidad | Profundidad | EEAT | Recomendación |');
  md.push('| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |');
  for (const d of top20) {
    md.push(`| ${d.rank} | ${d.slug} | ${d.scoreMeni} | ${d.puntuacionTecnica} | ${d.utilidad} | ${d.profundidad} | ${d.eeat} | ${d.recomendacionFinal} |`);
  }
  md.push('');

  md.push('## 20 noticias que necesitan más trabajo');
  md.push('');
  md.push('| # | slug | MENI | Técnica | Utilidad | Profundidad | EEAT | Recomendación |');
  md.push('| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |');
  for (const d of bottom20) {
    md.push(`| ${d.rank} | ${d.slug} | ${d.scoreMeni} | ${d.puntuacionTecnica} | ${d.utilidad} | ${d.profundidad} | ${d.eeat} | ${d.recomendacionFinal} |`);
  }
  md.push('');

  md.push('## 10 noticias a actualizar primero (mejor retorno de inversión)');
  md.push('');
  md.push('Se priorizan las noticias con score MENI entre 80 y 90 o en calificación MEJORAR, porque están a punto de ser publicables con cambios pequeños.');
  md.push('');
  md.push('| # | slug | MENI | Técnica | Calificación | Riesgo AdSense |');
  md.push('| ---- | ---- | ---- | ---- | ---- | ---- |');
  for (let i = 0; i < mejorar.length; i++) {
    const d = mejorar[i];
    md.push(`| ${i + 1} | ${d.slug} | ${d.scoreMeni} | ${d.puntuacionTecnica} | ${d.calificacionMeni} | ${d.riesgoAdSense.join(', ') || 'Ninguno'} |`);
  }
  md.push('');

  md.push('## Ranking completo de las 227 noticias');
  md.push('');
  md.push('| Rank | slug | MENI | Técnica | Calif. MENI | Riesgo técnico | Utilidad | EEAT | Recomendación |');
  md.push('| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |');
  for (const d of diagnosticos) {
    md.push(`| ${d.rank} | ${d.slug} | ${d.scoreMeni} | ${d.puntuacionTecnica} | ${d.calificacionMeni} | ${d.riesgoTecnico} | ${d.utilidad} | ${d.eeat} | ${d.recomendacionFinal} |`);
  }
  md.push('');

  md.push('## Recomendaciones generales');
  md.push('');
  md.push(`1. Aproximadamente el **${porcentajeAdSense.toFixed(1)} %** del contenido parece listo para una solicitud de AdSense sin riesgo editorial alto.`);
  md.push('2. Las noticias con calificación MEJORAR y score entre 80-90 son la primera prioridad de actualización.');
  md.push('3. El riesgo AdSense más frecuente es la combinación de lenguaje emocional, conectores IA y falta de contexto en el lead.');
  md.push('4. EEAT se sostiene por autor, categoría, estructura y calificación MENI. Las notas con EEAT bajo suelen ser flashes sin autor.');
  md.push('5. No se recomienda solicitar AdSense hasta que al menos el 70 % del contenido esté en 🟢 o 🟡 con riesgo medio o bajo.');
  md.push('');

  await fs.writeFile(join(process.cwd(), 'DIAGNOSTICO-EDITORIAL-227.md'), md.join('\n'), 'utf-8');

  console.log(`Diagnóstico completado: ${total} noticias`);
  console.log(`Listas AdSense: ${listasAdSense} (${porcentajeAdSense.toFixed(2)} %)`);
  console.log('Archivos: DIAGNOSTICO-EDITORIAL-227.md, DIAGNOSTICO-RANKING-227.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
