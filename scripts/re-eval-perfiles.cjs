/**
 * Re-evalúa perfiles con el profile-detector corregido.
 * Reporta discrepancias entre perfil actual en Firestore y perfil detectado.
 * NO modifica nada - solo reporta.
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const e = path.join(process.cwd(), '.env.local');
if (fs.existsSync(e)) {
  for (const l of fs.readFileSync(e, 'utf8').split('\n')) {
    const l2 = l.replace(/\r$/, '');
    const m = l2.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  }
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  })
});

const db = admin.firestore();

// Importar el detector (es TS, usamos ts-node o compilamos inline)
// Como es CJS, replicamos la lógica mínima del detector aquí
const PROFILE_SIGNALS = {
  sucesos: [
    { keyword: 'accidente', weight: 1 }, { keyword: 'transito', weight: 1 },
    { keyword: 'policia', weight: 1 }, { keyword: 'delito', weight: 1 },
    { keyword: 'crimen', weight: 1 }, { keyword: 'homicidio', weight: 1 },
    { keyword: 'fallecido', weight: 1 }, { keyword: 'heridos', weight: 1 },
    { keyword: 'bomberos', weight: 1 }, { keyword: 'rescate', weight: 0.8 },
    { keyword: 'captura', weight: 1.5 }, { keyword: 'orden de captura', weight: 1.5 },
    { keyword: 'contrabando', weight: 1.5 }, { keyword: 'extradicion', weight: 1.2 },
    { keyword: 'notificacion roja', weight: 1.2 }, { keyword: 'interpol', weight: 1 },
    { keyword: 'procesado', weight: 1 }, { keyword: 'procesada', weight: 1 },
    { keyword: 'imputado', weight: 1 }, { keyword: 'imputada', weight: 1 },
  ],
  violencia_genero: [
    { keyword: 'femicidio', weight: 2 }, { keyword: 'feminicidio', weight: 2 },
    { keyword: 'violencia contra mujer', weight: 2 }, { keyword: 'violencia de genero', weight: 2 },
    { keyword: 'violencia intrafamiliar', weight: 1.5 }, { keyword: 'maltrato', weight: 1 },
    { keyword: 'agredio', weight: 1 }, { keyword: 'expareja', weight: 1 },
    { keyword: 'ex pareja', weight: 1 }, { keyword: 'mujer', weight: 0.3 },
    { keyword: 'asesinada', weight: 1.5 },
  ],
  salud: [
    { keyword: 'sintomas', weight: 1.5 }, { keyword: 'prevencion', weight: 1.5 },
    { keyword: 'como se transmite', weight: 2 }, { keyword: 'vacuna', weight: 1 },
    { keyword: 'minsa', weight: 1.5 }, { keyword: 'brote', weight: 1 },
    { keyword: 'epidemia', weight: 1.5 }, { keyword: 'enfermedad', weight: 1 },
    { keyword: 'hospital', weight: 0.8 }, { keyword: 'medico', weight: 0.8 },
    { keyword: 'contagio', weight: 1.5 }, { keyword: 'dengue', weight: 1.5 },
    { keyword: 'malaria', weight: 1.5 }, { keyword: 'covid', weight: 1.5 },
  ],
  nacionales: [
    { keyword: 'gobierno de nicaragua', weight: 1.5 }, { keyword: 'asamblea nacional', weight: 1.5 },
    { keyword: 'ministro', weight: 1 }, { keyword: 'managua', weight: 0.8 },
    { keyword: 'nicaragua', weight: 0.5 }, { keyword: 'alcaldia', weight: 1 },
    { keyword: 'ministerio', weight: 1 }, { keyword: 'institucion', weight: 0.5 },
  ],
  politica: [
    { keyword: 'politica', weight: 1 }, { keyword: 'partido', weight: 1 },
    { keyword: 'oposicion', weight: 1 }, { keyword: 'elecciones', weight: 1.5 },
    { keyword: 'diputado', weight: 1 }, { keyword: 'candidato', weight: 1 },
    { keyword: 'gobernante', weight: 1 },
  ],
  economia: [
    { keyword: 'precio', weight: 1 }, { keyword: 'economia', weight: 1.5 },
    { keyword: 'inflacion', weight: 1.5 }, { keyword: 'salario', weight: 1 },
    { keyword: 'banco', weight: 1 }, { keyword: 'finanzas', weight: 1.5 },
    { keyword: 'dolar', weight: 1 }, { keyword: 'mercado', weight: 0.8 },
  ],
  deportes: [
    { keyword: 'futbol', weight: 1.5 }, { keyword: 'partido', weight: 1 },
    { keyword: 'gol', weight: 1 }, { keyword: 'seleccion', weight: 1 },
    { keyword: 'atleta', weight: 1 }, { keyword: 'competencia', weight: 0.5 },
    { keyword: 'torneo', weight: 1 }, { keyword: 'boxeador', weight: 1.5 },
    { keyword: 'boxeo', weight: 1.5 }, { keyword: 'pelea', weight: 1 },
    { keyword: 'combate', weight: 1 },
  ],
  cultura: [
    { keyword: 'arte', weight: 1 }, { keyword: 'musica', weight: 1.5 },
    { keyword: 'cultura', weight: 1.5 }, { keyword: 'festival', weight: 1.5 },
    { keyword: 'concierto', weight: 1.5 }, { keyword: 'teatro', weight: 1.5 },
    { keyword: 'exposicion', weight: 1 }, { keyword: 'gastronomia', weight: 1.5 },
    { keyword: 'tradicion', weight: 1.2 }, { keyword: 'patrimonio', weight: 1.2 },
    { keyword: 'comida tipica', weight: 1.2 }, { keyword: 'religiosa', weight: 1 },
    { keyword: 'religioso', weight: 1 }, { keyword: 'santo', weight: 1 },
    { keyword: 'santa', weight: 1 }, { keyword: 'procesion', weight: 1.5 },
  ],
  espectaculos: [
    { keyword: 'cine', weight: 2 }, { keyword: 'pelicula', weight: 2 },
    { keyword: 'estreno', weight: 2 }, { keyword: 'estrenar', weight: 1.5 },
    { keyword: 'actor', weight: 1.5 }, { keyword: 'actriz', weight: 1.5 },
    { keyword: 'director', weight: 1.5 }, { keyword: 'hollywood', weight: 2 },
    { keyword: 'warner', weight: 1.5 }, { keyword: 'disney', weight: 1.5 },
    { keyword: 'marvel', weight: 1.5 }, { keyword: 'trailer', weight: 1.5 },
    { keyword: 'taquilla', weight: 1.5 }, { keyword: 'serie', weight: 1.2 },
    { keyword: 'streaming', weight: 1.5 }, { keyword: 'netflix', weight: 1.5 },
    { keyword: 'amazon prime', weight: 1.5 }, { keyword: 'hbo', weight: 1.5 },
    { keyword: 'personaje', weight: 1 }, { keyword: 'protagonista', weight: 1.5 },
    { keyword: 'elenco', weight: 1.2 }, { keyword: 'reparto', weight: 1.2 },
    { keyword: 'secuela', weight: 1.5 }, { keyword: 'precuela', weight: 1.5 },
    { keyword: 'remake', weight: 1.5 }, { keyword: 'animacion', weight: 1.5 },
    { keyword: 'documental', weight: 1.2 }, { keyword: 'festival de cine', weight: 2 },
    { keyword: 'oscar', weight: 1.5 }, { keyword: 'goya', weight: 1.5 },
    { keyword: 'grammy', weight: 1.5 }, { keyword: 'premios', weight: 1 },
    { keyword: 'celebridad', weight: 1.5 }, { keyword: 'famoso', weight: 1 },
    { keyword: 'famosa', weight: 1 }, { keyword: 'show', weight: 1 },
    { keyword: 'espectaculo', weight: 1.5 }, { keyword: 'entretenimiento', weight: 1.5 },
    { keyword: 'comedia', weight: 1.5 }, { keyword: 'drama', weight: 1 },
    { keyword: 'accion', weight: 1 }, { keyword: 'ficcion', weight: 1 },
    { keyword: 'superheroe', weight: 1.5 }, { keyword: 'villano', weight: 1.2 },
    { keyword: 'looney tunes', weight: 2 }, { keyword: 'cartoon', weight: 1.5 },
    { keyword: 'videojuego', weight: 1.5 }, { keyword: 'consola', weight: 1.5 },
    { keyword: 'playstation', weight: 1.5 }, { keyword: 'xbox', weight: 1.5 },
    { keyword: 'nintendo', weight: 1.5 },
  ],
  tecnologia: [
    { keyword: 'tecnologia', weight: 1.5 }, { keyword: 'app', weight: 1 },
    { keyword: 'celular', weight: 0.8 }, { keyword: 'internet', weight: 1 },
    { keyword: 'inteligencia artificial', weight: 1.5 }, { keyword: 'ia', weight: 1 },
    { keyword: 'software', weight: 1 }, { keyword: 'smartphone', weight: 1.5 },
    { keyword: 'samsung', weight: 1 }, { keyword: 'apple', weight: 1 },
    { keyword: 'iphone', weight: 1.5 }, { keyword: 'galaxy', weight: 1 },
  ],
  internacional: [
    { keyword: 'internacional', weight: 1.5 }, { keyword: 'estados unidos', weight: 1.5 },
    { keyword: 'eeuu', weight: 1.5 }, { keyword: 'onu', weight: 1 },
    { keyword: 'europa', weight: 1 }, { keyword: 'mundo', weight: 0.8 },
    { keyword: 'honduras', weight: 1.5 }, { keyword: 'el salvador', weight: 1.5 },
    { keyword: 'guatemala', weight: 1.5 }, { keyword: 'costa rica', weight: 1.5 },
    { keyword: 'panama', weight: 1.5 }, { keyword: 'interpol', weight: 1.5 },
    { keyword: 'extradicion', weight: 1.5 }, { keyword: 'deportacion', weight: 1.2 },
    { keyword: 'notificacion roja', weight: 1.5 }, { keyword: 'china', weight: 1 },
    { keyword: 'rusia', weight: 1 }, { keyword: 'ucrania', weight: 1 },
    { keyword: 'mexico', weight: 1 }, { keyword: 'colombia', weight: 1 },
    { keyword: 'argentina', weight: 1 }, { keyword: 'brasil', weight: 1 },
    { keyword: 'puerto rico', weight: 1.5 },
  ],
  educacion: [
    { keyword: 'educacion', weight: 2 }, { keyword: 'escuela', weight: 1.5 },
    { keyword: 'colegio', weight: 1.5 }, { keyword: 'universidad', weight: 1.5 },
    { keyword: 'estudiantes', weight: 1 }, { keyword: 'estudiante', weight: 1 },
    { keyword: 'docentes', weight: 1.5 }, { keyword: 'docente', weight: 1.5 },
    { keyword: 'matricula', weight: 1.5 }, { keyword: 'becas', weight: 1.5 },
    { keyword: 'mined', weight: 1.2 }, { keyword: 'aulas', weight: 1 },
    { keyword: 'calendario escolar', weight: 1.5 }, { keyword: 'curriculo', weight: 1.5 },
    { keyword: 'educativa', weight: 2 }, { keyword: 'educativo', weight: 2 },
  ],
  ambiente: [
    { keyword: 'cambio climatico', weight: 2 }, { keyword: 'contaminacion', weight: 1.5 },
    { keyword: 'bosque', weight: 1.5 }, { keyword: 'bosques', weight: 1.5 },
    { keyword: 'ecosistema', weight: 1.5 }, { keyword: 'ecosistemas', weight: 1.5 },
    { keyword: 'sequia', weight: 1.5 }, { keyword: 'lluvia', weight: 1.2 },
    { keyword: 'lluvias', weight: 1.2 }, { keyword: 'biodiversidad', weight: 1.5 },
    { keyword: 'medio ambiente', weight: 2 }, { keyword: 'medioambiente', weight: 2 },
    { keyword: 'agricultura', weight: 1.5 }, { keyword: 'agricultores', weight: 1.5 },
    { keyword: 'cosecha', weight: 1 }, { keyword: 'volcan', weight: 1.5 },
    { keyword: 'ceniza', weight: 1.5 }, { keyword: 'emision volcanica', weight: 2 },
    { keyword: 'actividad volcanica', weight: 2 }, { keyword: 'ineter', weight: 1.5 },
    { keyword: 'sismo', weight: 1.5 }, { keyword: 'terremoto', weight: 1.5 },
    { keyword: 'erupcion', weight: 1.5 }, { keyword: 'gases volcanicos', weight: 2 },
    { keyword: 'comupred', weight: 1.2 }, { keyword: 'sinapred', weight: 1.2 },
  ],
  turismo: [
    { keyword: 'turismo', weight: 1.5 }, { keyword: 'mirador', weight: 1.5 },
    { keyword: 'mirador de', weight: 1.5 }, { keyword: 'lugar turistico', weight: 1.5 },
    { keyword: 'destino turistico', weight: 1.5 }, { keyword: 'como llegar', weight: 1.2 },
    { keyword: 'horarios', weight: 1.2 }, { keyword: 'precios', weight: 1 },
    { keyword: 'atractivo turistico', weight: 1.5 }, { keyword: 'reserva natural', weight: 1.5 },
    { keyword: 'playa', weight: 1.2 }, { keyword: 'catarina', weight: 1.5 },
    { keyword: 'guia turistica', weight: 1.5 }, { keyword: 'isla', weight: 1.2 },
    { keyword: 'sendero', weight: 1.2 }, { keyword: 'hotel', weight: 0.8 },
  ],
  gastronomia: [
    { keyword: 'gastronomia', weight: 1.5 }, { keyword: 'platillo', weight: 1.5 },
    { keyword: 'comida tipica', weight: 1.5 }, { keyword: 'receta', weight: 1.5 },
    { keyword: 'ingredientes', weight: 1.5 }, { keyword: 'restaurante', weight: 1 },
    { keyword: 'sabor', weight: 1.2 }, { keyword: 'tradicion', weight: 1.2 },
  ],
};

function normalize(text) {
  return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function countMatches(text, signal) {
  const nText = normalize(text);
  const nKw = normalize(signal.keyword);
  const isMulti = nKw.includes(' ');
  const pattern = isMulti
    ? new RegExp(nKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    : new RegExp(`\\b${nKw}\\b`, 'g');
  const matches = nText.match(pattern) || [];
  return matches.length;
}

function detectProfile(titulo, contenido, resumen) {
  const fullText = `${titulo || ''} ${contenido || ''} ${resumen || ''}`.trim();
  const scores = {};
  for (const profile of Object.keys(PROFILE_SIGNALS)) {
    let score = 0;
    for (const signal of PROFILE_SIGNALS[profile]) {
      const count = countMatches(fullText, signal);
      if (count > 0) score += count * signal.weight;
    }
    scores[profile] = score;
  }
  // Reglas de desempate (mismo que profile-detector.ts)
  if (scores.violencia_genero > 0 && scores.sucesos > 0) scores.violencia_genero += 3;
  if (scores.salud > 0 && scores.sucesos > 0) scores.salud += 1;
  if (scores.educacion > 0 && scores.nacionales > 0) scores.educacion += 2;
  if (scores.espectaculos > 0 && scores.cultura > 0) scores.espectaculos += 2;
  if (scores.espectaculos > 0 && scores.ambiente > 0) {
    scores.ambiente = Math.max(0, scores.ambiente - scores.espectaculos);
  }
  if (scores.deportes > 0 && scores.internacional > 0) {
    scores.deportes += 3;
  }
  if (scores.nacionales > 0 && scores.internacional > 0) {
    scores.nacionales += 2;
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return { profile: sorted[0][0], score: sorted[0][1], scores };
}

(async () => {
  const snap = await db.collection('noticias').get();
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log('=== RE-EVALUACION DE PERFILES ===');
  console.log('Total documentos:', docs.length);

  const discrepancias = [];
  const sinPerfil = [];

  for (const doc of docs) {
    const perfilActual = doc.perfil || null;
    const detectado = detectProfile(doc.titulo, doc.contenido, doc.resumen);

    if (detectado.score === 0) {
      sinPerfil.push({ id: doc.id, titulo: doc.titulo, perfilActual });
      continue;
    }

    if (perfilActual !== detectado.profile) {
      discrepancias.push({
        id: doc.id,
        titulo: doc.titulo,
        perfilActual: perfilActual || 'sin_perfil',
        perfilDetectado: detectado.profile,
        scoreDetectado: detectado.score,
        categoria: doc.categoria,
        estado: doc.estado,
      });
    }
  }

  console.log('\n=== DISCREPANCIAS (perfil actual != perfil detectado) ===');
  console.log('Total discrepancias:', discrepancias.length);

  // Agrupar por tipo de cambio
  const cambios = {};
  discrepancias.forEach(d => {
    const key = `${d.perfilActual} -> ${d.perfilDetectado}`;
    if (!cambios[key]) cambios[key] = [];
    cambios[key].push(d);
  });

  Object.entries(cambios).sort((a, b) => b[1].length - a[1].length).forEach(([tipo, arr]) => {
    console.log(`\n${tipo} (${arr.length} casos):`);
    arr.slice(0, 5).forEach(d => {
      console.log(`  - ${d.id} | "${d.titulo?.substring(0, 60)}..." | cat=${d.categoria} | estado=${d.estado}`);
    });
    if (arr.length > 5) console.log(`  ... y ${arr.length - 5} más`);
  });

  console.log('\n=== SIN PERFIL DETECTADO (score=0) ===');
  console.log('Total:', sinPerfil.length);
  sinPerfil.forEach(d => {
    console.log(`  - ${d.id} | "${d.titulo?.substring(0, 60)}..." | perfilActual=${d.perfilActual}`);
  });

  // Guardar resultado para revisión
  const output = { discrepancias, sinPerfil, total: docs.length };
  fs.writeFileSync('scripts/re-eval-perfiles-result.json', JSON.stringify(output, null, 2));
  console.log('\nResultado guardado en scripts/re-eval-perfiles-result.json');

  process.exit(0);
})().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
