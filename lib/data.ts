import type { Noticia } from './types';

const DEFAULT_NEWS_COUNT = 30;
const DEFAULT_MAS_LEIDAS_COUNT = 5;
const MAX_COUNT = 100;

// =============================================================================
// MOCK DATA — Se usa SOLO si Firebase Admin no responde
// =============================================================================
const MOCK_NOTICIAS: Noticia[] = [
  {
    id: '1',
    slug: 'nicaragua-avanza-educacion-norte',
    titulo: 'Nicaragua avanza en cobertura educativa con nuevas escuelas en el norte',
    resumen: 'El Ministerio de Educación inauguró 12 nuevos centros escolares en Estelí, Jinotega y Madriz, beneficiando a más de 3,000 estudiantes con infraestructura moderna.',
    contenido: '',
    categoria: 'Nacionales',
    imagen: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
    fecha: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min atrás
    autor: 'Redacción NI',
    destacada: true,
    vistas: 1240,
    palabras: 450,
  },
  {
    id: '2',
    slug: 'precios-combustibles-semana-mayo',
    titulo: 'Precios de combustibles se mantienen estables esta semana',
    resumen: 'El Instituto Nicaragüense de Energía confirmó que no habrá variación en los precios de la gasolina regular, súper y el diésel para esta semana.',
    contenido: '',
    categoria: 'Nacionales',
    imagen: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80',
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h atrás
    autor: 'Redacción NI',
    vistas: 980,
    palabras: 320,
  },
  {
    id: '3',
    slug: 'seleccion-nicaragua-nations-league',
    titulo: 'Selección de Nicaragua se prepara para eliminatorias de Nations League',
    resumen: 'El equipo pinolero inició la concentración en Managua con miras a los próximos partidos de la CONCACAF Nations League.',
    contenido: '',
    categoria: 'Deportes',
    imagen: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h atrás
    autor: 'Deportes NI',
    vistas: 2100,
    palabras: 380,
  },
  {
    id: '4',
    slug: 'ineter-alerta-lluvias-pacifico',
    titulo: 'INETER alerta sobre lluvias fuertes en el Pacífico nicaragüense',
    resumen: 'Se esperan precipitaciones intensas en Managua, León y Chinandega durante las próximas 48 horas. Se recomienda tomar precauciones.',
    contenido: '',
    categoria: 'Sucesos',
    imagen: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&q=80',
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    autor: 'Redacción NI',
    vistas: 3400,
    palabras: 290,
  },
  {
    id: '5',
    slug: 'festival-guitarra-esteli-internacional',
    titulo: 'Festival de la Guitarra reúne a artistas internacionales en Estelí',
    resumen: 'La ciudad de Estelí será sede del décimo festival internacional con participación de músicos de 8 países diferentes.',
    contenido: '',
    categoria: 'Espectáculos',
    imagen: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    autor: 'Cultura NI',
    vistas: 890,
    palabras: 410,
  },
  {
    id: '6',
    slug: 'economia-nicaragua-crecimiento-2026',
    titulo: 'Economía nicaragüense muestra signos de recuperación en 2026',
    resumen: 'Los indicadores macroeconómicos del primer trimestre muestran un crecimiento del 3.2% impulsado por el sector agropecuario.',
    contenido: '',
    categoria: 'Nacionales',
    imagen: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    autor: 'Economía NI',
    vistas: 1560,
    palabras: 520,
  },
  {
    id: '7',
    slug: 'mundo-onu-asamblea-general',
    titulo: 'Asamblea General de la ONU aborda crisis climática en sesión especial',
    resumen: 'Diplomáticos de más de 150 países se reúnen en Nueva York para discutir acuerdos vinculantes sobre reducción de emisiones.',
    contenido: '',
    categoria: 'Internacionales',
    imagen: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    autor: 'Internacionales NI',
    vistas: 760,
    palabras: 440,
  },
  {
    id: '8',
    slug: 'boxeo-nicaragua-campeonato-continental',
    titulo: 'Boxeador nicaragüense gana campeonato continental en peso pluma',
    resumen: 'El pugilista esteliano se coronó campeón tras una pelea de 10 asaltos en Panamá, clasificando al mundial.',
    contenido: '',
    categoria: 'Deportes',
    imagen: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&q=80',
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    autor: 'Deportes NI',
    vistas: 1890,
    palabras: 350,
  },
  {
    id: '9',
    slug: 'salud-minsa-vacunacion-campana',
    titulo: 'MINSA lanza campaña de vacunación contra influenza en todo el país',
    resumen: 'La jornada se extenderá durante todo mayo y busca inmunizar a grupos vulnerables incluyendo adultos mayores y niños.',
    contenido: '',
    categoria: 'Nacionales',
    imagen: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&q=80',
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    autor: 'Salud NI',
    vistas: 1120,
    palabras: 300,
  },
  {
    id: '10',
    slug: 'tecnologia-starlink-nicaragua',
    titulo: 'Starlink expande su cobertura a zonas rurales de Nicaragua',
    resumen: 'El servicio de internet satelital de Elon Musk ya está disponible en 45 comunidades del norte y centro del país.',
    contenido: '',
    categoria: 'Nacionales',
    imagen: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    autor: 'Tecnología NI',
    vistas: 4500,
    palabras: 400,
  },
];

