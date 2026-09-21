const fs = require('fs');
const before = JSON.parse(fs.readFileSync('.audit/meni-regression-BEFORE.json', 'utf8'));
const after = JSON.parse(fs.readFileSync('.audit/meni-regression-AFTER.json', 'utf8'));

const mapB = new Map(before.articles.map(a => [a.i, a]));
const mapA = new Map(after.articles.map(a => [a.i, a]));

const FUTBOL_RE = /jugaron|tabla|pr[oó]ximo partido|figuras destacadas/i;
const isDep = a => /deporte/i.test(a.categoria || '');

let changed = [];
let stats = {
  total: after.articles.length,
  sports: 0,
  scoreUp: 0, scoreDown: 0, scoreSame: 0,
  aprobChanged: 0, estadoChanged: 0,
  futbolBefore: 0, futbolAfter: 0,
};

for (const a of after.articles) {
  const b = mapB.get(a.i);
  if (!b) continue;
  const dep = isDep(a);
  if (dep) stats.sports++;
  const fb = (b.acciones || []).filter(x => FUTBOL_RE.test(x)).length;
  const fa = (a.acciones || []).filter(x => FUTBOL_RE.test(x)).length;
  if (dep) { stats.futbolBefore += fb > 0 ? 1 : 0; stats.futbolAfter += fa > 0 ? 1 : 0; }
  if (a.score !== b.score) { if (a.score > b.score) stats.scoreUp++; else stats.scoreDown++; }
  else stats.scoreSame++;
  if (a.aprobado !== b.aprobado) stats.aprobChanged++;
  if (a.estadoFinal !== b.estadoFinal) stats.estadoChanged++;
  if (a.score !== b.score || a.aprobado !== b.aprobado || JSON.stringify(a.acciones) !== JSON.stringify(b.acciones)) {
    changed.push({
      i: a.i, cat: a.categoria, titulo: (a.titulo || '').slice(0, 80),
      score: `${b.score}→${a.score}`, estado: `${b.estadoFinal}→${a.estadoFinal}`,
      aprob: `${b.aprobado}→${a.aprobado}`,
      disc: a.clasificacionDeporte ? `${a.clasificacionDeporte.disciplina}/${a.clasificacionDeporte.etapa}` : null,
      accB: b.acciones, accA: a.acciones,
    });
  }
}

console.log(JSON.stringify(stats, null, 1));
console.log('--- CAMBIOS (' + changed.length + ') ---');
for (const c of changed) {
  console.log(`#${c.i} [${c.cat}] ${c.titulo}`);
  console.log(`   score ${c.score} | estado ${c.estado} | aprob ${c.aprob} | disc ${c.disc}`);
  if (JSON.stringify(c.accB) !== JSON.stringify(c.accA)) {
    console.log('   ANTES : ' + JSON.stringify(c.accB).slice(0, 300));
    console.log('   DESPUÉS: ' + JSON.stringify(c.accA).slice(0, 300));
  }
}
