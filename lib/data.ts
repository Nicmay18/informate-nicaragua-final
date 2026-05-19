import type { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';
import type { Noticia } from './types';
import { FALLBACK_IMAGE } from './types';

const DEFAULT_NEWS_COUNT = 30;
const DEFAULT_MAS_LEIDAS_COUNT = 5;
const MAX_COUNT = 500;

// =============================================================================
// NORMALIZAR IMÁGENES: Firebase Storage URL → ruta local /images/
// Las imágenes WebP se suben a public/images/ vía GitHub API
// Firestore solo guarda el URL original; lo mapeamos a la ruta local
// =============================================================================
function normalizeImage(imagen: string): string {
  if (!imagen || imagen === 'null' || imagen === 'undefined' || imagen === 'NaN') return FALLBACK_IMAGE;

  // Ya es ruta local
  if (imagen.startsWith('/images/')) return imagen;

  // Data URI (imagen inline del admin) → mantener
  if (imagen.startsWith('data:')) return imagen;

  // Firebase Storage URL → extraer filename y mapear a /images/ local
  if (imagen.includes('firebasestorage.googleapis.com') || imagen.includes('storage.googleapis.com')) {
    try {
      const url = new URL(imagen);
      // Formato: /v0/b/BUCKET/o/images%2Ffilename.webp
      const pathMatch = url.pathname.match(/\/(?:v0\/b\/[^/]+\/o\/)?(?:images%2F)?(.+)$/);
      if (pathMatch) {
        const encoded = pathMatch[1];
        const decoded = decodeURIComponent(encoded);
        const filename = decoded.split('/').pop()?.trim();
        if (filename && filename.length > 1) return `/images/${filename}`;
      }
      // Fallback: extraer último segmento del pathname
      const segments = url.pathname.split('/').filter(Boolean);
      const last = segments.pop();
      if (last && last.length > 1) return `/images/${last}`;
    } catch {
      // fallback a extract manual
    }
    // Último fallback: extraer nombre de archivo crudo
    const raw = imagen.split('/').pop()?.split('?')[0]?.trim();
    if (raw && raw.length > 1) return `/images/${raw}`;
    return FALLBACK_IMAGE;
  }

  // jsDelivr CDN → mantener directo (CDN global rápido y confiable)
  if (imagen.includes('cdn.jsdelivr.net')) {
    return imagen.split('?')[0];
  }

  // GitHub raw URLs → convertir a jsDelivr CDN (más confiable para producción)
  if (imagen.includes('githubusercontent.com')) {
    const clean = imagen.split('?')[0];
    const match = clean.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.*)/);
    if (match) {
      const [, user, repo, branch, path] = match;
      return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
    }
    return clean;
  }

  // URL externa (Unsplash, etc.) → quitar query params
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
    return imagen.split('?')[0];
  }

  // Ruta relativa images/
  if (imagen.startsWith('images/')) return `/${imagen}`;

  // Ruta absoluta ya normalizada
  if (imagen.startsWith('/')) return imagen;

  // Solo nombre de archivo → asumir /images/
  const fn = imagen.split('/').pop()?.trim();
  if (!fn || fn.length < 2) return FALLBACK_IMAGE;
  return `/images/${fn}`;
}

// =============================================================================
// FORZADO FIREBASE ADMIN SDK - Sin fallback mock data
// =============================================================================
// El sistema ahora solo funciona con noticias reales de Firebase
// Si Firebase falla, el sitio mostrará estado vacío con logs de error

function validateCount(count: number, defaultCount: number): number {
  if (typeof count !== 'number' || isNaN(count)) return defaultCount;
  if (count < 0) return defaultCount;
  if (count > MAX_COUNT) return MAX_COUNT;
  return count || defaultCount;
}

