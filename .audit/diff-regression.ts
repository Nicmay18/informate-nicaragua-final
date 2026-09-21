/**
 * Diff MENI BEFORE/AFTER con clasificación de disciplina real.
 * Mide: score, aprobación, cambios en acciones, y preguntas de fútbol
 * aplicadas a artículos cuya disciplina NO es fútbol (la métrica del bug).
 */
import { classifySports } from '@/lib/meni/sports-classifier';
import * as fs from 'fs';

const before = JSON.parse(fs.readFileSync('.audit/meni-regression-BEFORE.json', 'utf8'));
const after = JSON.parse(fs.readFileSync('.audit/meni-regression-AFTER.json', 'utf8'));
const snap = JSON.parse(fs.readFileSync('CLOSURE_SNAPSHOT.json', 'utf8'));

const FUTBOL_RE = /jugaron|tabla|pr[oó]ximo partido|figuras destacadas|enfrentan/i;
const mapB = new Map(before.articles.map((a: any) => [a.i, a]));

const stats = {
  total: after.articles.length,
  sports: 0,
  scoreUp: 0, scoreDown: 0, scoreSame: 0,
  aprobChanged: 0,
  estadoChanged: 0,
  futbolEnNoFutbolBefore: 0,
  futbolEnNoFutbolAfter: 0,
  disciplinas: {} as Record<string, number>,
};

const casos: any[] = [];

for (const a of after.articles) {
  const b: any = mapB.get(a.i);
  if (!b) continue;
  const snapArt = snap.articles[a.i];
  const dep = /deporte/i.test(a.categoria || '');
  if (!dep) continue;
  stats.sports++;

  const clas = classifySports(snapArt.titulo || '', (snapArt.contenido || '').slice(0, 4000), snapArt.resumen || '');
  stats.disciplinas[clas.disciplina] = (stats.disciplinas[clas.disciplina] || 0) + 1;

  const esFutbol = clas.disciplina === 'futbol';
  const fb = (b.acciones || []).filter((x: string) => FUTBOL_RE.test(x)).length;
  const fa = (a.acciones || []).filter((x: string) => FUTBOL_RE.test(x)).length;
  if (!esFutbol && fb > 0) stats.futbolEnNoFutbolBefore++;
  if (!esFutbol && fa > 0) stats.futbolEnNoFutbolAfter++;

  if (a.score > b.score) stats.scoreUp++; else if (a.score < b.score) stats.scoreDown++; else stats.scoreSame++;
  if (a.aprobado !== b.aprobado) stats.aprobChanged++;
  if (a.estadoFinal !== b.estadoFinal) stats.estadoChanged++;

  casos.push({
    i: a.i, titulo: (a.titulo || '').slice(0, 70),
    disc: clas.disciplina, etapa: clas.etapa,
    score: `${b.score}→${a.score}`,
    futbolB: fb, futbolA: fa,
    estado: `${b.estadoFinal}→${a.estadoFinal}`,
  });
}

console.log(JSON.stringify(stats, null, 1));
console.log('--- DEPORTES: clasificación + fútbol-en-no-fútbol ---');
for (const c of casos) {
  const flag = c.disc !== 'futbol' && c.futbolA > 0 ? '  ⚠ FUTBOL' : '';
  console.log(`#${c.i} ${c.disc}/${c.etapa} | score ${c.score} | fútbolB:${c.futbolB}→fútbolA:${c.futbolA} | ${c.titulo}${flag}`);
}
