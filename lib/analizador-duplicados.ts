import { collection, getDocs, type Firestore } from 'firebase/firestore';

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

  const snapshot = await getDocs(collection(db, 'noticias'));
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
 * Version server-side con Admin SDK (para API routes)
 */
export async function detectarDuplicadoAdmin(
  dbAdmin: any,
  contenidoNuevo: string,
  tituloNuevo: string,
  umbral: number = 0.35,
  excluirId?: string
): Promise<ResultadoDuplicado> {
  const shinglesNuevo = generarShingles(contenidoNuevo + ' ' + tituloNuevo, 5);

  const snapshot = await dbAdmin.collection('noticias').get();
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