// =============================================================================
// Firebase Admin SDK - OBLIGATORIO para noticias reales
// =============================================================================
async function tryFirebaseAdmin(_count: number): Promise<Noticia[] | null> {
  try {
    const { adminDb } = await import('./firebase-admin');
    const snap = await adminDb
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(102)
      .get();

    return snap.docs
      .map((d: QueryDocumentSnapshot<DocumentData>) => {
        const data = d.data();
        return {
          id: d.id,
          slug: data.slug || d.id,
          titulo: data.titulo || '',
          resumen: data.resumen || '',
          contenido: data.contenido,
          categoria: data.categoria || 'Actualidad',
          imagen: normalizeImage(data.imagen || ''),
          fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '',
          fechaActualizacion: data.fechaActualizacion?.toDate ? data.fechaActualizacion.toDate().toISOString() : data.fechaActualizacion,
          autor: data.autor,
          destacada: data.destacada,
          vistas: data.vistas,
          palabras: data.palabras,
          tags: data.tags,
        };
      });
  } catch (err) {
    console.error('[data.ts] ERROR CRÍTICO: Firebase Admin SDK falló:', err instanceof Error ? err.message : String(err));
    console.error('[data.ts] VERIFICAR: Variables de entorno FIREBASE_* en Vercel');
    return null;
  }
}

// Noticias de ejemplo para desarrollo local
const MOCK_NOTICIAS: Noticia[] = [
  {
    id: '1',
    slug: 'homicidio-jinotega',
    titulo: 'Colisión en Jinotega deja víctima fatal; Policía investiga',
    resumen: 'Marvin Antonio Tinoco Rivera falleció en la vía Jinotega–El Guayacán tras impactar contra un camión sin señales.',
    contenido: '<p>Marvin Antonio Tinoco Rivera perdió la vida en un trágico accidente...</p>',
    categoria: 'Sucesos',
    imagen: '/logo.png',
    fecha: '2026-05-10T00:00:00.000Z',
    autor: 'Keyling Elieth Rivera Muñoz',
    vistas: 1500,
  },
  {
    id: '2',
    slug: 'incendio-mercado-oriental',
    titulo: 'Incendio afecta tramos de ropa en Mercado Oriental',
    resumen: 'Tres negocios de ropa quedaron reducidos a cenizas en el sector de la Casa de los Encajes.',
    contenido: '<p>Bomberos y AVEXI investigan las causas del incendio...</p>',
    categoria: 'Sucesos',
    imagen: '/logo.png',
    fecha: '2026-05-04T00:00:00.000Z',
    autor: 'Keyling Elieth Rivera Muñoz',
    vistas: 2300,
  },
  {
    id: '3',
    slug: 'vigilia-plaza-la-fe',
    titulo: 'Multitudinaria vigilia con Alex Zurdo y Grupo Barak en Plaza La Fe',
    resumen: 'Miles celebran el aniversario de Ríos de Agua Viva con artistas internacionales.',
    contenido: '<p>Una noche histórica de fe y unidad nacional...</p>',
    categoria: 'Nacionales',
    imagen: '/logo.png',
    fecha: '2026-05-08T00:00:00.000Z',
    autor: 'Keyling Elieth Rivera Muñoz',
    vistas: 3200,
  },
  {
    id: '4',
    slug: 'hospital-pediatrico-esteli',
    titulo: 'Avanza construcción del Hospital Pediátrico Las Segovias en Estelí',
    resumen: 'El proyecto alcanzará nuevas etapas de construcción para mejorar la atención médica.',
    contenido: '<p>La obra mejorará la atención médica especializada...</p>',
    categoria: 'Nacionales',
    imagen: '/logo.png',
    fecha: '2026-05-09T00:00:00.000Z',
    autor: 'Keyling Elieth Rivera Muñoz',
    vistas: 890,
  },
  {
    id: '5',
    slug: 'shakira-brasil',
    titulo: 'Shakira convoca a dos millones de fans en Brasil',
    resumen: 'La estrella colombiana rompe récords en su gira mundial.',
    contenido: '<p>Shakira demostró una vez más su poder...</p>',
    categoria: 'Espectáculos',
    imagen: '/logo.png',
    fecha: '2026-05-09T00:00:00.000Z',
    autor: 'Keyling Elieth Rivera Muñoz',
    vistas: 4500,
  },
  {
    id: '6',
    slug: 'berman-espinoza',
    titulo: 'Berman Espinoza alcanza récord de 1,450 ponches',
    resumen: 'El pitcher nica se convierte en el nuevo Rey de los ponches.',
    contenido: '<p>Un logro histórico para el beisbol nicaragüense...</p>',
    categoria: 'Deportes',
    imagen: '/logo.png',
    fecha: '2026-05-09T00:00:00.000Z',
    autor: 'Keyling Elieth Rivera Muñoz',
    vistas: 1800,
  },
  {
    id: '7',
    slug: 'muertes-accidentes-abril',
    titulo: '70 fallecimientos por accidentes de tránsito en abril',
    resumen: 'Managua y los motociclistas encabezan las alarmantes estadísticas.',
    contenido: '<p>Las autoridades hacen un llamado a la precaución...</p>',
    categoria: 'Nacionales',
    imagen: '/logo.png',
    fecha: '2026-05-09T00:00:00.000Z',
    autor: 'Keyling Elieth Rivera Muñoz',
    vistas: 2100,
  },
  {
    id: '8',
    slug: 'netflix-crown',
    titulo: 'Netflix prepara precuela de "The Crown" sobre el origen de los Windsor',
    resumen: 'La plataforma expande el universo de la exitosa serie.',
    contenido: '<p>Una nueva mirada a la historia de la realeza...</p>',
    categoria: 'Espectáculos',
    imagen: '/logo.png',
    fecha: '2026-05-09T00:00:00.000Z',
    autor: 'Keyling Elieth Rivera Muñoz',
    vistas: 1200,
  },
];

