const fs = require('fs');
const file = 'app/panel/nios/performance/page.tsx';
let t = fs.readFileSync(file, 'utf8');
const rep = (o, n, label) => {
  const oc = o.replace(/\n/g, '\r\n'), nc = n.replace(/\n/g, '\r\n');
  if (t.includes(o)) t = t.replace(o, n);
  else if (t.includes(oc)) t = t.replace(oc, nc);
  else { console.log('MISS: ' + label); process.exit(1); }
  console.log(label + ' OK');
};

// Panel admin: render dinámico (lee telemetría viva; no prerender en build)
rep(`export const metadata: Metadata = {
  title: { absolute: 'NIOS | Performance' },
};`,
`export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'NIOS | Performance' },
};`,
'force-dynamic');

// Acceso defensivo: el doc de telemetría puede no tener firestore/health/módulos
rep("{data.firestore.reads + data.firestore.writes}",
"{(data.firestore?.reads ?? 0) + (data.firestore?.writes ?? 0)}",
'firestore sum');
rep("{data.firestore.reads} lecturas · {data.firestore.writes} escrituras",
"{data.firestore?.reads ?? 0} lecturas · {data.firestore?.writes ?? 0} escrituras",
'firestore detail');
rep("${levelColor(data.health.level)}", "${levelColor(data.health?.level ?? '')}", 'health level color');
rep("{data.health.score}", "{data.health?.score ?? '—'}", 'health score');
rep("{data.health.level}", "{data.health?.level ?? 'SIN DATOS'}", 'health level');
rep("{data.slowestModules.map(", "{(data.slowestModules ?? []).map(", 'slowestModules');
rep("{data.failedModules.length > 0 && (", "{(data.failedModules?.length ?? 0) > 0 && (", 'failedModules cond');
rep("{data.failedModules.map(", "{(data.failedModules ?? []).map(", 'failedModules map');
rep("{data.health.warnings.length > 0 && (", "{(data.health?.warnings?.length ?? 0) > 0 && (", 'warnings cond');
rep("{data.health.warnings.map(", "{(data.health?.warnings ?? []).map(", 'warnings map');
rep("{(data.totalDuration / 1000).toFixed(1)}s", "{((data.totalDuration ?? 0) / 1000).toFixed(1)}s", 'totalDuration s');
rep("{data.totalDuration} ms", "{data.totalDuration ?? 0} ms", 'totalDuration ms');

fs.writeFileSync(file, t);
console.log('done');
