/**
 * Repro MENI: preguntas de fútbol en nota de automovilismo/motocross.
 * Usage: npx tsx .audit/repro-meni-deportes.ts [idx]
 */
import { runMeni } from '@/lib/meni/core';
import type { NoticiaInput } from '@/lib/meni/types';
import * as fs from 'fs';

function loadSnapshot(idx: number): NoticiaInput {
  const j = JSON.parse(fs.readFileSync('CLOSURE_SNAPSHOT.json', 'utf8'));
  const a = j.articles[idx];
  return {
    titulo: a.titulo,
    resumen: a.resumen || '',
    contenido: a.contenido || '',
    categoria: a.categoria || 'Deportes',
    autor: a.autor || 'Redacción',
    fecha: a.fecha || '2026-08-01',
    slug: a.slug || 'test',
  };
}

// Nota de motocross realista (estilo NI): previa de fecha de campeonato
const motocrossPrevia: NoticiaInput = {
  titulo: 'Campeonato Nacional de Motocross disputará su séptima fecha en Managua',
  resumen:
    'La séptima fecha del Campeonato Nacional de Motocross se realizará este domingo en la pista del Parque Nacional de Ferias, en Managua, con la participación de pilotos de varias categorías.',
  contenido: [
    'La séptima fecha del Campeonato Nacional de Motocross se realizará este domingo en la pista del Parque Nacional de Ferias, en Managua.',
    'Según la organización, competirán pilotos de las categorías 50cc, 65cc, 85cc y MX1, con participación de departamentos como Managua, León y Granada.',
    'El campeonato contempla varias fechas durante el año y reúne a pilotos nicaragüenses de diferentes edades.',
    'La entrada será gratuita para el público.',
  ].join('\n\n'),
  categoria: 'Deportes',
  autor: 'Redacción',
  fecha: '2026-08-01',
  slug: 'motocross-septima-fecha',
};

const idx = Number(process.argv[2]);
const cases: { name: string; input: NoticiaInput }[] = [
  ...(Number.isFinite(idx) ? [{ name: `snapshot-${idx}`, input: loadSnapshot(idx) }] : []),
  { name: 'motocross-previa', input: motocrossPrevia },
];

for (const c of cases) {
  const r = runMeni(c.input);
  const d = r.editorialDecision as any;
  console.log(`\n=== ${c.name} ===`);
  console.log('perfil:', (r as any).perfil ?? d?.perfil, '| score:', r.scoreFinal, '| estado:', r.estadoFinal, '| aprobado:', r.aprobado);
  console.log('--- preguntasObligatorias ---');
  (d?.readerQuestions?.preguntasObligatorias || []).forEach((p: string) => console.log('  ?', p));
  console.log('--- respuestasFaltantes ---');
  (d?.storyCompleteness?.respuestasFaltantes || []).forEach((p: string) => console.log('  !', p));
  console.log('--- queLeFaltaParaReferencia ---');
  (d?.diagnostico?.queLeFaltaParaReferencia || []).forEach((p: string) => console.log('  -', p));
  console.log('--- acciones ---');
  (d?.acciones || []).forEach((p: string) => console.log('  >', p));
  console.log('--- recomendaciones (MeniResult) ---');
  (r.recomendaciones || []).slice(0, 12).forEach((p: any) => console.log('  *', typeof p === 'string' ? p : `${p.area}: ${p.mensaje}`));
}
