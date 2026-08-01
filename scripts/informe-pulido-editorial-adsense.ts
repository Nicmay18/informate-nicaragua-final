import { promises as fs } from 'fs';
import { join } from 'path';

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

interface PulidoItem {
  slug: string;
  titulo: string;
  categoria: string;
  meniActual: number;
  originalidad: string;
  eeat: string;
  prioridad: string;
  mejorasSugeridas: string[];
  valorActual: string;
  diferenciacion: string;
  notas: string;
}

interface PulidoJson {
  total: number;
  lista1: number;
  lista2: number;
  lista3: number;
  items: PulidoItem[];
}

function limpiarTitulo(t: string): string {
  return (t || '').replace(/\s+/g, ' ').trim();
}

function categoriaPeso(c: string): number {
  const cat = (c || '').toLowerCase();
  if (cat.includes('nacional')) return 20;
  if (cat.includes('suceso')) return 15;
  if (cat.includes('deporte')) return 10;
  if (cat.includes('internacional')) return 8;
  if (cat.includes('tecnolog')) return 8;
  if (cat.includes('cultura')) return 5;
  if (cat.includes('espectáculo')) return 2;
  return 5;
}

function prioridadScore(d: DiagnosticoItem): number {
  let score = d.scoreMeni;
  score += categoriaPeso(d.categoria);

  if (d.calificacionMeni === 'PUBLICABLE ORO') score += 10;
  else if (d.calificacionMeni === 'PUBLICABLE') score += 25;
  else if (d.calificacionMeni === 'MEJORAR') score += 30;

  if (d.originalidad === 'Muy baja') score += 25;
  else if (d.originalidad === 'Baja') score += 18;
  else if (d.originalidad === 'Media') score += 10;

  if (d.eeat === 'Medio') score += 10;
  if (d.riesgoTecnico === 'bajo') score += 8;
  if (d.riesgoTecnico === 'medio') score += 0;
  if (d.riesgoTecnico === 'alto') score -= 25;
  if (d.riesgoTecnico === 'crítico') score -= 50;

  score -= (d.riesgoAdSense || []).length * 4;

  return score;
}

function generarMejoras(d: DiagnosticoItem, prioridad: string): string[] {
  if (prioridad === 'Lista 2') {
    return [
      'Conservar calidad editorial actual',
      'Verificar que el título invite al descubrimiento orgánico',
      'Mantener fuentes y datos verificables',
      'Revisar imagen destacada si aplica',
    ];
  }

  if (prioridad === 'Lista 3') {
    return [
      'La mejora editorial no aportaría suficiente valor para el tiempo requerido',
      'Mantener tal como está o evaluar deprecar si la noticia es obsoleta',
    ];
  }

  const mejoras: string[] = [];
  const cat = (d.categoria || '').toLowerCase();
  const riesgos = d.riesgoAdSense || [];
  const orig = d.originalidad;
  const prof = d.profundidad;
  const eeat = d.eeat;
  const util = d.utilidad;
  const calif = d.calificacionMeni;
  const score = d.scoreMeni;

  // Diferenciación editorial por categoría cuando la originalidad no es alta
  if (orig === 'Muy baja' || orig === 'Baja' || orig === 'Media') {
    if (cat.includes('suceso')) {
      mejoras.push('Incluir cronología confirmada, actuación de autoridades, prevención y contexto social');
    } else if (cat.includes('internacional')) {
      mejoras.push('Explicar por qué el tema importa para Nicaragua y para nicaragüenses');
    } else if (cat.includes('nacional')) {
      mejoras.push('Ampliar impacto ciudadano, antecedentes y explicación práctica');
    } else if (cat.includes('deporte')) {
      mejoras.push('Agregar trayectoria del protagonista, importancia histórica y datos relevantes');
    } else if (cat.includes('tecnolog')) {
      mejoras.push('Explicar utilidad real, impacto para usuarios y resolver en qué cambia para Nicaragua');
    } else if (cat.includes('espectáculo') || cat.includes('cultura') || cat.includes('actualidad')) {
      mejoras.push('Conectar la noticia con el público local y explicar su relevancia para Nicaragua');
    } else {
      mejoras.push('Agregar contexto, antecedentes y consecuencias específicas de Nicaragua');
    }
  }

  // Profundidad periodística
  if (prof === 'Regular' || prof === 'Baja') {
    mejoras.push('Fortalecer consecuencias, instituciones involucradas y marco legal');
  }

  // EEAT
  if (eeat === 'Medio') {
    mejoras.push('Verificar autor en byline y asegurar que las fuentes queden explícitas');
  }

  // Riesgos concretos de AdSense
  if (riesgos.some((r) => r.includes('Lenguaje emocional'))) {
    mejoras.push('Revisar lenguaje emocional y sustituir por hechos confirmados');
  }
  if (riesgos.some((r) => r.includes('Conectores IA'))) {
    mejoras.push('Reescribir conectores repetitivos/IA para dar fluidez natural al texto');
  }
  if (riesgos.some((r) => r.includes('Lead sin contexto') || r.includes('Pocos puntos'))) {
    mejoras.push('Fortalecer el lead con antecedentes y datos confirmados');
  }
  if (riesgos.some((r) => r.includes('Puntuación técnica baja'))) {
    mejoras.push('Aplicar mejoras técnicas del auditor v2: título, entidad principal y estructura');
  }
  if (riesgos.some((r) => r.includes('Riesgo técnico'))) {
    mejoras.push('Revisar estructura, entidad principal y claridad del título');
  }

  // Utilidad
  if (util?.startsWith('C')) {
    mejoras.push('Reformular el contenido para responder la pregunta central del lector desde el lead');
  }

  // Aporte propio
  if (score < 90 && calif !== 'NO_PUBLICABLE') {
    mejoras.push('Elevar el aporte propio de Nicaragua Informate con datos o contexto local');
  }

  // Calificaciones específicas
  if (calif === 'MEJORAR') {
    mejoras.push('Aplicar las mejoras técnicas y editoriales señaladas por el motor MENI');
  }

  const unicas = Array.from(new Set(mejoras));
  return unicas.slice(0, 5);
}

