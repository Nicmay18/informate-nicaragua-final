import { collection, getDocs, query, limit, type Firestore } from 'firebase/firestore';

/**
 * Genera shingles (n-grams) de palabras normalizadas
 */
function generarShingles(texto: string, n: number = 5): Set<string> {
  const limpio = texto
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\w\sáéíóúñ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const palabras = limpio.split(' ').filter((p) => p.length > 2);
  const shingles = new Set<string>();

  for (let i = 0; i <= palabras.length - n; i++) {
    shingles.add(palabras.slice(i, i + n).join(' '));
  }

  return shingles;
}

/**
 * Calcula similitud de Jaccard entre dos sets
 */
function similitudJaccard(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;

  const interseccion = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return interseccion.size / union.size;
}

export interface ResultadoDuplicado {
  esDuplicado: boolean;
  similitud: number;
  umbral: number;
  coincidencias: {
    id: string;
    titulo: string;
    similitud: number;
    url: string;
  }[];
  shinglesNuevos: number;
}

/**
 * Analiza si una noticia es duplicado o similar a existentes
 */
export async function detectarDuplicado(
  db: Firestore,
  contenidoNuevo: string,
  tituloNuevo: string,
  umbral: number = 0.35,
  excluirId?: string
): Promise<ResultadoDuplicado> {
  const shinglesNuevo = generarShingles(contenidoNuevo + ' ' + tituloNuevo, 5);

  const snapshot = await getDocs(
    query(collection(db, 'noticias'), limit(2000))
  );
  const coincidencias: ResultadoDuplicado['coincidencias'] = [];

  for (const doc of snapshot.docs) {
    if (excluirId && doc.id === excluirId) continue;

    const data = doc.data();
    const textoExistente = (data.contenido || '') + ' ' + (data.titulo || '');
    const shinglesExistente = generarShingles(textoExistente, 5);

    const similitud = similitudJaccard(shinglesNuevo, shinglesExistente);

    if (similitud >= umbral) {
      coincidencias.push({
        id: doc.id,
        titulo: data.titulo || 'Sin titulo',
        similitud: Math.round(similitud * 100),
        url: `https://nicaraguainformate.com/noticias/${doc.id}`,
      });
    }
  }

  coincidencias.sort((a, b) => b.similitud - a.similitud);

  const maxSimilitud = coincidencias.length > 0 ? coincidencias[0].similitud / 100 : 0;

  return {
    esDuplicado: maxSimilitud > 0.55,
    similitud: Math.round(maxSimilitud * 100),
    umbral: umbral * 100,
    coincidencias: coincidencias.slice(0, 5),
    shinglesNuevos: shinglesNuevo.size,
  };
}

/**
 * Version server-side con Admin SDK (para API routes).
 *
 * DOS FASES (control de costo/transferencia):
 *  FASE 1 — criba por metadatos: lee solo titulo+resumen de las notas
 *           (~200-500 bytes/doc en vez de ~5-30KB con contenido HTML).
 *           Un duplicado real comparte vocabulario del mismo evento en
 *           su título/resumen; umbral de candidatura deliberadamente
 *           bajo (0.10) para no perder recall. Además se incluyen los
 *           top-10 por similitud de metadatos como red de seguridad.
 *  FASE 2 — confirmación: solo los candidatos descargan `contenido`
 *           (getAll, una RPC) y se aplica el mismo Jaccard de antes
 *           sobre titulo+contenido. La precisión del resultado final
 *           es idéntica a la versión de una fase.
 */
export async function detectarDuplicadoAdmin(
  dbAdmin: any,
  contenidoNuevo: string,
  tituloNuevo: string,
  umbral: number = 0.35,
  excluirId?: string
): Promise<ResultadoDuplicado> {
  const shinglesNuevo = generarShingles(contenidoNuevo + ' ' + tituloNuevo, 5);
  const shinglesTituloNuevo = generarShingles(tituloNuevo || '', 5);

  // FASE 1: metadatos solamente.
  const snapshot = await dbAdmin
    .collection('noticias')
    .select('titulo', 'resumen', 'slug', 'estado')
    .limit(2000)
    .get();

  const CANDIDATE_MIN = 0.1;
  const PHASE2_CAP = 20;
  const TOP_FALLBACK = 10;

  const scored: { ref: any; id: string; titulo: string; metaScore: number }[] = [];
  for (const doc of snapshot.docs) {
    if (excluirId && doc.id === excluirId) continue;
    const data = doc.data();
    const shinglesMeta = generarShingles(`${data.titulo || ''} ${data.resumen || ''}`, 5);
    // Criba: similitud del título nuevo contra título+resumen existentes.
    // Si el artículo nuevo es largo, también mezclamos el contenido nuevo
    // a baja resolución para no perder duplicados con titular reescrito.
    const metaScore = Math.max(
      similitudJaccard(shinglesTituloNuevo, shinglesMeta),
      similitudJaccard(generarShingles(`${tituloNuevo} ${contenidoNuevo.slice(0, 600)}`, 5), shinglesMeta),
    );
    scored.push({ ref: doc.ref, id: doc.id, titulo: data.titulo || 'Sin titulo', metaScore });
  }

  scored.sort((a, b) => b.metaScore - a.metaScore);
  // Candidatos: superan el umbral de criba, o están en el top-N con alguna
  // similitud > 0 (red de seguridad ante títulos muy reescritos). Si TODO
  // puntúa 0, el contenido no comparte vocabulario con ninguna nota.
  const candidatos = scored.slice(0, PHASE2_CAP)
    .filter((c, idx) => c.metaScore >= CANDIDATE_MIN || (idx < TOP_FALLBACK && c.metaScore > 0));

  // FASE 2: contenido completo solo de candidatos (una sola RPC getAll).
  const docsCompletos = candidatos.length > 0
    ? await dbAdmin.getAll(...candidatos.map((c) => c.ref))
    : [];

  const coincidencias: ResultadoDuplicado['coincidencias'] = [];
  for (const doc of docsCompletos) {
    if (!doc.exists) continue;
    const data = doc.data();
    const textoExistente = (data.contenido || '') + ' ' + (data.titulo || '');
    const shinglesExistente = generarShingles(textoExistente, 5);
    const similitud = similitudJaccard(shinglesNuevo, shinglesExistente);

    if (similitud >= umbral) {
      coincidencias.push({
        id: doc.id,
        titulo: data.titulo || 'Sin titulo',
        similitud: Math.round(similitud * 100),
        url: `https://nicaraguainformate.com/noticias/${doc.id}`,
      });
    }
  }

  coincidencias.sort((a, b) => b.similitud - a.similitud);
  const maxSimilitud = coincidencias.length > 0 ? coincidencias[0].similitud / 100 : 0;

  return {
    esDuplicado: maxSimilitud > 0.55,
    similitud: Math.round(maxSimilitud * 100),
    umbral: umbral * 100,
    coincidencias: coincidencias.slice(0, 5),
    shinglesNuevos: shinglesNuevo.size,
  };
}
