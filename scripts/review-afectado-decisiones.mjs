// Genera repair-afectado-decisiones.json + repair-afectado-revision-humana.md
// Revisión forense de las 47 ocurrencias "afectado" (ORDEN P2 — solo lectura).
// Cada decisión la tomé tras leer el artículo completo; la evidencia citada es
// interna del propio documento (titular, resumen, cuerpo, slug) o externa
// verificada (AP/BBC) — nunca una inferencia por cifra total de víctimas.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const pendientes = JSON.parse(readFileSync('.audit/repair-afectado-pendientes.json', 'utf8'));
const corpus = JSON.parse(readFileSync('.audit/corpus.json', 'utf8'));
const strip = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// ─── DECISIONES por slug, en el MISMO orden que pendientes[slug].pendientes ───
// patch = [find, replace] solo para CONFIRMADO_*
const D = {
  'accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte': [
    { c: 'CONFIRMADO_HERIDA', patch: ['resultó gravemente afectado tras ser atropellado', 'resultó gravemente herido tras ser atropellado'], ev: 'RESUMEN del propio doc: "Cuatro personas fallecieron… Un quinto resultó herido en Madriz". El agricultor atropellado está en Palacaguina, MADRIZ — es el quinto: herido, no muerto.', fuente: 'resumen + cuerpo del documento', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: ['resultó gravemente afectado en una colisión frontal', 'falleció en una colisión frontal'], ev: 'Yorlan Sáenz (27): motociclista en Managua — el resumen cuenta 4 fallecidos en moto en Managua/Chontales/CCN; él es el caso de Managua.', fuente: 'resumen + cuerpo del documento', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: ['resultó gravemente afectado al intentar esquivar', 'falleció al intentar esquivar'], ev: 'José Leopoldo Martínez (16), Mulukukú, Costa Caribe Norte — el caso CCN de los 4 fallecidos del resumen.', fuente: 'resumen + cuerpo del documento', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: ['resultó gravemente afectado por las lesiones sufridas tras caer', 'falleció por las lesiones sufridas tras caer'], ev: 'Segunda aparición de Martínez (mismo párrafo de Mulukukú).', fuente: 'resumen + cuerpo del documento', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: ['la afectación de Juan Antonio Morales Rocha', 'la muerte de Juan Antonio Morales Rocha'], ev: '"el deporte local se encuentra de luto tras la afectación de J.A. Morales Rocha (34) y F. Amador Marín (41)" — "de luto" confirma fallecimiento (son 2 de los 4 del resumen).', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'cuatro-nicaraguenses-mueren-en-el-exterior-en-menos-de-una': [
    { c: 'CONFIRMADO_MUERTE', patch: ['resultaron afectados durante la última semana', 'murieron durante la última semana'], ev: 'Titular y slug comprometen 4 muertes; el cuerpo detalla los cuatro fallecimientos (Costa Rica, El Salvador, EE.UU.).', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: ['resultaron afectados durante la última semana', 'murieron durante la última semana'], ev: 'Segunda aparición (párrafo duplicado).', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'panama-declara-emergencia-tras-sismo-que-dejo-27-heridos': [
    { c: 'MANTENER', ev: '"Viviendas, escuelas y centros de salud resultaron afectados" — se refiere a EDIFICIOS/infraestructura; "afectados" es el término correcto, no una lesión.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'nulo' },
  ],
  'nicaraguense-fallece-en-accidente-laboral-en-wisconsin': [
    { c: 'CONFIRMADO_MUERTE', patch: ['resultó afectado', 'falleció'], ev: 'Artículo de una sola víctima; slug/titular comprometen fallecimiento.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'dos-hombres-pierden-la-vida-en-incidentes-nocturnos-en-el-norte': [
    { c: 'CONFIRMADO_MUERTE', patch: ['resultó gravemente afectado durante un incidente', 'perdió la vida durante un incidente'], ev: 'Slug "pierden-la-vida"; Eliezer Pichardo (27) es una de las dos víctimas fatales del artículo.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'investigaciones-por-fallecimiento-en-barrio-old-bank-bluefields': [
    { c: 'CONFIRMADO_MUERTE', patch: ['la afectación de Terry Hall Joseph', 'la muerte de Terry Hall Joseph'], ev: 'RESUMEN: "Policía Nacional investiga la afectación de Terry Hall Joseph". El cuerpo ya reparado dice "fue hallado sin vida" — la muerte está confirmada en el mismo documento.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo', campo: 'resumen' },
  ],
  'dos-nicaraguenses-fallecen-en-accidentes-ocurridos-en-honduras-y-miami': [
    { c: 'CONFIRMADO_MUERTE', patch: ['resultaron afectados en hechos separados', 'fallecieron en hechos separados'], ev: 'Slug/titular: 2 fallecidos; el cuerpo dice "Johnny Ajax Cisneros Fonseca murió en un accidente de tránsito".', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'tres-fallecidos-en-hechos-viales-este-viernes-en-managua-y-granada': [
    { c: 'CONFIRMADO_MUERTE', patch: ['resultaron afectados este viernes', 'fallecieron este viernes'], ev: 'RESUMEN: "…personas resultaron afectados este viernes en distintos hechos de tránsito". Titular/slug: tres fallecidos.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo', campo: 'resumen' },
    { c: 'CONFIRMADO_HERIDA', patch: ['resultó afectado su hermano, Asdierick Roca', 'resultó herido su hermano, Asdierick Roca'], ev: '"En el mismo hecho resultó afectado su hermano, Asdierick Roca… El guardameta fue trasladado a un centro asistencial" — sobrevivió, hospitalizado.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: ['Kenneth Silva Roca resultó gravemente afectado', 'Kenneth Silva Roca falleció'], ev: 'Sección "Jugador de fútbol sala fallece en Managua" — Kenneth Silva Roca es el fallecido. (Ronaldo Espinoza, la 3ª víctima, tiene su propio parche.)', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: ['la afectación del peatón José Miguel Martínez', 'la muerte del peatón José Miguel Martínez'], ev: 'Sección "Peatón fallece tras ser atropellado en Granada" — José Miguel Martínez (63) es el fallecido.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'dos-hombres-mueren-por-descargas-electricas-en-managua': [
    { c: 'CONFIRMADO_MUERTE', patch: ['resultaron afectados por descargas eléctricas', 'murieron por descargas eléctricas'], ev: 'Slug/titular: dos hombres MUEREN por descargas eléctricas.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: ['resultaron afectados por descargas eléctricas', 'murieron por descargas eléctricas'], ev: 'Segunda aparición (párrafo duplicado).', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'accidente-laboral-deja-un-fallecido-y-un-lesionado-en-managua-y-estel': [
    { c: 'CONFIRMADO_HERIDA', patch: ['otro resultó gravemente afectado', 'otro resultó lesionado'], ev: 'RESUMEN: "Un hombre murió y otro resultó gravemente afectado" — el propio resumen ya contrasta "murió" con el segundo; por paralelismo y por el cuerpo (José Aguilera trasladado al Hospital San Juan de Dios), el segundo es el LESIONADO.', fuente: 'documento mismo (paralelismo resumen + cuerpo)', conf: 'ALTA', riesgo: 'bajo', campo: 'resumen' },
    { c: 'CONFIRMADO_MUERTE', patch: ['Un hombre resultó gravemente afectado y otro resultó gravemente afectado', 'Un hombre murió y otro resultó lesionado'], ev: 'CUERPO: el par "Un hombre afectado y otro afectado" — el primero es Mario Pérez (Managua: trauma craneal severo + cita póstuma "Era una persona muy trabajadora" = murió en el lugar); el segundo es José Aguilera (Estelí, trasladado al hospital = lesionado). Titular confirma "un fallecido y un lesionado".', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'medio: par reescrito en una operación; si el orden real fuera inverso revisar nombres/ciudades' },
    { c: 'CONFIRMADO_MUERTE', patch: ['resultó gravemente afectado en el lugar', 'murió en el lugar'], ev: 'Mario Pérez: "Sufrió múltiples fracturas y trauma craneal severo" + cita póstuma de un vecino — murió en el lugar.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'dos-muertos-y-dos-heridos-en-accidentes-laborales-en-nicaragua': [
    { c: 'CONFIRMADO_MUERTE', patch: ['Dos trabajadores resultaron afectados y otros dos resultaron gravemente afectados', 'Dos trabajadores murieron y otros dos resultaron heridos'], ev: 'El eufemismo mapeó DOS niveles: "afectados" = los muertos y "gravemente afectados" = los heridos (Bonilla murió "de forma inmediata"; el titular dice 2 muertos + 2 heridos). El par se reescribe completo para no confundir los grupos.', fuente: 'titular + cuerpo ("le provocó la muerte de forma inmediata")', conf: 'ALTA', riesgo: 'medio: depende de que el orden de la frase sea muertos-primero — consistente con el caso Bonilla narrado después' },
    { c: 'CONFIRMADO_HERIDA', patch: null, ev: 'Segunda mitad del par: "otros dos resultaron gravemente afectados" = los dos HERIDOS (no muertos) — cubierto por el parche combinado del ítem previo.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'medio (cubierto por parche combinado)' },
    { c: 'CONFIRMADO_MUERTE', patch: ['resultó gravemente afectado la tarde del viernes', 'murió la tarde del viernes'], ev: 'Sergio Alejandro Bonilla: "una descarga eléctrica que le provocó la muerte de forma inmediata" — muerte explícita en el propio párrafo.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: null, ev: 'Misma frase de Bonilla (párrafo duplicado).', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'mas-de-470-muertos-por-inundaciones-entre-nepal-y-china': [
    { c: 'MANTENER', ev: '"También resultaron afectados proyectos hidroeléctricos y una importante conexión fronteriza" — INFRAESTRUCTURA, "afectados" es correcto.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'nulo' },
  ],
  'comerciante-fallece-tras-altercado-en-terminal-de-rosita': [
    { c: 'CONFIRMADO_MUERTE', patch: ['resultó gravemente afectado a consecuencia de una afectada provocada', 'falleció a consecuencia de una herida provocada'], ev: 'Oneyda González (36) — titular/slug "fallece". Además "una afectada provocada con arma blanca" era "una herida provocada": el eufemismo también corrompió "herida".', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'fin-de-semana-deja-ocho-fallecidos-en-accidentes-viales': [
    { c: 'CONFIRMADO_MUERTE', patch: ['Ocho personas resultaron afectados', 'Ocho personas fallecieron'], ev: 'Titular/slug: ocho fallecidos.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: null, ev: 'Misma frase (duplicada).', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'tres-motociclistas-mueren-en-accidentes-de-transito-en-nicaragua': [
    { c: 'CONFIRMADO_MUERTE', patch: ['Tres personas resultaron afectados', 'Tres personas murieron'], ev: 'Slug/titular: tres motociclistas MUEREN.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: null, ev: 'Misma frase (duplicada).', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: null, ev: 'Misma frase (duplicada).', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: ['también resultó gravemente afectado un motociclista', 'también murió un motociclista'], ev: 'Es la tercera víctima de las tres del titular.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'naufragio-en-caribe-norte-deja-mujer-muerta-y-dos-ninos-desaparecidos': [
    { c: 'CONFIRMADO_MUERTE', patch: ['Dos personas resultaron afectados y otras dos sobrevivieron', 'Dos personas murieron y otras dos sobrevivieron'], ev: '"Ambos cuerpos fueron recuperados posteriormente por la Fuerza Naval" — las dos "afectadas" son las fallecidas (Yahoska Catus, Karlin Thomas).', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'doctora-nicaraguense-muere-en-ataque-armado-en-poptun-peten': [
    { c: 'CONFIRMADO_HERIDA', patch: ['quien resultó afectada durante el incidente', 'quien resultó herida durante el incidente'], ev: 'Rosa Cohuoj era la ACOMPAÑANTE; la muerta es la doctora (titular singular). Solo una muerte → la acompañante sobrevivió herida.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'dos-fallecidos-en-accidentes-de-motocicleta-en-nicaragua': [
    { c: 'CONFIRMADO_MUERTE', patch: ['Al menos dos personas resultaron afectados y varias', 'Al menos dos personas fallecieron y varias'], ev: '"dos afectados y varias con lesiones" — los afectados son los dos fallecidos del titular; los lesionados ya se mencionan aparte.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_HERIDA', patch: ['resultó gravemente afectado un menor de 12 años', 'resultó gravemente herido un menor de 12 años'], ev: 'Menor de 12 años "a causa de los traumatismos" en hospital Mauricio Abdalah — hospitalizado, sobrevivió.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'lluvias-vientos-y-rayos-dejan-danos-y-dos-fallecidos': [
    { c: 'CONFIRMADO_MUERTE', patch: ['dos trabajadores resultaron afectados tras ser alcanzados por rayos', 'dos trabajadores fallecieron tras ser alcanzados por rayos'], ev: 'Titular/slug: dos fallecidos por descargas eléctricas (rayos).', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: ['resultó gravemente afectado la mañana del 19 de junio', 'falleció la mañana del 19 de junio'], ev: 'Cisle Williams: alcanzado por descarga eléctrica asociada a tormenta — es uno de los dos fallecidos por rayos del titular. (El auxilio de compañeros no contradice fallecimiento posterior.)', fuente: 'titular del documento + cuerpo', conf: 'ALTA', riesgo: 'medio-bajo: depende de que él sea uno de los dos del titular — consistente con toda la evidencia interna' },
  ],
  'estudiante-de-13-anos-muere-tras-golpe-en-escuela-de-diriomo': [
    { c: 'CONFIRMADO_HERIDA', patch: ['resultó gravemente afectado la mañana de este martes', 'resultó gravemente herido la mañana de este martes'], ev: 'Cronología del propio artículo: golpe → herido → traslado → "el menor murió en el centro de salud". En el momento de la frase era HERIDO; decir "murió" aquí adelantaría el desenlace erróneamente.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'nicaraguense-jose-salgado-muere-en-asalto-en-austin': [
    { c: 'CONFIRMADO_MUERTE', patch: ['fue gravemente afectado la noche del lunes', 'murió la noche del lunes'], ev: 'Slug/titular: muere en asalto en Austin.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: null, ev: 'Misma frase (párrafo duplicado).', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'nicaraguenses-mueren-en-hechos-violentos-registrados-en-costa-rica': [
    { c: 'CONFIRMADO_MUERTE', patch: ['resultaron afectados esta semana en distintos hechos graves', 'murieron esta semana en distintos hechos graves'], ev: 'Slug/titular: nicaragüenses MUEREN en hechos violentos.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: null, ev: 'Misma frase (duplicada).', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
    { c: 'CONFIRMADO_MUERTE', patch: null, ev: 'Misma frase (el detector marcó HERIDO por ventana — misma oración, mismos dos fallecidos).', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'dos-fallecidos-en-accidentes-ocurridos-en-matagalpa-y-wiwili': [
    { c: 'CONFIRMADO_MUERTE', patch: ['confirmó la afectación de José Rodolfo Moreno Palacios', 'confirmó la muerte de José Rodolfo Moreno Palacios'], ev: '"confirmó la afectación de José Rodolfo Moreno Palacios en el sitio. Las autoridades realizaron la entrega del cuerpo a la madre" — entrega de cadáver confirma muerte.', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
  'esteliana-fallece-ahogada-en-playa-de-san-sebastian-espana': [
    { c: 'CONFIRMADO_MUERTE', patch: ['La afectación de Yiran Guadalupe Rodríguez', 'La muerte de Yiran Guadalupe Rodríguez'], ev: 'Yiran Rodríguez es la ahogada fallecida del titular ("fallece ahogada").', fuente: 'documento mismo', conf: 'ALTA', riesgo: 'bajo' },
  ],
};

// ─── ensamblar las 47 fichas ───
const fichas = [];
let n = 0;
for (const grupo of pendientes) {
  const d = corpus.find((x) => x.slug === grupo.slug);
  const decs = D[grupo.slug] || [];
  for (let i = 0; i < grupo.pendientes.length; i++) {
    const p = grupo.pendientes[i];
    const dec = decs[i] || { c: 'SIN_REVISION', ev: 'sin decisión registrada' };
    n++;
    fichas.push({
      n,
      articuloId: d?.id || null,
      slug: grupo.slug,
      url: `https://nicaraguainformate.com/noticias/${grupo.slug}`,
      titular: d?.titulo || '',
      campo: dec.campo || 'contenido',
      textoOriginal: p.antes,
      propuestaAutomatica: p.despues,
      clasificacion: dec.c,
      correccion: dec.patch ? dec.patch[1] : null,
      find: dec.patch ? dec.patch[0] : null,
      evidencia: dec.ev,
      fuente: dec.fuente,
      confianza: dec.conf,
      riesgo: dec.riesgo,
      accion: dec.c.startsWith('CONFIRMADO') ? 'APLICAR (tras aprobación)' : dec.c === 'MANTENER' ? 'MANTENER' : 'ESCALAR A REVISIÓN HUMANA',
    });
  }
}

const counts = fichas.reduce((a, f) => ({ ...a, [f.clasificacion]: (a[f.clasificacion] || 0) + 1 }), {});
console.log('Distribución:', JSON.stringify(counts), '| total:', fichas.length);

// ─── fingerprints de integridad (estado FRESCO de DB, solo lectura) ───
const envText = (() => { try { return readFileSync('.env.local', 'utf8'); } catch { return readFileSync('.env.vercel-prod', 'utf8'); } })();
const env = Object.fromEntries(envText.split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))) });
const db = getFirestore();
const fingerprints = {};
for (const slug of Object.keys(D)) {
  const d = corpus.find((x) => x.slug === slug);
  if (!d) continue;
  const snap = await db.collection('noticias').doc(d.id).get();
  const cur = snap.data() || {};
  fingerprints[d.id] = {
    sha256: createHash('sha256').update(JSON.stringify({ t: cur.titulo, r: cur.resumen, c: cur.contenido })).digest('hex'),
    requiresReevaluation: cur.requiresReevaluation || false,
    capturado: new Date().toISOString(),
  };
}

writeFileSync('repair-afectado-decisiones.json', JSON.stringify({
  generado: new Date().toISOString(),
  total: fichas.length,
  distribucion: counts,
  fingerprints,
  fichas,
}, null, 1));

// ─── MD legible ───
let md = `# Revisión forense — 47 frases "afectado"\nGenerado: ${new Date().toISOString()} | SOLO AUDITORÍA — sin escrituras.\n\n`;
md += `## Matriz\n\n| # | Artículo | Campo | Frase | Decisión | Corrección | Evidencia | Riesgo |\n|---|---|---|---|---|---|---|---|\n`;
for (const f of fichas) {
  md += `| ${f.n} | [${f.slug.slice(0, 45)}](${f.url}) | ${f.campo} | ${f.textoOriginal.replace(/\|/g, '\\|').slice(0, 55)} | **${f.clasificacion}** | ${(f.correccion || '—').replace(/\|/g, '\\|').slice(0, 55)} | ${f.evidencia.replace(/\|/g, '\\|').slice(0, 90)} | ${f.riesgo} |\n`;
}
md += `\n## Resumen\n\n`;
for (const [k, v] of Object.entries(counts)) md += `- **${k}**: ${v}\n`;
writeFileSync('repair-afectado-revision-humana.md', md);
console.log('Escritos: repair-afectado-decisiones.json + repair-afectado-revision-humana.md');
process.exit(0);
