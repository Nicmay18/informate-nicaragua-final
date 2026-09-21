/**
 * Verificación MENI en producción: POST /api/admin/meni/evaluar con casos
 * deportivos y comprobación de que NO aparecen preguntas de fútbol en
 * disciplinas no-fútbol.
 */
const fs = require('fs');
const path = require('path');

const BASE = 'https://nicaraguainformate.com';
const envText = fs.readFileSync(path.resolve('.env.local'), 'utf8');
const token = (envText.match(/^ADMIN_API_KEY=(.+)$/m) || [])[1]?.trim().replace(/\r$/, '').replace(/^["']|["']$/g, '');
if (!token) { console.error('sin ADMIN_API_KEY'); process.exit(1); }

const snap = JSON.parse(fs.readFileSync('CLOSURE_SNAPSHOT.json', 'utf8'));
const automovilismo = snap.articles[89];

const CASOS = [
  {
    nombre: 'motocross-previa (sintético)',
    body: {
      titulo: 'Campeonato Nacional de Motocross disputará su séptima fecha en Managua',
      resumen: 'La séptima fecha del Campeonato Nacional de Motocross se realizará este domingo en la pista del Parque Nacional de Ferias.',
      contenido:
        'La séptima fecha del Campeonato Nacional de Motocross se realizará este domingo en la pista del Parque Nacional de Ferias, en Managua. ' +
        'Según la organización, competirán pilotos de las categorías 50cc, 65cc, 85cc y MX1. ' +
        'El campeonato contempla varias fechas durante el año. La entrada será gratuita.',
      categoria: 'Deportes',
      autor: 'Redacción',
      slug: 'verify-motocross-previa',
      checkDuplicates: false,
    },
  },
  {
    nombre: 'automovilismo real #89 (1/4 de Milla)',
    body: {
      titulo: automovilismo.titulo,
      resumen: automovilismo.resumen || '',
      contenido: automovilismo.contenido || '',
      categoria: automovilismo.categoria || 'Deportes',
      autor: automovilismo.autor || 'Redacción',
      slug: automovilismo.slug || 'verify-14milla',
      checkDuplicates: false,
    },
  },
];

const FUTBOL_RE = /jugaron|tabla|pr[oó]ximo partido|figuras destacadas/i;

(async () => {
  for (const caso of CASOS) {
    const r = await fetch(`${BASE}/api/admin/meni/evaluar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify(caso.body),
    });
    if (!r.ok) { console.log(`${caso.nombre}: HTTP ${r.status} ${await r.text().then(t => t.slice(0, 200))}`); continue; }
    const j = await r.json();
    const d = j.result?.editorialDecision || {};
    const acciones = (d.acciones || []).filter(x => x !== 'Lista para publicar');
    const futbol = acciones.filter(x => FUTBOL_RE.test(x));
    console.log(`\n=== ${caso.nombre} ===`);
    console.log(`score: ${j.result?.scoreFinal} | estado: ${j.result?.estadoFinal} | ms: ${j._timingMs}`);
    console.log(`disciplina: ${d.readerQuestions?.clasificacionDeporte?.disciplina ?? 'n/a'} | etapa: ${d.readerQuestions?.clasificacionDeporte?.etapa ?? 'n/a'}`);
    console.log(`acciones: ${JSON.stringify(acciones).slice(0, 500)}`);
    console.log(`⚽ preguntas fútbol en acciones: ${futbol.length} ${futbol.length ? JSON.stringify(futbol) : ''}`);
  }
})().catch(e => { console.error(e); process.exit(1); });
