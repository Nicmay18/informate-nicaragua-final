import { promises as fs } from 'fs';
import { join } from 'path';

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

interface PlanItem {
  slug: string;
  categoria: string;
  score_meni_actual: number;
  valor_usuario_actual: string;
  originalidad_real: string;
  problema_principal: string;
  tipo_de_mejora: string;
  informacion_que_falta: string[];
  pregunta_que_debe_responder: string;
  nivel_prioridad: string;
  accion_recomendada: string;
  grupo: string;
}

interface DiagItem {
  slug: string;
  titulo: string;
  categoria: string;
  scoreMeni: number;
  utilidad: string;
  profundidad: string;
  originalidad: string;
  eeat: string;
}

interface RetornoItem {
  rank: number;
  slug: string;
  titulo: string;
  categoria: string;
  scoreMeni: number;
  retornoEditorial: number;
  valorLector: number;
  potencialGoogle: number;
  aporteNIN: number;
  facilidadMejora: number;
  actualidadInteres: number;
  grupoRetorno: string;
  justificacion: string;
}

function normalizar(t: string): string {
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function valorPulido(s: string): number {
  const t = normalizar(s);
  if (t.includes('excelente') || t.includes('a)')) return 95;
  if (t.includes('bueno') || t.includes('b)')) return 75;
  if (t.includes('regular') || t.includes('c)')) return 50;
  if (t.includes('poco') || t.includes('d)')) return 30;
  return 50;
}

function originalidadValor(s: string): number {
  const t = normalizar(s);
  if (t.includes('alta')) return 95;
  if (t.includes('media')) return 70;
  if (t.includes('baja')) return 40;
  if (t.includes('muy baja')) return 20;
  return 50;
}

function eeatValor(s: string): number {
  const t = normalizar(s);
  if (t.includes('alto')) return 95;
  if (t.includes('medio')) return 60;
  if (t.includes('bajo')) return 30;
  return 50;
}

function prioridadValor(s: string): number {
  const t = normalizar(s);
  if (t.includes('lista 1')) return 100;
  if (t.includes('lista 2')) return 70;
  if (t.includes('lista 3')) return 40;
  if (t.includes('alta')) return 100;
  if (t.includes('media')) return 60;
  if (t.includes('baja')) return 30;
  return 50;
}

function facilidadPorGrupo(grupo: string, faltantes: number): number {
  const t = normalizar(grupo);
  let base = 50;
  if (t.includes('a')) base = 70; // ya es buena, poco esfuerzo
  if (t.includes('b')) base = 100; // mejora ligera, mejor retorno por esfuerzo
  if (t.includes('c')) base = 50; // cirugía profunda
  if (t.includes('d')) base = 0; // deprecar
  const penal = Math.min(40, faltantes * 8);
  return Math.max(0, base - penal);
}

function calcularAporteNIN(p: PulidoItem): number {
  const orig = originalidadValor(p.originalidad);
  const eeat = eeatValor(p.eeat);
  let dif = 0;
  const d = normalizar(p.diferenciacion);
  if (d.includes('ventaja editorial') || d.includes('contexto local') || d.includes('información sólida') || d.includes('sólida')) dif += 10;
  if (d.includes('sin ventaja') || d.includes('podria estar') || d.includes('genérica')) dif -= 15;
  return Math.min(100, Math.max(0, (orig + eeat) / 2 + dif));
}

function calcularPotencialGoogle(p: PulidoItem): number {
  let catFactor = 1.0;
  const c = normalizar(p.categoria);
  if (c.includes('tecnolog')) catFactor = 1.05;
  if (c.includes('deporte')) catFactor = 1.0;
  if (c.includes('nacional')) catFactor = 1.0;
  if (c.includes('internacional')) catFactor = 0.95;
  if (c.includes('cultura')) catFactor = 0.95;
  if (c.includes('suceso')) catFactor = 0.9;
  const google = Math.min(100, p.meniActual * catFactor);
  const prio = prioridadValor(p.prioridad);
  return Math.min(100, google * 0.85 + prio * 0.15);
}

function calcularValorLector(p: PulidoItem, d: DiagItem): number {
  const val = valorPulido(p.valorActual);
  const util = eeatValor(d.utilidad);
  const prof = originalidadValor(d.profundidad);
  return Math.min(100, (p.meniActual * 0.5) + (val * 0.25) + (util * 0.15) + (prof * 0.1));
}

async function main() {
  const pulido = JSON.parse(await fs.readFile(join(process.cwd(), 'PULIDO-EDITORIAL-227.json'), 'utf-8'));
  const plan = JSON.parse(await fs.readFile(join(process.cwd(), 'PLAN-CIRUGIA-EDITORIAL-227.json'), 'utf-8'));
  const diag = JSON.parse(await fs.readFile(join(process.cwd(), 'DIAGNOSTICO-RANKING-227.json'), 'utf-8'));

  const pulidoBySlug = new Map<string, PulidoItem>();
  for (const p of pulido.items || []) pulidoBySlug.set(p.slug, p);

  const planBySlug = new Map<string, PlanItem>();
  for (const p of plan) planBySlug.set(p.slug, p);

  const diagBySlug = new Map<string, DiagItem>();
  for (const d of diag.ranking || []) diagBySlug.set(d.slug, d);

  const retornos: RetornoItem[] = [];

  for (const d of diag.ranking) {
    const p = pulidoBySlug.get(d.slug);
    const pl = planBySlug.get(d.slug);

    if (!p || !pl) continue;

    const faltantes = pl.informacion_que_falta?.length || 0;
    const facilidad = facilidadPorGrupo(pl.grupo, faltantes);
    const aporte = calcularAporteNIN(p);
    const google = calcularPotencialGoogle(p);
    const valor = calcularValorLector(p, d);
    const actualidad = prioridadValor(pl.nivel_prioridad);

    const retorno =
      valor * 0.30 +
      google * 0.20 +
      aporte * 0.20 +
      facilidad * 0.15 +
      actualidad * 0.15;

    retornos.push({
      rank: 0,
      slug: d.slug,
      titulo: d.titulo,
      categoria: d.categoria,
      scoreMeni: d.scoreMeni,
      retornoEditorial: Math.round(retorno * 100) / 100,
      valorLector: Math.round(valor * 100) / 100,
      potencialGoogle: Math.round(google * 100) / 100,
      aporteNIN: Math.round(aporte * 100) / 100,
      facilidadMejora: facilidad,
      actualidadInteres: actualidad,
      grupoRetorno: '',
      justificacion: `Valor lector ${Math.round(valor)} / Google ${Math.round(google)} / Aporte NIN ${Math.round(aporte)} / Facilidad ${facilidad} / Actualidad ${actualidad}. Tipo mejora: ${pl.tipo_de_mejora}.`,
    });
  }

  retornos.sort((a, b) => b.retornoEditorial - a.retornoEditorial);

  for (let i = 0; i < retornos.length; i++) {
    retornos[i].rank = i + 1;
    if (i < 20) retornos[i].grupoRetorno = 'ORO';
    else if (i < 70) retornos[i].grupoRetorno = 'PLATA';
    else if (i < 170) retornos[i].grupoRetorno = 'BRONCE';
    else retornos[i].grupoRetorno = 'NO INVERTIR';
  }

  const json = {
    total: retornos.length,
    oro: retornos.filter((r) => r.grupoRetorno === 'ORO').length,
    plata: retornos.filter((r) => r.grupoRetorno === 'PLATA').length,
    bronce: retornos.filter((r) => r.grupoRetorno === 'BRONCE').length,
    noInvertir: retornos.filter((r) => r.grupoRetorno === 'NO INVERTIR').length,
    items: retornos,
  };

  await fs.writeFile(join(process.cwd(), 'RANKING-RETORNO-EDITORIAL-227.json'), JSON.stringify(json, null, 2), 'utf-8');

  const porCategoria: Record<string, { oro: number; plata: number; total: number; suma: number }> = {};
  for (const r of retornos) {
    if (!porCategoria[r.categoria]) porCategoria[r.categoria] = { oro: 0, plata: 0, total: 0, suma: 0 };
    porCategoria[r.categoria].total++;
    porCategoria[r.categoria].suma += r.retornoEditorial;
    if (r.grupoRetorno === 'ORO') porCategoria[r.categoria].oro++;
    if (r.grupoRetorno === 'PLATA') porCategoria[r.categoria].plata++;
  }

  const categoriasTop = Object.entries(porCategoria)
    .map(([cat, v]) => ({ cat, ...v, promedio: v.total ? v.suma / v.total : 0 }))
    .sort((a, b) => b.promedio - a.promedio);

  const estrellaSlugs = retornos.slice(0, 20).map((r) => r.slug);
  const noInvertirSlugs = retornos.filter((r) => r.grupoRetorno === 'NO INVERTIR').slice(0, 10).map((r) => r.slug);

  const md: string[] = [];
  md.push('# RANKING DE RETORNO EDITORIAL — 227 NOTICIAS');
  md.push('');
  md.push('## Fórmula');
  md.push('');
  md.push('`RETORNO_EDITORIAL = 30% Valor lector + 20% Potencial Google + 20% Aporte Nicaragua Informate + 15% Facilidad de mejora + 15% Actualidad/Interés`');
  md.push('');
  md.push('## Distribución por grupo');
  md.push('');
  md.push(`- ORO: ${json.oro}`);
  md.push(`- PLATA: ${json.plata}`);
  md.push(`- BRONCE: ${json.bronce}`);
  md.push(`- NO INVERTIR: ${json.noInvertir}`);
  md.push('');

  md.push('## Top 20 ORO');
  md.push('');
  md.push('| Rank | Noticia | Categoría | Retorno | Score MENI |');
  md.push('| ---- | ---- | ---- | ---- | ---- |');
  for (const r of retornos.slice(0, 20)) {
    md.push(`| ${r.rank} | ${r.slug} | ${r.categoria} | ${r.retornoEditorial.toFixed(2)} | ${r.scoreMeni} |`);
  }
  md.push('');

  md.push('## Oportunidad por categoría');
  md.push('');
  md.push('| Categoría | Promedio retorno | ORO | PLATA | Total |');
  md.push('| ---- | ---- | ---- | ---- | ---- |');
  for (const c of categoriasTop) {
    md.push(`| ${c.cat} | ${c.promedio.toFixed(2)} | ${c.oro} | ${c.plata} | ${c.total} |`);
  }
  md.push('');

  md.push('## Respuestas a las 5 preguntas');
  md.push('');
  md.push(`1. **¿Cuáles 20 noticias pueden convertirse en contenido estrella?**`);
  md.push(`   - Ver tabla Top 20 ORO. Slugs: ${estrellaSlugs.slice(0, 5).join(', ')}...`);
  md.push('');
  md.push(`2. **¿Cuáles categorías generan más oportunidad?**`);
  for (const c of categoriasTop.slice(0, 3)) {
    md.push(`   - ${c.cat}: promedio ${c.promedio.toFixed(2)}, ${c.oro} en ORO, ${c.plata} en PLATA.`);
  }
  md.push('');
  md.push(`3. **¿Qué tipo de noticia atrae más valor para Google?**`);
  md.push(`   - Tecnología y Deportes tienen potencial de búsqueda sostenida.`);
  md.push(`   - Nacionales e Internacionales dependen más de la actualidad.`);
  md.push(`   - Sucesos tienen vida corta; solo los con contexto institucional valen la inversión.`);
  md.push('');
  md.push(`4. **¿Cuáles noticias no deberían recibir tiempo editorial?**`);
  md.push(`   - ${json.noInvertir} noticias en NO INVERTIR.`);
  md.push(`   - Ejemplos: ${noInvertirSlugs.slice(0, 5).join(', ')}...`);
  md.push('');
  md.push(`5. **¿Dónde debe invertir primero Nicaragua Informate durante 90 días?**`);
  md.push(`   - Semanas 1-4: ORO (top 20). Son el mejor retorno inmediato.`);
  md.push(`   - Mes 2: PLATA (21-70). Consolidar noticias con potencial.`);
  md.push(`   - Mes 3: optimización técnica y actualización del bronce.`);
  md.push('');

  md.push('## Criterio final');
  md.push('');
  md.push('No buscar llenar el sitio. Buscar construir una biblioteca de noticias útiles que Google y los lectores prefieran.');
  md.push('');

  await fs.writeFile(join(process.cwd(), 'RANKING-RETORNO-EDITORIAL-227.md'), md.join('\n'), 'utf-8');
  console.log('Ranking guardado: RANKING-RETORNO-EDITORIAL-227.md y .json');

  const plan90: string[] = [];
  plan90.push('# PLAN 90 DÍAS EDITORIAL — NICARAGUA INFORMATE');
  plan90.push('');
  plan90.push('## Semanas 1-4: Noticias ORO');
  plan90.push('');
  plan90.push('Objetivo: convertir las 20 noticias con mayor retorno editorial en contenido estrella.');
  plan90.push('');
  plan90.push('Acciones:');
  plan90.push('- Aplicar `editorialEnhancerAction` a cada una.');
  plan90.push('- Resolver preguntas sin responder.');
  plan90.push('- Conseguir datos faltantes.');
  plan90.push('- Mejorar lead y estructura con H2.');
  plan90.push('- Volver a medir con MENI.');
  plan90.push('');
  plan90.push('## Mes 2: Noticias PLATA');
  plan90.push('');
  plan90.push('Objetivo: elevar 50 noticias de potencial a alto valor.');
  plan90.push('');
  plan90.push('Acciones:');
  plan90.push('- Mejora estructural con datos existentes.');
  plan90.push('- Actualizar contexto y antecedentes.');
  plan90.push('- Añadir cifras, instituciones o declaraciones oficiales.');
  plan90.push('');
  plan90.push('## Mes 3: Optimización técnica y actualización');
  plan90.push('');
  plan90.push('Objetivo: mantener y actualizar contenido existente.');
  plan90.push('');
  plan90.push('Acciones:');
  plan90.push('- `autoCorrectNoticia` para SEO técnico en BRONCE.');
  plan90.push('- Revisar noticias con datos perecederos.');
  plan90.push('- Descartar o refundar noticias en NO INVERTIR.');
  plan90.push('');
  plan90.push('## Regla final');
  plan90.push('');
  plan90.push('No llenar el sitio. Construir una biblioteca de noticias útiles que Google y los lectores prefieran.');
  plan90.push('');

  await fs.writeFile(join(process.cwd(), 'PLAN-90-DIAS-EDITORIAL.md'), plan90.join('\n'), 'utf-8');
  console.log('Plan 90 días guardado: PLAN-90-DIAS-EDITORIAL.md');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