export async function getNews(count: number = DEFAULT_NEWS_COUNT): Promise<Noticia[]> {
  const validatedCount = validateCount(count, DEFAULT_NEWS_COUNT);
  const firebaseNews = await tryFirebaseAdmin(validatedCount);
  if (firebaseNews && firebaseNews.length > 0) {
    return firebaseNews;
  }
  return MOCK_NOTICIAS.slice(0, validatedCount);
}

export async function getNewsByCategory(categoria: string, count: number = DEFAULT_NEWS_COUNT): Promise<Noticia[]> {
  const validatedCount = validateCount(count, DEFAULT_NEWS_COUNT);
  try {
    const { adminDb } = await import('./firebase-admin');
    const snap = await adminDb
      .collection('noticias')
      .where('categoria', '==', categoria)
      .orderBy('fecha', 'desc')
      .limit(validatedCount)
      .get();
    const noticias = snap.docs
      .map((d: QueryDocumentSnapshot<DocumentData>) => {
        const data = d.data();
        return {
          id: d.id,
          slug: data.slug || d.id,
          titulo: data.titulo || '',
          resumen: data.resumen || '',
          contenido: data.contenido,
          categoria: data.categoria || 'Actualidad',
          imagen: normalizeImage(data.imagen || ''),
          fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '',
          autor: data.autor,
          destacada: data.destacada,
          vistas: data.vistas,
          palabras: data.palabras,
        };
      });
    return noticias;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('index') || msg.includes('requires an index')) {
      console.warn(`[data.ts] Se requiere índice compuesto en Firestore para categoría ${categoria}.`);
    } else {
      console.error(`[data.ts] ERROR: No se pudieron obtener noticias de categoría ${categoria}:`, msg);
    }
  }
  const filtered = MOCK_NOTICIAS.filter(n => n.categoria === categoria);
  return filtered.slice(0, validatedCount);
}