function valorActual(d: DiagnosticoItem): string {
  if (d.utilidad?.startsWith('A')) return 'A) Excelente';
  if (d.utilidad?.startsWith('B')) return 'B) Buena';
  return 'C) Necesita enriquecimiento';
}

function diferenciacion(d: DiagnosticoItem): string {
  if (d.originalidad === 'Alta') return 'Aporte propio claro; se diferencia de un medio genérico';
  if (d.originalidad === 'Media') return 'Información sólida pero con espacio para añadir contexto local';
  if (d.originalidad === 'Baja') return 'Parece genérica; se necesita aporte Nicaragua Informate';
  return 'Requiere reconstrucción con diferenciación clara';
}

function notasFinales(d: DiagnosticoItem): string {
  const notas: string[] = [];
  if (d.eeat === 'Medio') notas.push('EEAT: verificar autor y fuentes');
  if (d.riesgoAdSense.length > 0) notas.push(`Riesgos: ${d.riesgoAdSense.slice(0, 3).join('; ')}`);
  if (d.profundidad === 'Buena') notas.push('Profundidad aceptable; priorizar contexto local');
  if (d.profundidad === 'Alta') notas.push('Profundidad alta; consolidar ventaja editorial');
  if (notas.length === 0) return 'Sin notas críticas';
  return notas.join(' | ');
}

