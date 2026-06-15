import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

interface NoticiaDoc {
  titulo?: string;
  categoria?: string;
  contenido?: string;
  fecha?: Timestamp;
  slug?: string;
  resumen?: string;
}

const trendingTopics = [
  { tema: 'Sucesos / Crimen organizado', demanda: 'Alta', competencia: 'Media' },
  { tema: 'Deportes / Fútbol nicaragüense', demanda: 'Alta', competencia: 'Baja' },
  { tema: 'Economía / Precios combustible', demanda: 'Muy Alta', competencia: 'Media' },
  { tema: 'Elecciones / Política local', demanda: 'Alta', competencia: 'Alta' },
  { tema: 'Turismo / Playas de Nicaragua', demanda: 'Media', competencia: 'Baja' },
  { tema: 'Salud / Dengue / Epidemias', demanda: 'Alta', competencia: 'Media' },
];

const planSemanal = [
  { dia: 'Lunes', tarea: 'Publicar 2 noticias (mañana 8am). Reclamar Publisher Center.', tiempo: '2h' },
  { dia: 'Martes', tarea: 'Crear 1 guía evergreen. Compartir 3 noticias en redes.', tiempo: '3h' },
  { dia: 'Miércoles', tarea: 'Publicar 2 noticias. Optimizar imágenes de noticia más vista.', tiempo: '2h' },
  { dia: 'Jueves', tarea: 'Outreach: contactar 2 medios para backlinks. Revisar Search Console.', tiempo: '2h' },
  { dia: 'Viernes', tarea: 'Publicar 2 noticias + 1 análisis de fin de semana.', tiempo: '2h' },
  { dia: 'Sábado', tarea: 'Publicar contenido ligero (espectáculos/deportes). Testear horario 10am.', tiempo: '1h' },
  { dia: 'Domingo', tarea: 'Revisar analytics. Planificar semana siguiente.', tiempo: '1h' },
];

function generarPromptEditorial(temaSugerido: string): string {
  return `Eres un editor senior de Nicaragua Informate. Escribe una noticia optimizada para Google Discover y Google News sobre: ${temaSugerido}

REGLAS:
1. Titular: Máximo 60 caracteres. Emoción o curiosidad + información. Ej: "Amanda Miguel regresa a Nicaragua: esto cobra por concierto privado"
2. Primer párrafo: Responde Quién, Qué, Cuándo, Dónde en 40 palabras.
3. Imagen: Sugiere una foto original, no genérica. Debe tener rostros humanos o acción.
4. Longitud: 600-900 palabras.
5. Subtítulos H2 cada 150 palabras.
6. Incluye 1 cita o dato exclusivo.
7. Meta descripción: 150 caracteres con call-to-action.
8. Etiquetas: 3-5 keywords relevantes para Nicaragua.

FORMATO: Devuelve título, meta descripción, cuerpo completo y sugerencia de imagen.`;
}

