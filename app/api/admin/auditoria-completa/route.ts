import { getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || '';

const ADJETIVOS_PROHIBIDOS = [
  'tragico','tragica','terrible','impactante','impactantes','conmociono','conmocionó',
  'devastador','devastadora','horrible','alarmante','desgarrador','desgarradora',
  'lamentable','dramatico','dramatica','escalofriante','espeluznante','increible',
  'inimaginable','indignante','escandaloso','escandalosa','vergonzoso','vergonzosa',
  'aterrador','aterradora','mortifero','mortifera','sangriento','sangrienta',
  'brutal','brutales','salvaje','violento','violenta','agresivo','agresiva',
  'desastroso','desastrosa','funesto','funesta','siniestro','siniestra',
  'macabro','macabra','espantoso','espantosa','atroz','critico','critica',
  'morboso','grotesco','pavoroso','fatal','nefasto','sangre','muerto','muertos',
  'muerta','muertas','fallecido','fallecidos','fallecida','fallecidas','asesinato',
  'asesinado','asesinada','asesinos','secuestro','secuestrado','violacion',
  'violada','violaron','tortura','torturado','descuartizado','decapitado',
  'ahorcado','ahogado','incinerado','calcina','calcino'
];

const FRASES_PROHIBIDAS = [
  'según informes preliminares','fuentes policiales indicaron',
  'las autoridades confirmaron','la víctima fue identificada como',
  'según fuentes extraoficiales','de acuerdo a testigos presenciales',
  'hasta el cierre de esta edición','en circunstancias que se investigan',
  'por razones que se desconocen','por motivos que se desconocen'
];

const PALABRAS_SENSIBLES = [
  'muerto','muertos','muerta','muertas','asesinato','homicidio',
  'suicidio','secuestro','violacion','tortura','drogas','narcotrafico',
  'narco','cartel','sicario','ejecucion','ejecutado','decapitado',
  'descuartizado','incinerado','ahogado','ahorcado'
];

interface AnalisisNoticia {
  id: string;
  titulo: string;
  categoria: string;
  palabras: number;
  problemas: string[];
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  sugerencia: string;
}

function analizarNoticia(doc: any): AnalisisNoticia {
  const data = doc.data();
  const titulo = (data.titulo || '').toLowerCase();
  const contenido = (data.contenido || '').toLowerCase();
  const resumen = (data.resumen || '').toLowerCase();
  const textoCompleto = titulo + ' ' + resumen + ' ' + contenido;
  const palabras = contenido.split(/\s+/).length;
  const problemas: string[] = [];
  let nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO' = 'BAJO';

  // 1. Adjetivos emocionales
  const adjEncontrados = ADJETIVOS_PROHIBIDOS.filter(adj => textoCompleto.includes(adj));
  if (adjEncontrados.length > 0) {
    problemas.push(`Adjetivos emocionales: ${adjEncontrados.slice(0, 3).join(', ')}`);
  }

  // 2. Frases template
  const frasesEncontradas = FRASES_PROHIBIDAS.filter(fr => textoCompleto.includes(fr));
  if (frasesEncontradas.length > 0) {
    problemas.push(`Frases template: ${frasesEncontradas.join(', ')}`);
  }

  // 3. Contenido sensible
  const sensibles = PALABRAS_SENSIBLES.filter(p => textoCompleto.includes(p));
  if (sensibles.length > 0) {
    problemas.push(`Contenido sensible: ${sensibles.slice(0, 3).join(', ')}`);
  }

  // 4. Longitud
  if (palabras < 200) {
    problemas.push(`Muy corta: ${palabras} palabras (mínimo recomendado: 500)`);
  } else if (palabras < 400) {
    problemas.push(`Corta: ${palabras} palabras (recomendado: 500+)`);
  }

  // 5. Menores de edad
  if (/menor de edad|niño de \d|adolescente de \d|joven de 1[0-7]/i.test(contenido)) {
    const tieneNombre = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(contenido);
    if (tieneNombre) {
      problemas.push('Posible nombre de menor de edad visible');
    }
  }

  // 6. Sin H2
  const h2Count = (contenido.match(/<h2>/gi) || []).length;
  if (h2Count === 0) {
    problemas.push('Sin subtítulos H2 (estructura pobre)');
  }

  // 7. Sin citas con nombre y cargo
  if (!/testigo|vecino|habitante|residente|oficial|comisionado|director|vocero/.test(contenido)) {
    problemas.push('Sin citas con nombre y cargo (falta autoridad)');
  }

  // 8. Sin recursos útiles
  if (!/118|128|115|133|denunciar|emergencia|prevencion/.test(contenido)) {
    problemas.push('Sin recursos útiles (teléfonos, consejos, prevención)');
  }

  // 9. Sin contexto/estadísticas
  if (!/año pasado|en 202|estadistica|comparado|incremento|disminuyo|segun datos/.test(contenido)) {
    problemas.push('Sin contexto ni datos comparativos');
  }

  // 10. Título sensacionalista
  if (/!{2,}/.test(data.titulo || '')) {
    problemas.push('Título con múltiples signos de exclamación');
  }

  // Determinar nivel de riesgo
  const score = problemas.length;
  if (score >= 6) nivelRiesgo = 'CRITICO';
  else if (score >= 4) nivelRiesgo = 'ALTO';
  else if (score >= 2) nivelRiesgo = 'MEDIO';

  // Sugerencia
  let sugerencia = '';
  if (nivelRiesgo === 'CRITICO') {
    sugerencia = 'REESCRIBIR COMPLETAMENTE: Eliminar adjetivos, agregar H2, contexto, recursos útiles, citas con nombre+cargo';
  } else if (nivelRiesgo === 'ALTO') {
    sugerencia = 'EDITAR: Agregar subtítulos H2, contexto estadístico, recursos útiles, eliminar lenguaje emocional';
  } else if (nivelRiesgo === 'MEDIO') {
    sugerencia = 'MEJORAR: Expandir contenido a 500+ palabras, agregar recursos de prevención';
  } else {
    sugerencia = 'APROBABLE: Pequeños ajustes opcionales';
  }

  return {
    id: doc.id,
    titulo: data.titulo || '(sin título)',
    categoria: data.categoria || 'Sin categoría',
    palabras,
    problemas,
    nivelRiesgo,
    sugerencia,
  };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const secretFromHeader = authHeader.replace('Bearer ', '').trim();
    const { searchParams } = new URL(request.url);
    const secretFromQuery = searchParams.get('secret') || '';
    const providedSecret = secretFromHeader || secretFromQuery;

    if (!providedSecret || (CRON_SECRET && providedSecret !== CRON_SECRET)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const db = getAdminDb();
    const body = await request.json().catch(() => ({}));
    const categoriaFiltro = body.categoria || 'Sucesos';
    const limite = body.limite || 100;

    // Obtener noticias de la categoría
    const snap = await db
      .collection('noticias')
      .where('categoria', '==', categoriaFiltro)
      .limit(limite)
      .get();

    if (snap.empty) {
      return NextResponse.json({
        success: true,
        message: `No hay noticias de ${categoriaFiltro}`,
        total: 0,
      });
    }

    const analisis: AnalisisNoticia[] = [];
    snap.docs.forEach((doc) => {
      analisis.push(analizarNoticia(doc));
    });

    // Estadísticas
    const stats = {
      total: analisis.length,
      critico: analisis.filter(a => a.nivelRiesgo === 'CRITICO').length,
      alto: analisis.filter(a => a.nivelRiesgo === 'ALTO').length,
      medio: analisis.filter(a => a.nivelRiesgo === 'MEDIO').length,
      bajo: analisis.filter(a => a.nivelRiesgo === 'BAJO').length,
    };

    // Top 20 más problemáticas
    const masCriticas = analisis
      .filter(a => a.nivelRiesgo === 'CRITICO' || a.nivelRiesgo === 'ALTO')
      .sort((a, b) => b.problemas.length - a.problemas.length)
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      categoria: categoriaFiltro,
      estadisticas: stats,
      topProblematicas: masCriticas,
      todas: analisis,
      resumen: `${stats.critico} CRÍTICAS | ${stats.alto} ALTAS | ${stats.medio} MEDIAS | ${stats.bajo} BAJAS`,
    });
  } catch (err: any) {
    console.error('[admin/auditoria-completa] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno' },
      { status: 500 }
    );
  }
}