function validateCount(count: number, defaultCount: number): number {
  if (typeof count !== 'number' || isNaN(count)) return defaultCount;
  if (count < 0) return defaultCount;
  if (count > MAX_COUNT) return MAX_COUNT;
  return count || defaultCount;
}

// =============================================================================
// Firebase Admin (opcional — si falla, usa mock)
// =============================================================================
async function tryFirebaseAdmin(count: number): Promise<Noticia[] | null> {
  try {
    const { adminDb } = await import('./firebase-admin');
    const snap = await adminDb
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(count)
      .get();
    
    return snap.docs.map((d: any) => {
      const data = d.data();
      return {
        id: d.id,
        slug: data.slug || d.id,
        titulo: data.titulo || '',
        resumen: data.resumen || '',
        contenido: data.contenido,
        categoria: data.categoria || 'General',
        imagen: data.imagen || '',
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '',
        autor: data.autor,
        destacada: data.destacada,
        vistas: data.vistas,
        palabras: data.palabras,
      };
    });
  } catch (err) {
    console.warn('[data.ts] Firebase Admin no disponible, usando mock data:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function getNews(count: number = DEFAULT_NEWS_COUNT): Promise<Noticia[]> {
  const validatedCount = validateCount(count, DEFAULT_NEWS_COUNT);
  
  // Intentar Firebase primero
  const firebaseNews = await tryFirebaseAdmin(validatedCount);
  if (firebaseNews && firebaseNews.length > 0) {
    return firebaseNews;
  }
  
  // Fallback: mock data (para que el sitio nunca se vea vacío)
  console.log('[data.ts] Usando mock data para noticias');
  return MOCK_NOTICIAS.slice(0, validatedCount);
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
      return snap.docs.map((d: any) => {
        const data = d.data();
        return {
          id: d.id,
          slug: data.slug || d.id,
          titulo: data.titulo || '',
          resumen: data.resumen || '',
          contenido: data.contenido,
          categoria: data.categoria || 'General',
          imagen: data.imagen || '',
          fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '',
          autor: data.autor,
          destacada: data.destacada,
          vistas: data.vistas,
          palabras: data.palabras,
        };
      });
    }
  } catch (err) {
    console.warn('[data.ts] Firebase Admin no disponible para más leídas, usando mock');
  }
  
  // Fallback: ordenar mock por vistas
  return [...MOCK_NOTICIAS]
    .sort((a, b) => (b.vistas || 0) - (a.vistas || 0))
    .slice(0, validatedCount);
}
