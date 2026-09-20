/**
 * Baseline harness: runs runMeni on test articles and dumps decision fields.
 * Usage: npx tsx .audit/baseline-meni.ts [tag]
 */
import { runMeni } from '@/lib/meni/core';
import type { NoticiaInput } from '@/lib/meni/types';
import * as fs from 'fs';

function loadMarsella(): NoticiaInput {
  // Stored contenido uses blank-line separators between blocks (verified vs snapshot).
  // The rendered body starts with <h2> (no lead <p>) — the "está ubicada" lead is `resumen`.
  const blocks = fs.readFileSync('.audit/marsella-contenido.html', 'utf8').split(/\n/).filter(Boolean);
  const contenido = blocks.join('\n\n');
  return {
    titulo: 'Playa Marsella: qué hacer, cómo llegar y cuánto cuesta',
    resumen:
      'Playa Marsella está ubicada en el municipio de San Juan del Sur, departamento de Rivas, en el Pacífico de Nicaragua, y en septiembre de 2026 es uno de los destinos de playa que se pueden visitar con una nueva infraestructura vial.',
    contenido,
    categoria: 'Nacionales',
    autor: 'Maycol Josué Nicaragua Rivas',
    fecha: '2026-09-20',
    slug: 'playa-marsella-que-hacer-como-llegar-y-cuanto-cuesta',
  };
}

function loadSnapshot(idx: number): NoticiaInput {
  const j = JSON.parse(fs.readFileSync('CLOSURE_SNAPSHOT.json', 'utf8'));
  const a = j.articles[idx];
  return {
    titulo: a.titulo,
    resumen: a.resumen || '',
    contenido: a.contenido || '',
    categoria: a.categoria || 'Nacionales',
    autor: a.autor || 'Redacción',
    fecha: a.fecha || '2026-08-01',
    slug: a.slug || 'test',
  };
}

const cases: { name: string; input: NoticiaInput }[] = [
  { name: 'marsella', input: loadMarsella() },
  { name: 'accidentes-varios', input: loadSnapshot(2) },
  { name: 'cuatro-obreros', input: loadSnapshot(54) },
  { name: 'seis-accidentes', input: loadSnapshot(70) },
];

const out: Record<string, unknown> = {};
for (const c of cases) {
  try {
    const r = runMeni(c.input);
    out[c.name] = {
      titulo: c.input.titulo,
      scoreFinal: r.scoreFinal,
      estadoFinal: r.estadoFinal,
      aprobado: r.aprobado,
      calificacion: r.calificacion,
      score_status: r.score_status,
      riesgoEditorial: r.editorialDecision?.riesgoEditorial,
      confianza: r.editorialDecision?.veredictoEjecutivo?.confianza,
      publicar: r.editorialDecision?.veredictoEjecutivo?.publicar,
      motivoPrincipal: r.editorialDecision?.motivoPrincipal,
      recomendacionEditorial: r.recomendacionEditorial,
      qualityGateIssues: (r.qualityGate?.issues || []).map((i: any) => ({
        categoria: i.categoria, severidad: i.severidad, mensaje: i.mensaje,
      })),
      recomendaciones: (r.recomendaciones || []).slice(0, 10),
      diagnostico: r.diagnostico,
      forenseScore: (r.forense as any)?.score,
      valorEditorial: (r.valorEditorial as any)?.score,
      contextScore: r.contextScore,
      autoCorrected: r.autoCorrected,
    };
  } catch (e: any) {
    out[c.name] = { titulo: c.input.titulo, ERROR: e.message, stack: String(e.stack).slice(0, 500) };
  }
}

const tag = process.argv[2] || 'baseline';
fs.writeFileSync(`.audit/meni-${tag}.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2).slice(0, 6000));