function detectarGaps(noticias: NoticiaDoc[]) {
  const total = noticias.length;
  const conImagen = noticias.filter(n => n.resumen?.includes('img') || n.contenido?.includes('<img')).length; // aprox
  const porCategoria: Record<string, number> = {};
  noticias.forEach(n => {
    const cat = n.categoria || 'General';
    porCategoria[cat] = (porCategoria[cat] || 0) + 1;
  });

  const tieneEvergreen = total > 50; // heurística: si tiene +50, asumimos algo evergreen
  const gaps = [
    {
      oportunidad: 'Noticias con titulares optimizados para Discover',
      problema: 'Los titulares son descriptivos pero no generan curiosidad',
      accion: 'A/B test: Titular emocional vs descriptivo en 2 noticias/similares',
      impacto: 'Alto'
    },
    {
      oportunidad: 'Contenido evergreen (guías, historia, análisis)',
      problema: `Solo ${total} noticias, poco contenido permanente`,
      accion: 'Crear 5 guías evergreen: "Historia del Canal de Nicaragua", "Guía de playas 2026", etc.',
      impacto: 'Muy Alto'
    },
    {
      oportunidad: 'Imágenes de alto impacto para Google Discover',
      problema: 'Las imágenes son funcionales pero no "thumb-stopping"',
      accion: 'Usar fotos originales, rostros humanos, emociones. Evitar genéricas.',
      impacto: 'Alto'
    },
    {
      oportunidad: 'Publicación en horarios pico',
      problema: 'Sin datos de cuándo publica tu audiencia',
      accion: 'Publicar 7-9am y 6-8pm (horario Nicaragua). Testear fines de semana.',
      impacto: 'Medio'
    },
    {
      oportunidad: 'Newsletter + Push notifications',
      problema: 'Sin canal directo de retención de lectores',
      accion: 'Implementar popup suscripción + notificaciones push (OneSignal)',
      impacto: 'Muy Alto'
    },
    {
      oportunidad: 'Redes sociales como canal de tráfico',
      problema: 'Sin distribución activa fuera de Google',
      accion: 'Crear cuenta en X/Twitter, Facebook Page, WhatsApp Channel. Compartir cada noticia.',
      impacto: 'Alto'
    },
    {
      oportunidad: 'Google Publisher Center',
      problema: 'Medio no reclamado en Google News',
      accion: 'Ir a publishercenter.google.com → Reclamar nicaraguainformate.com',
      impacto: 'Crítico'
    },
    {
      oportunidad: 'Backlinks de otros medios',
      problema: 'Sin enlaces entrantes = baja autoridad de dominio',
      accion: 'Contactar 5 medios centroamericanos para intercambio de enlaces o citas.',
      impacto: 'Alto'
    },
  ];

  return { gaps, porCategoria, total, conImagen };
}

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();

    const noticias: NoticiaDoc[] = snap.docs.map(d => d.data() as NoticiaDoc);
    const ultimosTitulos = noticias.slice(0, 10).map(n => n.titulo || 'Sin título');

    const { gaps, porCategoria, total } = detectarGaps(noticias);

    const hoy = new Date();
    const diaSemana = hoy.toLocaleDateString('es-NI', { weekday: 'long' });
    const fecha = hoy.toLocaleDateString('es-NI');

    const tareaHoy = planSemanal.find(p => p.dia.toLowerCase() === diaSemana.toLowerCase());

    // Tema sugerido basado en día de la semana (rotativo)
    const temasSugeridos = [
      'Sucesos de última hora en Managua',
      'Análisis económico de Nicaragua',
      'Deportes nicaragüenses',
      'Cultura y tradiciones nicaragüenses',
      'Salud pública en Nicaragua',
      'Política y elecciones en Nicaragua',
      'Turismo en playas de Nicaragua',
      'Tecnología y startups en Centroamérica',
    ];
    const temaDelDia = temasSugeridos[hoy.getDay() % temasSugeridos.length];

    const objetivos = [
      { metrica: 'Noticias publicadas', actual: total, meta: total + 40, como: '2 noticias/día' },
      { metrica: 'Guías evergreen', actual: 0, meta: 5, como: '1 por semana' },
      { metrica: 'Suscripciones newsletter', actual: 'N/A', meta: 500, como: 'Popup + lead magnet' },
      { metrica: 'Visitas diarias', actual: 'N/A', meta: 1000, como: 'SEO + redes + Discover' },
      { metrica: 'Backlinks nuevos', actual: 'N/A', meta: 10, como: 'Outreach semanal' },
      { metrica: 'Google News indexado', actual: 'Pendiente', meta: 'Aprobado', como: 'Publisher Center + calidad' },
    ];

    const reporte = {
      fecha: new Date().toISOString(),
      fechaLocal: fecha,
      diaSemana,
      dominio: 'nicaraguainformate.com',
      noticiasExistentes: total,
      ultimosTitulos,
      trendingTopics,
      gaps,
      planSemanal,
      tareaHoy: tareaHoy || null,
      objetivos,
      promptEditorial: generarPromptEditorial(temaDelDia),
      temaDelDia,
      distribucionCategorias: porCategoria,
    };

    // Guardar en Firestore para persistencia diaria
    await db.collection('reportes_crecimiento').doc('ultimo').set(reporte);
    await db.collection('reportes_crecimiento').add({ ...reporte, archivado: true });

    return NextResponse.json(reporte);
  } catch (err) {
    console.error('[admin/crecimiento]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
