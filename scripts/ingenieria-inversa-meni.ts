import { promises as fs } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const SERVICE_ACCOUNT_PATH = 'E:\\proyecto\\informate-instant-nicaragua-c7bc9eb4f553.json';

async function cargarEnvDesdeServiceAccount() {
  const sa = JSON.parse(await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf-8'));
  process.env.FIREBASE_PROJECT_ID = sa.project_id;
  process.env.FIREBASE_CLIENT_EMAIL = sa.client_email;
  process.env.FIREBASE_PRIVATE_KEY = sa.private_key;
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = Buffer.from(JSON.stringify(sa)).toString('base64');
}

function stripTags(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSentences(html: string): string[] {
  const text = stripTags(html);
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
}

function getParagraphs(html: string): string[] {
  const matches = html.match(/<p[^>]*>.*?<\/p>/gi);
  return matches && matches.length ? matches : [`<p>${html}</p>`];
}

function getScore(meni: any): number {
  return meni?.scoreFinal ?? 0;
}

function getUtilidad(meni: any): number {
  return meni?.auditoria?.utilidad ?? 0;
}

function getOriginalidad(meni: any): number {
  return meni?.auditoria?.originalidad ?? 0;
}

function getProfundidad(meni: any): number {
  return meni?.editorialDna?.selloNI?.explica ?? meni?.auditoria?.redaccion ?? 0;
}

function getEeat(meni: any): number {
  return meni?.eeat?.score ?? 0;
}

function getAportePropio(meni: any): string {
  return String(meni?.valorEditorial?.aportePropio ?? false);
}

function getPuntosConceptos(meni: any): string[] {
  return (meni?.puntosPerdidos || []).map((p: any) => String(p?.concepto || '')).filter(Boolean);
}

function diffConceptos(orig: string[], nuevo: string[]): { recuperados: string[]; nuevos: string[] } {
  const setOrig = new Set(orig);
  const setNuevo = new Set(nuevo);
  return {
    recuperados: [...setOrig].filter((c) => !setNuevo.has(c)),
    nuevos: [...setNuevo].filter((c) => !setOrig.has(c)),
  };
}

function buildInput(data: any, contenido: string) {
  const fecha = data.fecha?.toDate ? data.fecha.toDate().toISOString() : new Date().toISOString();
  return {
    slug: data.slug || 'noticia-real',
    titulo: data.titulo || '',
    contenido,
    resumen: data.resumen || '',
    categoria: data.categoria || 'General',
    autor: data.autor || '',
    fecha,
  };
}

const EXPERIMENTOS = [
  { id: 1, nombre: 'Agregar un H2', aplicar: (html: string) => `<h2>Qué ocurrió</h2>\n${html}` },
  { id: 2, nombre: 'Reorganizar párrafos', aplicar: (html: string) => getParagraphs(html).reverse().join('\n') },
  {
    id: 3,
    nombre: 'Agregar resumen inicial',
    aplicar: (html: string) => {
      const s = getSentences(html);
      const lead = s.slice(0, 2).join(' ');
      return `<p class="lead">${lead}</p>\n${html}`;
    },
  },
  {
    id: 4,
    nombre: 'Agregar cronología',
    aplicar: (html: string) => {
      const s = getSentences(html);
      const lineas = s.slice(0, 4).map((x) => `<li>${x}</li>`).join('\n');
      return `${html}\n<h2>Cronología</h2>\n<ul>\n${lineas}\n</ul>`;
    },
  },
  {
    id: 5,
    nombre: 'Agregar "¿Qué se sabe hasta ahora?"',
    aplicar: (html: string) => {
      const s = getSentences(html);
      const lineas = s.slice(0, 4).map((x) => `<li>${x}</li>`).join('\n');
      return `${html}\n<h2>¿Qué se sabe hasta ahora?</h2>\n<ul>\n${lineas}\n</ul>`;
    },
  },
  {
    id: 6,
    nombre: 'Agregar "¿Qué falta confirmar?"',
    aplicar: (html: string, _text: string, faltantes: string[]) => {
      const lineas = faltantes.slice(0, 5).map((x) => `<li>${x}</li>`).join('\n');
      return `${html}\n<h2>¿Qué falta confirmar?</h2>\n<ul>\n${lineas}\n</ul>`;
    },
  },
  {
    id: 7,
    nombre: 'Agregar contexto legal',
    aplicar: (html: string) => {
      const text = stripTags(html).toLowerCase();
      const instituciones = ['ministerio', 'policía', 'fiscalía', 'ley', 'normativa', 'gobierno', 'institución', 'alcaldía', 'asamblea', 'ministerio público'];
      const encontradas = instituciones.filter((i) => text.includes(i.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
      if (encontradas.length === 0) return html;
      return `${html}\n<h2>Marco legal e institucional</h2>\n<p>El texto menciona: ${encontradas.join(', ')}.</p>`;
    },
  },
  {
    id: 8,
    nombre: 'Agregar impacto ciudadano',
    aplicar: (html: string) => {
      const text = stripTags(html).toLowerCase();
      const claves = ['familias', 'comunidad', 'población', 'ciudadanos', 'habitantes', 'usuarios', 'vecinos', 'beneficiarios'];
      if (!claves.some((c) => text.includes(c.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) return html;
      const s = getSentences(html).filter((x) => claves.some((c) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(c)));
      const lineas = s.map((x) => `<li>${x}</li>`).join('\n');
      return `${html}\n<h2>Impacto ciudadano</h2>\n<ul>\n${lineas}\n</ul>`;
    },
  },
  {
    id: 9,
    nombre: 'Agregar antecedentes',
    aplicar: (html: string) => {
      const s = getSentences(html);
      const antecedentes = s.slice(0, 2).join(' ');
      return `${html}\n<h2>Antecedentes</h2>\n<p>${antecedentes}</p>`;
    },
  },
  {
    id: 10,
    nombre: 'Agregar preguntas frecuentes',
    aplicar: (html: string, _text: string, faltantes: string[], respuestas: string[]) => {
      const faqs: string[] = [];
      for (let i = 0; i < Math.min(faltantes.length, respuestas.length); i++) {
        faqs.push(`<dt>${faltantes[i]}</dt><dd>${respuestas[i]}</dd>`);
      }
      if (faqs.length === 0) return html;
      return `${html}\n<h2>Preguntas frecuentes</h2>\n<dl>\n${faqs.join('\n')}\n</dl>`;
    },
  },
];

async function main() {
  await cargarEnvDesdeServiceAccount();
  const { getAdminDb } = await import('../lib/firebase-admin');
  const { runMeniAsync } = await import('../lib/meni');
  const { editorialEnhancer } = await import('../lib/editorial/enhancer/editorialEnhancer');
  const db = getAdminDb();

  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(1).get();
  if (snap.empty) {
    console.error('No se encontró noticia en Firestore.');
    process.exit(1);
  }

  const data = snap.docs[0].data();
  const original = await runMeniAsync(buildInput(data, data.contenido || ''));
  const originalConceptos = getPuntosConceptos(original);

  const enhancer = editorialEnhancer({
    titulo: data.titulo,
    contenido: data.contenido || '',
    categoria: data.categoria,
    meniResult: original,
  });

  const faltantes = enhancer.preguntasSinResponder;
  const respuestas = getSentences(data.contenido || '');

  const resultados: any[] = [];

  for (const exp of EXPERIMENTOS) {
    const nuevoContenido = exp.aplicar(data.contenido || '', stripTags(data.contenido || ''), faltantes, respuestas);
    const nuevo = await runMeniAsync(buildInput(data, nuevoContenido));
    const { recuperados, nuevos } = diffConceptos(originalConceptos, getPuntosConceptos(nuevo));
    const delta = getScore(nuevo) - getScore(original);

    console.log('==========================');
    console.log(`Experimento ${exp.id}`);
    console.log(`Cambio aplicado: ${exp.nombre}`);
    console.log(`Score original: ${getScore(original)}`);
    console.log(`Score nuevo: ${getScore(nuevo)}`);
    console.log(`Diferencia: ${delta}`);
    console.log(`Utilidad: ${getUtilidad(nuevo)}`);
    console.log(`Originalidad: ${getOriginalidad(nuevo)}`);
    console.log(`Profundidad: ${getProfundidad(nuevo)}`);
    console.log(`EEAT: ${getEeat(nuevo)}`);
    console.log(`Aporte propio: ${getAportePropio(nuevo)}`);
    console.log(`Puntos perdidos recuperados: ${recuperados.join('; ') || 'Ninguno'}`);
    console.log(`Puntos perdidos nuevos: ${nuevos.join('; ') || 'Ninguno'}`);
    console.log('==========================');

    resultados.push({
      id: exp.id,
      cambio: exp.nombre,
      score: getScore(nuevo),
      delta,
      utilidad: getUtilidad(nuevo),
      originalidad: getOriginalidad(nuevo),
      profundidad: getProfundidad(nuevo),
      eeat: getEeat(nuevo),
    });
  }

  const todosCero = resultados.every((r) => r.delta === 0);
  if (todosCero) {
    console.log('\nATENCIÓN');
    console.log('');
    console.log('Los cambios editoriales no modifican el score MENI.');
    console.log('Esto indica que las funciones internas de puntuación no reaccionan a mejoras estructurales.');
    console.log('Se recomienda revisar las funciones que calculan:');
    console.log('- utilidad');
    console.log('- profundidad');
    console.log('- originalidad');
    console.log('- EEAT');
    console.log('- aporte propio');
    console.log('antes de seguir desarrollando editorialEnhancer.');
    process.exit(0);
  }

  resultados.sort((a, b) => b.delta - a.delta);

  console.log('\n| Cambio | Score | Δ | Utilidad | Originalidad | Profundidad | EEAT |');
  console.log('| ---- | ---- | ---- | ---- | ---- | ---- | ---- |');
  for (const r of resultados) {
    console.log(`| ${r.cambio} | ${r.score} | ${r.delta} | ${r.utilidad} | ${r.originalidad} | ${r.profundidad} | ${r.eeat} |`);
  }

  const mayor = resultados[0];
  const sinCambio = resultados.filter((r) => r.delta === 0).map((r) => r.cambio);

  const sumas = {
    utilidad: 0,
    originalidad: 0,
    profundidad: 0,
    eeat: 0,
  };
  for (const r of resultados) {
    sumas.utilidad += r.utilidad - getUtilidad(original);
    sumas.originalidad += r.originalidad - getOriginalidad(original);
    sumas.profundidad += r.profundidad - getProfundidad(original);
    sumas.eeat += r.eeat - getEeat(original);
  }

  const criterios = [
    { nombre: 'utilidad', total: sumas.utilidad },
    { nombre: 'originalidad', total: sumas.originalidad },
    { nombre: 'profundidad', total: sumas.profundidad },
    { nombre: 'EEAT', total: sumas.eeat },
  ];
  criterios.sort((a, b) => a.total - b.total);
  const masDificil = criterios[0].nombre;
  const masFacil = criterios[criterios.length - 1].nombre;

  const scoreDeltas = resultados.map((r) => r.delta);
  const utilidadDeltas = resultados.map((r) => r.utilidad - getUtilidad(original));
  const originalidadDeltas = resultados.map((r) => r.originalidad - getOriginalidad(original));
  const profundidadDeltas = resultados.map((r) => r.profundidad - getProfundidad(original));
  const eeatDeltas = resultados.map((r) => r.eeat - getEeat(original));

  function corr(x: number[], y: number[]): number {
    const n = x.length;
    if (n < 2) return 0;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
    const sumX2 = x.reduce((s, xi) => s + xi * xi, 0);
    const sumY2 = y.reduce((s, yi) => s + yi * yi, 0);
    const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denom === 0) return 0;
    return (n * sumXY - sumX * sumY) / denom;
  }

  const correlaciones = [
    { nombre: 'utilidad', r: corr(utilidadDeltas, scoreDeltas) },
    { nombre: 'originalidad', r: corr(originalidadDeltas, scoreDeltas) },
    { nombre: 'profundidad', r: corr(profundidadDeltas, scoreDeltas) },
    { nombre: 'EEAT', r: corr(eeatDeltas, scoreDeltas) },
  ];
  correlaciones.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

  console.log('\n=== ANÁLISIS AUTOMÁTICO ===');
  console.log(`1. ¿Qué cambio produjo mayor incremento? ${mayor.cambio} (+${mayor.delta})`);
  console.log(`2. ¿Qué cambio no produjo ninguno? ${sinCambio.join(', ') || 'Ninguno'}`);
  console.log(`3. ¿Qué criterio MENI es más difícil de mejorar? ${masDificil}`);
  console.log(`4. ¿Qué criterio cambia con más facilidad? ${masFacil}`);
  console.log(`5. ¿Qué variable parece dominar el score final? ${correlaciones[0].nombre} (r=${correlaciones[0].r.toFixed(3)})`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