export async function getMasLeidas(count: number = DEFAULT_MAS_LEIDAS_COUNT): Promise<Noticia[]> {
  const validatedCount = validateCount(count, DEFAULT_MAS_LEIDAS_COUNT);
  try {
    const { adminDb } = await import('./firebase-admin');
    const snap = await adminDb
      .collection('noticias')
      .orderBy('vistas', 'desc')
      .limit(validatedCount)
      .get();
    if (!snap.empty) {
      const masLeidas = snap.docs
        .map((d: QueryDocumentSnapshot<DocumentData>) => {
          const data = d.data();
          return {
            id: d.id,
            slug: data.slug || d.id,
            titulo: data.titulo || '',
            resumen: data.resumen || '',
            contenido: data.contenido,
            categoria: data.categoria || 'Actualidad',
            imagen: normalizeImage(data.imagen || ''),
            fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '',
            autor: data.autor,
            destacada: data.destacada,
            vistas: data.vistas,
            palabras: data.palabras,
          };
        });
      return masLeidas;
    }
  } catch (err) {
    console.error('[data.ts] ERROR: No se pudieron obtener más leídas de Firebase:', err instanceof Error ? err.message : String(err));
  }
  return MOCK_NOTICIAS.slice(0, validatedCount);
}

export async function getNewsBySlug(slug: string): Promise<Noticia | null> {
  if (!slug || typeof slug !== 'string') {
    return null;
  }
  try {
    const { adminDb } = await import('./firebase-admin');
    const snap = await adminDb
      .collection('noticias')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        slug: data.slug || doc.id,
        titulo: data.titulo || '',
        resumen: data.resumen || '',
        contenido: data.contenido || '',
        categoria: data.categoria || 'Actualidad',
        imagen: normalizeImage(data.imagen || ''),
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '',
        fechaActualizacion: data.fechaActualizacion?.toDate ? data.fechaActualizacion.toDate().toISOString() : data.fechaActualizacion,
        autor: data.autor,
        destacada: data.destacada,
        vistas: data.vistas,
        palabras: data.palabras,
        tags: data.tags,
      };
    }
  } catch (err) {
    console.error('[data.ts] ERROR: No se pudo obtener noticia por slug:', err instanceof Error ? err.message : String(err));
  }
  const mockNoticia = MOCK_NOTICIAS.find(n => n.slug === slug);
  if (mockNoticia) {
    return mockNoticia;
  }
  return null;
}

export async function getAllSlugs(): Promise<string[]> {
  try {
    const { adminDb } = await import('./firebase-admin');
    const snap = await adminDb
      .collection('noticias')
      .select('slug')
      .limit(2000)
      .get();
    
    return snap.docs
      .map((d: QueryDocumentSnapshot<DocumentData>) => d.data().slug)
      .filter(Boolean);
  } catch (err) {
    console.error('[data.ts] ERROR: No se pudieron obtener slugs:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

export async function getRelatedNews(categoria: string, excludeSlug: string, count: number = 3): Promise<Noticia[]> {
  const validatedCount = validateCount(count, 3);

  try {
    const { adminDb } = await import('./firebase-admin');
    const snap = await adminDb
      .collection('noticias')
      .where('categoria', '==', categoria)
      .orderBy('fecha', 'desc')
      .limit(validatedCount + 1)
      .get();

    const related = snap.docs
      .map((d: QueryDocumentSnapshot<DocumentData>) => {
        const data = d.data();
        return {
          id: d.id,
          slug: data.slug || d.id,
          titulo: data.titulo || '',
          resumen: data.resumen || '',
          contenido: data.contenido,
          categoria: data.categoria || 'Actualidad',
          imagen: normalizeImage(data.imagen || ''),
          fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '',
          autor: data.autor,
          destacada: data.destacada,
          vistas: data.vistas,
          palabras: data.palabras,
        };
      })
      .filter((n: Noticia) => n.slug !== excludeSlug)
      .slice(0, validatedCount);

    return related;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Firestore composite index missing → log helpful message, don't crash
    if (msg.includes('index') || msg.includes('requires an index')) {
      console.warn('[data.ts] Se requiere índice compuesto en Firestore para noticias relacionadas. Crear índice en consola Firebase.');
    } else {
      console.error('[data.ts] ERROR: No se pudieron obtener noticias relacionadas:', msg);
    }
  }

  // Fallback a noticias de ejemplo
  return MOCK_NOTICIAS
    .filter(n => n.categoria === categoria && n.slug !== excludeSlug)
    .slice(0, validatedCount);
}
