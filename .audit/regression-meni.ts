/**
 * Regresión MENI: corre runMeni sobre todos los artículos del snapshot y
 * vuelca score/calificación/aprobado/acciones/preguntas/dimensiones.
 * Usage: npx tsx .audit/regression-meni.ts BEFORE|AFTER
 */
import { runMeni } from '@/lib/meni/core';
import type { NoticiaInput } from '@/lib/meni/types';
import * as fs from 'fs';

const tag = process.argv[2] || 'BEFORE';
const j = JSON.parse(fs.readFileSync('CLOSURE_SNAPSHOT.json', 'utf8'));

const out: Record<string, unknown>[] = [];
const errors: { i: number; titulo: string; error: string }[] = [];

for (let i = 0; i < j.articles.length; i++) {
  const a = j.articles[i];
  const input: NoticiaInput = {
    titulo: a.titulo,
    resumen: a.resumen || '',
    contenido: a.contenido || '',
    categoria: a.categoria || 'Nacionales',
    autor: a.autor || 'Redacción',
    fecha: a.fecha || '2026-08-01',
    slug: a.slug || `a-${i}`,
  };
  try {
    const r = runMeni(input);
    const d = r.editorialDecision as any;
    out.push({
      i,
      slug: input.slug,
      titulo: input.titulo,
      categoria: input.categoria,
      score: r.scoreFinal,
      calificacion: r.calificacion,
      aprobado: r.aprobado,
      estadoFinal: r.estadoFinal,
      recomendacion: r.recomendacionEditorial,
      versionMeni: (r as any).version || (r as any).versionMeni || null,
      acciones: (d?.acciones || []).filter((x: string) => x !== 'Lista para publicar'),
      preguntasObligatorias: d?.readerQuestions?.preguntasObligatorias || [],
      preguntasNoAplicables: d?.readerQuestions?.preguntasNoAplicables || [],
      clasificacionDeporte: d?.readerQuestions?.clasificacionDeporte || null,
      selloNI: d?.editorialDna?.selloNI
        ? {
            explica: d.editorialDna.selloNI.explica,
            contextualiza: d.editorialDna.selloNI.contextualiza,
            utilidad: d.editorialDna.selloNI.utilidad,
            valor: d.editorialDna.selloNI.valor,
          }
        : null,
      adnNI: d?.editorialDna?.adnNI ?? null,
    });
  } catch (e: any) {
    errors.push({ i, titulo: a.titulo, error: String(e.message || e).slice(0, 300) });
  }
}

const file = `.audit/meni-regression-${tag}.json`;
fs.writeFileSync(file, JSON.stringify({ count: out.length, errors, articles: out }, null, 2));
console.log(`wrote ${file}: ${out.length} articles, ${errors.length} errors`);