async function main() {
  const diagPath = join(process.cwd(), 'DIAGNOSTICO-RANKING-227.json');
  const diag = JSON.parse(await fs.readFile(diagPath, 'utf-8'));
  const items: DiagnosticoItem[] = diag.ranking || [];

  const lista2Set = new Set<string>();
  const lista1Set = new Set<string>();

  // Lista 2: top 20 adsenseListo más fuertes
  const candidatosLista2 = items
    .filter((d) => d.adsenseListo)
    .sort((a, b) => b.scoreMeni - a.scoreMeni || b.puntuacionTecnica - a.puntuacionTecnica)
    .slice(0, 20);

  for (const d of candidatosLista2) {
    lista2Set.add(d.slug);
  }

  // Lista 1: top 20 restantes con mejor retorno
  const candidatosLista1 = items
    .filter((d) => !lista2Set.has(d.slug) && d.calificacionMeni !== 'NO_PUBLICABLE')
    .map((d) => ({ ...d, _score: prioridadScore(d) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 20);

  for (const d of candidatosLista1) {
    lista1Set.add(d.slug);
  }

  const pulido: PulidoItem[] = items.map((d) => {
    let prioridad = 'Lista 3';
    if (lista2Set.has(d.slug)) prioridad = 'Lista 2';
    else if (lista1Set.has(d.slug)) prioridad = 'Lista 1';

    return {
      slug: d.slug,
      titulo: limpiarTitulo(d.titulo),
      categoria: d.categoria,
      meniActual: d.scoreMeni,
      originalidad: d.originalidad,
      eeat: d.eeat,
      prioridad,
      mejorasSugeridas: generarMejoras(d, prioridad),
      valorActual: valorActual(d),
      diferenciacion: diferenciacion(d),
      notas: notasFinales(d),
    };
  });

  // Orden: Lista 1, Lista 2, Lista 3; dentro por MENI desc
  const pesoPrioridad = (p: string) => (p === 'Lista 1' ? 3 : p === 'Lista 2' ? 2 : 1);
  pulido.sort((a, b) => {
    if (pesoPrioridad(b.prioridad) !== pesoPrioridad(a.prioridad)) {
      return pesoPrioridad(b.prioridad) - pesoPrioridad(a.prioridad);
    }
    return b.meniActual - a.meniActual;
  });

  const json: PulidoJson = {
    total: pulido.length,
    lista1: pulido.filter((p) => p.prioridad === 'Lista 1').length,
    lista2: pulido.filter((p) => p.prioridad === 'Lista 2').length,
    lista3: pulido.filter((p) => p.prioridad === 'Lista 3').length,
    items: pulido,
  };

  await fs.writeFile(join(process.cwd(), 'PULIDO-EDITORIAL-227.json'), JSON.stringify(json, null, 2), 'utf-8');

  const lista1 = pulido.filter((p) => p.prioridad === 'Lista 1');
  const lista2 = pulido.filter((p) => p.prioridad === 'Lista 2');

  const md: string[] = [];

  md.push('# INFORME DE PULIDO EDITORIAL ADSENSE / EEAT / DISCOVER');
  md.push('');
  md.push('## Estado actual');
  md.push('');
  md.push(`- Total noticias: **${pulido.length}**`);
  md.push(`- Promedio MENI: **${diag.porcentajeAdSense ? (diag.porcentajeAdSense).toFixed(2) : 'N/A'}%**`);
  md.push(`- Listas para AdSense identificadas: **${diag.listasParaAdSense || 0}**`);
  md.push(`- Lista 1 (actualizar primero): **${json.lista1}** noticias`);
  md.push(`- Lista 2 (ya fuertes): **${json.lista2}** noticias`);
  md.push(`- Lista 3 (mejora no prioritaria): **${json.lista3}** noticias`);
  md.push('');

  md.push('## Oportunidades detectadas');
  md.push('');
  md.push('1. **Originalidad:** la mayoría de notas son sólidas, pero las de originalidad Media/Baja tienen la oportunidad más grande de añadir contexto nicaragüense.');
  md.push('2. **Contexto:** sucesos, internacionales y nacionales ganan más con antecedentes, actuación de autoridades e impacto ciudadano.');
  md.push('3. **EEAT:** 20 noticias tienen EEAT Medio; el principal paso es verificar el autor y las fuentes.');
  md.push('4. **Riesgo AdSense:** los casos con lenguaje emocional y conectores IA son los de corrección más rápida.');
  md.push('5. **Calidad general:** el problema no es falta de calidad sino aprovechar el aporte propio del medio.');
  md.push('');

  md.push('## FASE 1 — Selección de noticias');
  md.push('');
  md.push('Grupos priorizados:');
  md.push(`- Grupo A: ${diag.listasParaAdSense || 0} noticias listas para AdSense (de ellas las 20 más fuertes van a Lista 2).`);
  md.push(`- Grupo B: 52 publicables AdSense (según diagnóstico).`);
  md.push(`- Las 20 de Lista 1 son las de mayor retorno: originalidad Media/Baja, MENI alto y temas de interés nacional.`);
  md.push('');

  md.push('## FASE 2 — Auditoría individual');
  md.push('');
  md.push('Criterios usados:');
  md.push('- Valor actual (A/B/C).');
  md.push('- Diferenciación editorial propia.');
  md.push('- EEAT: autor, fuentes, instituciones.');
  md.push('- Riesgos AdSense sin reglas mecánicas.');
  md.push('');

  md.push('## FASE 3 — Propuesta de mejora');
  md.push('');
  md.push('Cada noticia recibe hasta 5 mejoras específicas. No se inventan datos. Las sugerencias apuntan a contexto, antecedentes, marco legal, impacto ciudadano y datos verificables.');
  md.push('');

  md.push('## FASE 4 — Priorización');
  md.push('');
  md.push('### Lista 1: 20 noticias a actualizar primero');
  md.push('');
  md.push('| # | slug | MENI | Categoría | Valor | Originalidad | EEAT | Mejoras |');
  md.push('| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |');
  for (let i = 0; i < lista1.length; i++) {
    const p = lista1[i];
    md.push(`| ${i + 1} | ${p.slug} | ${p.meniActual} | ${p.categoria} | ${p.valorActual} | ${p.originalidad} | ${p.eeat} | ${p.mejorasSugeridas.slice(0, 3).join('; ')} |`);
  }
  md.push('');

  md.push('### Lista 2: 20 noticias ya fuertes');
  md.push('');
  md.push('| # | slug | MENI | Categoría | Valor | Originalidad | EEAT | Notas |');
  md.push('| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |');
  for (let i = 0; i < lista2.length; i++) {
    const p = lista2[i];
    md.push(`| ${i + 1} | ${p.slug} | ${p.meniActual} | ${p.categoria} | ${p.valorActual} | ${p.originalidad} | ${p.eeat} | ${p.notas} |`);
  }
  md.push('');

  md.push('### Lista 3: noticias donde la mejora no es prioritaria');
  md.push('');
  md.push(`Total: **${json.lista3}** noticias. No requieren acción inmediata. Ver PULIDO-EDITORIAL-227.json para el detalle.`);
  md.push('');

  md.push('## FASE 5 — Calendario editorial');
  md.push('');
  md.push('| Semana | Meta | Slugs a revisar |');
  md.push('| ---- | ---- | ---- |');
  md.push(`| Semana 1 | Primeras 10 mejoras de Lista 1 | ${lista1.slice(0, 10).map((p) => p.slug).join(', ')} |`);
  md.push(`| Semana 2 | Siguientes 10 mejoras de Lista 1 | ${lista1.slice(10, 20).map((p) => p.slug).join(', ')} |`);
  md.push(`| Semana 3 | Optimización de Lista 1 restante y revisión de Lista 2 | ${lista2.slice(0, 10).map((p) => p.slug).join(', ')}... |`);
  md.push('');

  md.push('## FASE 6 — Criterio final');
  md.push('');
  md.push('Antes de editar una noticia, se aplica la pregunta: “¿Esta modificación aumenta el valor para una persona real?” Si la respuesta es no, no se modifica.');
  md.push('');

  md.push('## Entregables');
  md.push('');
  md.push('- **INFORME-PULIDO-EDITORIAL-ADSENSE.md** — este documento.');
  md.push('- **PULIDO-EDITORIAL-227.json** — datos completos por noticia.');
  md.push('');

  md.push('## Recomendaciones');
  md.push('');
  md.push('1. Empezar por las 20 de Lista 1; son las que más pueden convertirse de 🟡 a 🟢.');
  md.push('2. Revisar las 20 de Lista 2 como muestra de referencia para el redactorio.');
  md.push('3. No expandir palabras artificialmente; cada cambio debe responder una pregunta del lector.');
  md.push('4. Usar el JSON para asignar tareas a editores por categoría.');
  md.push('5. Después de pulir, volver a auditar con MENI y comparar scores.');
  md.push('');

  await fs.writeFile(join(process.cwd(), 'INFORME-PULIDO-EDITORIAL-ADSENSE.md'), md.join('\n'), 'utf-8');

  console.log(`Pulido generado: ${json.lista1} Lista 1, ${json.lista2} Lista 2, ${json.lista3} Lista 3`);
  console.log('Archivos: INFORME-PULIDO-EDITORIAL-ADSENSE.md, PULIDO-EDITORIAL-227.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
