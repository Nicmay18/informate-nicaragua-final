import { getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || '';

// Reemplazos en CONTENIDO (cuerpo, título, resumen)
const REEMPLAZOS: Array<[RegExp, string]> = [
  // Muerte explícita
  [/\bfalleci[oó]\b/gi, 'resultó afectado'],
  [/\bfallecieron\b/gi, 'resultaron afectados'],
  [/\bfallecida\b/gi, 'resultó afectada'],
  [/\bfallecidas\b/gi, 'resultaron afectadas'],
  [/\bfallecido\b/gi, 'afectado'],
  [/\bfallecidos\b/gi, 'afectados'],
  [/\bfallecimiento\b/gi, 'afectación'],
  [/\bmuri[oó]\b/gi, 'resultó afectado'],
  [/\bmurieron\b/gi, 'resultaron afectados'],
  [/\bmuerta\b/gi, 'afectada'],
  [/\bmuerto\b/gi, 'afectado'],
  [/\bmuertos\b/gi, 'afectados'],
  [/\bvíctima\b/gi, 'persona afectada'],
  [/\bvíctimas\b/gi, 'personas afectadas'],
  [/\bvictima\b/gi, 'persona afectada'],
  [/\bvictimas\b/gi, 'personas afectadas'],
  [/\bperdió\s+la\s+vida\b/gi, 'resultó afectado'],
  [/\bperdieron\s+la\s+vida\b/gi, 'resultaron afectados'],
  [/\bcobró\s+la\s+vida\b/gi, 'afectó'],
  [/\bsin\s+vida\b/gi, 'afectada'],
  [/\bcad[aá]ver\b/gi, 'persona'],
  [/\bocciso\b/gi, 'persona'],
  [/\boccisos\b/gi, 'personas'],
  // Heridas
  [/\bherido\b/gi, 'afectado'],
  [/\bheridos\b/gi, 'afectados'],
  [/\bherida\b/gi, 'afectada'],
  [/\bheridas\b/gi, 'afectadas'],
  [/\blesionado\b/gi, 'afectado'],
  [/\blesionados\b/gi, 'afectados'],
  [/\blesionada\b/gi, 'afectada'],
  [/\blesionadas\b/gi, 'afectadas'],
  // Adjetivos emocionales
  [/\bsangre\b/gi, 'incidente'],
  [/\bsangriento\b/gi, 'grave'],
  [/\bsangrienta\b/gi, 'grave'],
  [/\btrágico\b/gi, 'registrado'],
  [/\btrágica\b/gi, 'registrada'],
  [/\btrágicc?amente\b/gi, 'gravemente'],
  [/\blamentable\b/gi, 'ocurrido'],
  [/\bdramático\b/gi, 'significativo'],
  [/\bdramática\b/gi, 'significativa'],
  [/\bhorrible\b/gi, 'grave'],
  [/\bterrible\b/gi, 'grave'],
  [/\bimpactante\b/gi, 'notorio'],
  [/\bespantoso\b/gi, 'grave'],
  [/\bmacabro\b/gi, 'inusual'],
  [/\bnefasto\b/gi, 'negativo'],
  [/\bfatal\b/gi, 'grave'],
  [/\bfatales\b/gi, 'graves'],
  // Siniestro (sin \b para asegurar captura en cualquier contexto)
  [/siniestro/gi, 'incidente'],
  [/siniestra/gi, 'incidente'],
  [/siniestros/gi, 'incidentes'],
  [/siniestras/gi, 'incidentes'],
  // Incendios
  [/\bcalcin[aó]\b/gi, 'afecta'],
  [/\bcalcinaron\b/gi, 'afectaron'],
  [/\bcalcinado\b/gi, 'afectado'],
  [/\bcalcinados\b/gi, 'afectados'],
  [/\bquema\b/gi, 'afecta'],
  [/\bquemaron\b/gi, 'afectaron'],
  [/\bquemada\b/gi, 'afectada'],
  [/\bquemadas\b/gi, 'afectadas'],
  [/\bquemaduras\b/gi, 'afectaciones'],
  [/\bquemado\b/gi, 'afectado'],
  [/\bquemados\b/gi, 'afectados'],
  // Violencia
  [/\bbrutal\b/gi, 'grave'],
  [/\bbrutalmente\b/gi, 'gravemente'],
  [/\bviolentamente\b/gi, 'de forma abrupta'],
  [/\bviolento\b/gi, 'grave'],
  [/\bviolentos\b/gi, 'graves'],
  [/\bviolenta\b/gi, 'grave'],
  [/\bviolentas\b/gi, 'graves'],
  // Ahogados
  [/\bahogado\b/gi, 'afectado'],
  [/\bahogados\b/gi, 'afectados'],
  [/\bahogada\b/gi, 'afectada'],
  [/\bahogadas\b/gi, 'afectadas'],
  // Electrocutado
  [/\belectrocutado\b/gi, 'afectado por descarga eléctrica'],
  [/\belectrocutados\b/gi, 'afectados por descarga eléctrica'],
  // Lenguaje policial genérico (reemplazar, no eliminar)
  [/\bautoridades\s+investigan\b/gi, 'Nicaragua Informate intentó obtener versión oficial'],
  [/\bse\s+realizan\s+las\s+investigaciones\s+correspondientes\b/gi, 'se recabaron versiones del hecho'],
  [/\bhasta\s+el\s+momento\s+no\s+hay\s+detenidos\b/gi, 'no se reportaron personas retenidas'],
  [/\bhasta\s+el\s+momento\s+no\s+se\s+reportan\s+detenidos\b/gi, 'no se reportaron personas retenidas'],
  // Víctima como objeto
  [/\bla\s+víctima\b/gi, 'la persona afectada'],
  [/\bel\s+fallecido\b/gi, 'la persona'],
  [/\bel\s+occiso\b/gi, 'la persona'],
];

// Reemplazos en TÍTULOS (palabra completa)
const REEMPLAZOS_TITULO: Record<string, string> = {
  'muerto': 'afectado', 'muertos': 'afectados',
  'muerta': 'afectada', 'muertas': 'afectadas',
  'muere': 'resulta afectado', 'mueren': 'resultan afectados',
  'fallecido': 'afectado', 'fallecidos': 'afectados',
  'fallecida': 'afectada', 'fallecidas': 'afectadas',
  'fallece': 'resulta afectado', 'fallecen': 'resultan afectados',
  'siniestro': 'incidente', 'siniestros': 'incidentes',
  'sangriento': 'grave', 'sangrienta': 'grave',
  'brutal': 'grave', 'brutalmente': 'gravemente',
  'violento': 'grave', 'violenta': 'grave',
  'masacre': 'incidente múltiple', 'matanza': 'incidente',
  'asesinado': 'víctima fatal', 'asesinada': 'víctima fatal',
  'cuerpo': 'persona', 'cadáver': 'persona fallecida',
  'fatal': 'grave',
  'cobre vida': 'afecta', 'cobró vida': 'afecta', 'cobraron vida': 'afectan', 'cobra vida': 'afecta',
  'a tiros': 'con violencia', 'tiroteo': 'incidente armado',
  'fallecimiento': 'afectación',
  'quemar': 'agredir', 'quemó': 'agredió',
  'ahogado': 'afectado', 'ahogados': 'afectados',
  'ahogada': 'afectada', 'ahogadas': 'afectadas',
  'lesionado': 'afectado', 'lesionados': 'afectados',
  'lesionada': 'afectada', 'lesionadas': 'afectadas',
  'herido': 'afectado', 'heridos': 'afectados',
  'herida': 'afectada', 'heridas': 'afectadas',
};

function limpiarContenido(html: string): { texto: string; cambios: number } {
  let resultado = html;
  let cambios = 0;

  // Reemplazos LITERALES simples (sin regex, garantizado)
  const LITERALES: Array<[string, string]> = [
    ['siniestra', 'grave'],
    ['siniestro', 'incidente'],
    ['siniestros', 'incidentes'],
    ['siniestras', 'incidentes'],
    ['calcina', 'afecta'],
    ['calcinaron', 'afectaron'],
    ['calcinado', 'afectado'],
    ['calcinados', 'afectados'],
    ['fatal', 'grave'],
    ['fatales', 'graves'],
    ['violento', 'grave'],
    ['violentos', 'graves'],
    ['violenta', 'grave'],
    ['violentas', 'graves'],
    ['sangriento', 'grave'],
    ['sangrienta', 'grave'],
    ['herido', 'afectado'],
    ['heridos', 'afectados'],
    ['herida', 'afectada'],
    ['heridas', 'afectadas'],
    ['lesionado', 'afectado'],
    ['lesionados', 'afectados'],
    ['lesionada', 'afectada'],
    ['lesionadas', 'afectadas'],
    ['fallecido', 'afectado'],
    ['fallecidos', 'afectados'],
    ['fallecida', 'afectada'],
    ['fallecidas', 'afectadas'],
    ['fallecimiento', 'afectación'],
    ['muerto', 'afectado'],
    ['muertos', 'afectados'],
    ['muerta', 'afectada'],
    ['muertas', 'afectadas'],
    ['trágico', 'registrado'],
    ['trágica', 'registrada'],
    ['lamentable', 'ocurrido'],
    ['dramático', 'significativo'],
    ['dramática', 'significativa'],
    ['horrible', 'grave'],
    ['terrible', 'grave'],
    ['impactante', 'notorio'],
    ['espantoso', 'grave'],
    ['macabro', 'inusual'],
    ['nefasto', 'negativo'],
    ['brutal', 'grave'],
    ['brutalmente', 'gravemente'],
    ['violentamente', 'de forma abrupta'],
    ['ahogado', 'afectado'],
    ['ahogados', 'afectados'],
    ['ahogada', 'afectada'],
    ['ahogadas', 'afectadas'],
    ['quemaduras', 'afectaciones'],
    ['quemado', 'afectado'],
    ['quemados', 'afectados'],
    ['quemada', 'afectada'],
    ['quemadas', 'afectadas'],
    ['electrocutado', 'afectado por descarga eléctrica'],
    ['electrocutados', 'afectados por descarga eléctrica'],
    ['cadáver', 'persona'],
    ['occiso', 'persona'],
    ['occisos', 'personas'],
    ['víctima', 'persona afectada'],
    ['víctimas', 'personas afectadas'],
    ['autoridades investigan', 'Nicaragua Informate intentó obtener versión oficial'],
  ];

  for (const [mala, buena] of LITERALES) {
    const antes = resultado;
    resultado = resultado.split(mala).join(buena);
    resultado = resultado.split(mala.charAt(0).toUpperCase() + mala.slice(1)).join(buena.charAt(0).toUpperCase() + buena.slice(1));
    if (resultado !== antes) cambios++;
  }

  // Regex para frases y variantes con tildes/acentos
  for (const [regex, reemplazo] of REEMPLAZOS) {
    const antes = resultado;
    resultado = resultado.replace(regex, reemplazo);
    if (resultado !== antes) cambios++;
  }
  // Deduplicar "afectado afectado"
  resultado = resultado.replace(/\b(afectado|afectados|afectada|afectadas)\s+\1\b/gi, '$1');
  resultado = resultado.replace(/\bresultan afectados afectados\b/gi, 'resultan afectados');
  resultado = resultado.replace(/\bresulta afectado afectado\b/gi, 'resulta afectado');
  resultado = resultado.replace(/\bresultan afectadas afectadas\b/gi, 'resultan afectadas');
  return { texto: resultado, cambios };
}

function limpiarTitulo(titulo: string): string {
  let limpio = titulo;
  for (const [mala, buena] of Object.entries(REEMPLAZOS_TITULO)) {
    const regex = new RegExp('\\b' + mala + '\\b', 'gi');
    limpio = limpio.replace(regex, buena);
  }
  // Deduplicar "Dos afectados y tres afectados"
  const numeros = 'un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce';
  limpio = limpio.replace(
    new RegExp('\\b(' + numeros + '|\\d+)\\s+(afectados|afectadas|afectado|afectada)\\s+y\\s+(' + numeros + '|\\d+)\\s+\\2\\b', 'gi'),
    '$1 $2 y $3 personas $2'
  );
  limpio = limpio.replace(/!{2,}/g, '!');
  return limpio;
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

    // Buscar TODAS las noticias, no solo sucesos
    const snap = await db.collection('noticias').limit(200).get();

    const procesadas: Array<{ id: string; titulo: string; cambios: string[] }> = [];
    const sinCambios: Array<{ id: string; titulo: string }> = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      const titulo = data.titulo || '';
      const contenido = data.contenido || '';
      const resumen = data.resumen || '';

      const cambios: string[] = [];
      let nuevoTitulo = titulo;
      let nuevoContenido = contenido;
      let nuevoResumen = resumen;

      // Limpiar título
      const tituloLimpio = limpiarTitulo(titulo);
      if (tituloLimpio !== titulo) {
        nuevoTitulo = tituloLimpio;
        cambios.push('Título');
      }

      // Limpiar contenido
      const { texto: contenidoLimpio, cambios: cambiosContenido } = limpiarContenido(contenido);
      if (cambiosContenido > 0) {
        nuevoContenido = contenidoLimpio;
        cambios.push(`Contenido (${cambiosContenido} reemplazos)`);
      }

      // Limpiar resumen
      const { texto: resumenLimpio, cambios: cambiosResumen } = limpiarContenido(resumen);
      if (cambiosResumen > 0) {
        nuevoResumen = resumenLimpio;
        cambios.push('Resumen');
      }

      if (cambios.length > 0) {
        await doc.ref.update({
          titulo: nuevoTitulo,
          contenido: nuevoContenido,
          resumen: nuevoResumen,
          _contenidoLimpiado: true,
          _fechaLimpieza: new Date().toISOString(),
        });
        procesadas.push({ id: doc.id, titulo: nuevoTitulo || titulo, cambios });
      } else {
        sinCambios.push({ id: doc.id, titulo });
      }
    }

    return NextResponse.json({
      success: true,
      totalRevisadas: snap.docs.length,
      procesadas: { cantidad: procesadas.length, noticias: procesadas },
      sinCambios: { cantidad: sinCambios.length },
      resumen: `Revisadas: ${snap.docs.length} | Procesadas: ${procesadas.length} | Sin cambios: ${sinCambios.length}`,
    });
  } catch (err: any) {
    console.error('[admin/limpiar-palabras-sensibles] Error:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
