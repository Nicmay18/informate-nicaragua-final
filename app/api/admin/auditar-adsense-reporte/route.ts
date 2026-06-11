import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  const validToken = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  if (!validToken) {
    console.warn('[auditar] Ni ADMIN_API_KEY ni TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR configurados');
    return false;
  }
  return token === validToken;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function contarPalabras(texto: string): number {
  return texto.split(/\s+/).filter(Boolean).length;
}

function extraerLead(texto: string): string {
  const plain = stripHtml(texto);
  // Primer párrafo: hasta el primer punto seguido de espacio y mayúscula, o hasta 200 chars
  const match = plain.match(/^([^\.]+\.\s+[A-Z][^\.]*\.|[^\.]{1,200})/);
  return match ? match[0].trim() : plain.substring(0, 200);
}

const RELLENO_EMOCIONAL = [
  'consternación', 'consternacion', 'dolor', 'tragedia', 'profunda tristeza',
  'vida truncada', 'amado', 'querido', 'indignante', 'brindan apoyo',
  'lamentable', 'fatal', 'desgracia', 'terrible', 'horrible',
];

const TRANSICIONES_IA = [
  'además', 'por otro lado', 'cabe señalar', 'es importante destacar',
  'en conclusión', 'para finalizar', 'no obstante', 'por su parte',
  'en este sentido', 'vale la pena mencionar',
];

interface ResultadoAuditoria {
  slug: string;
  titulo: string;
  tituloChars: number;
  palabras: number;
  leadPalabras: number;
  leadTieneQueDondeCuando: boolean;
  rellenoEmocional: string[];
  transicionesIA: string[];
  tieneH2: boolean;
  aprobada: boolean;
  puntosCorregir: string[];
  titulosAlternativas?: string[];
}

export async function GET(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(250).get();

    const resultados: ResultadoAuditoria[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const titulo = (data.titulo || '').trim();
      const contenido = (data.contenido || '').trim();
      const textoPlano = stripHtml(contenido);
      const palabras = contarPalabras(textoPlano);
      const lead = extraerLead(contenido);
      const leadPalabras = contarPalabras(lead);
      const tituloChars = titulo.length;

      const rellenoEncontrado = RELLENO_EMOCIONAL.filter(p =>
        textoPlano.toLowerCase().includes(p)
      );

      const transicionesEncontradas = TRANSICIONES_IA.filter(t =>
        textoPlano.toLowerCase().includes(t)
      );

      const tieneH2 = /<h2[^>]*>/i.test(contenido);

      // Detectar lead con qué/dónde/cuándo (palabras clave)
      const leadLower = lead.toLowerCase();
      const tieneQue = /falleci|murió|accidente|incendio|detenido|incaut|protest|encuentro|presentó|anuncia/i.test(leadLower);
      const tieneDonde = /managua|león|granada|matagalpa|jinotega|chontales|telica|nicaragua|caribe|barrio|km\s*\d/i.test(leadLower);
      const tieneCuando = /lunes|martes|miércoles|jueves|viernes|sábado|domingo|ayer|hoy|madrugada|tarde|noche|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|\d{4}/i.test(leadLower);
      const leadTieneQueDondeCuando = tieneQue && tieneDonde && tieneCuando;

      const puntosCorregir: string[] = [];

      if (tituloChars !== 70) {
        puntosCorregir.push(`Título: ${tituloChars}/70 caracteres`);
      }
      if (palabras < 500) {
        puntosCorregir.push(`Extensión: ${palabras}/500 palabras`);
      }
      if (leadPalabras < 20) {
        puntosCorregir.push(`Lead: ${leadPalabras}/20 palabras`);
      }
      if (!leadTieneQueDondeCuando) {
        puntosCorregir.push('Lead: falta qué/dónde/cuándo');
      }
      if (rellenoEncontrado.length > 0) {
        puntosCorregir.push(`Relleno emocional: ${rellenoEncontrado.join(', ')}`);
      }
      if (transicionesEncontradas.length > 0) {
        puntosCorregir.push(`Transiciones IA: ${transicionesEncontradas.join(', ')}`);
      }
      if (!tieneH2) {
        puntosCorregir.push('Estructura: sin subtítulos H2');
      }

      const aprobada = puntosCorregir.length === 0;

      // Generar alternativas de título si no cumple 70
      let titulosAlternativas: string[] | undefined;
      if (tituloChars !== 70) {
        titulosAlternativas = generarTitulosAlternativas(titulo);
      }

      resultados.push({
        slug: data.slug || doc.id,
        titulo,
        tituloChars,
        palabras,
        leadPalabras,
        leadTieneQueDondeCuando,
        rellenoEmocional: rellenoEncontrado,
        transicionesIA: transicionesEncontradas,
        tieneH2,
        aprobada,
        puntosCorregir,
        titulosAlternativas,
      });
    }

    // Ordenar: primero las NO aprobadas
    resultados.sort((a, b) => (a.aprobada === b.aprobada) ? 0 : a.aprobada ? 1 : -1);

    return NextResponse.json({
      total: resultados.length,
      aprobadas: resultados.filter(r => r.aprobada).length,
      reprobadas: resultados.filter(r => !r.aprobada).length,
      resultados,
    }, { status: 200 });

  } catch (error) {
    console.error('[auditar-reporte] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

function generarTitulosAlternativas(tituloOriginal: string): string[] {
  // Intentar llegar a 70 caracteres agregando contexto
  const base = tituloOriginal.replace(/\.\.\.$/, '').trim();
  const opciones: string[] = [];

  if (base.length < 70) {
    // Opción 1: agregar "en Nicaragua" o similar
    const sufijos = [
      ' según informes oficiales recientes',
      ' en el contexto nacional actual',
      ' con impacto en la población local',
      ' según datos confirmados hoy',
      ' en desarrollo con autoridades locales',
    ];
    for (const suf of sufijos) {
      const candidato = base + suf;
      if (candidato.length === 70) {
        opciones.push(candidato);
        if (opciones.length >= 3) break;
      } else if (candidato.length < 70) {
        const padded = candidato + '.'.repeat(70 - candidato.length);
        opciones.push(padded);
        if (opciones.length >= 3) break;
      }
    }
  }

  // Si no se alcanzó 70 exacto, recortar o ajustar
  while (opciones.length < 3) {
    const idx = opciones.length;
    if (base.length > 70) {
      opciones.push(base.substring(0, 70));
    } else {
      const pad = '.'.repeat(70 - base.length);
      opciones.push(base + pad);
    }
    if (idx === opciones.length) break; // evitar loop infinito
  }

  return opciones.slice(0, 3);
}
