/**
 * Capa de confianza editorial — independiente del score MENI.
 *
 * Clasifica las afirmaciones de una nota en categorías semánticas
 * auditables. NO produce un número de "calidad": produce evidencia.
 *
 *   HECHOS               afirmaciones presentadas como factual
 *   ATRIBUCIONES         afirmaciones atribuidas a persona/institución/fuente
 *   INFORMACION_NO_CONFIRMADA  lenguaje provisional ("presuntamente", "al parecer")
 *   INFORMACION_NO_DISPONIBLE  información honestamente no disponible
 *   RIESGO_EDITORIAL     afirmación sensible sin atribución cercana
 *   CONTRADICCION        señales incompatibles dentro del texto
 *   FUENTE               entidades de origen detectadas
 *
 * Es determinista (heurísticas lingüísticas) y deliberadamente conservador:
 * lo que no puede afirmar, lo marca para revisión humana.
 */

export type TrustLevel = 'ALTA' | 'MEDIA' | 'BAJA';

export interface TrustFinding {
  text: string;
  detail?: string;
}

export interface TrustReport {
  hechos: TrustFinding[];
  atribuciones: TrustFinding[];
  noConfirmada: TrustFinding[];
  noDisponible: TrustFinding[];
  riesgos: TrustFinding[];
  contradicciones: TrustFinding[];
  fuentes: string[];
  nivel: TrustLevel;
  requiereRevisionHumana: boolean;
  resumen: string;
}

const RE_ATRIBUCION = /\b(según|de acuerdo con|informó|informaron|confirmó|confirmaron|dijo|dijeron|señaló|señalaron|reportó|reportaron|afirmó|declaró|explicó|indicó|precisó|detalló|anunció)\b/i;
const RE_NO_CONFIRMADA = /\b(presuntamente|al parecer|reportes no confirmados|trascendió|versiones preliminares|se rumora|habría|supuestamente)\b/i;
const RE_NO_DISPONIBLE = /\b(se investiga|investigación en curso|se desconoce|no se sabe|no han informado|sin pronunciamiento|aún no se ha confirmado|pendiente de confirmar|no proporcionaron|no se ha revelado|hasta el momento no)\b/i;
const RE_SUCESO = /\b(asesin|homicidio|falleci|muert|deten|arrest|acusad|señalad|sospech|víctima|delito|robo|violencia|balacera|apuñal|atropell)\w*/i;
const RE_DELITO_AFIRMADO = /\b(asesinó|mató|robó|violó|estafó|secuestró|atropelló)\b/i;
const RE_NOMBRE_PROPIO = /\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,2}\b/g;
const RE_FUENTE = /\b(Policía Nacional|Ministerio Público|Corte Suprema|INIFOM|MINSA|Bomberos|INTA|INETER|MTI|Fiscalía|Conapred|CNU|INSS|CSE|SERENE|Alcaldía|Gobierno|CNN|Reuters|AP|EFE|AFP|BBC|ONU|OEA|OIM|UNICEF|OPS|OMS|Banco Central|BCN)\b/g;
const RE_FECHA = /\b(\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|(lunes|martes|miércoles|jueves|viernes|sábado|domingo) \d{1,2}|ayer|hoy|esta (mañana|tarde|noche)|\d{4})\b/i;
const RE_LUGAR = /\b(Managua|León|Granada|Masaya|Chinandega|Matagalpa|Estelí|Jinotega|Nueva Segovia|Rivas|Chontales|Boaco|Carazo|Río San Juan|Siuna|Rosita|Bonanza|Bilwi|Puerto Cabezas|Waspán|Bluefields|Corn Island|Caribe (Norte|Sur)|RAAN|RAAS|Tipitapa|Jinotepe|Diriamba|Ocotal|Somoto|Juigalpa|San Carlos|Nindirí|Niquinohomo|Catarina|Ticuantepe|Ciudad Sandino)\b/g;

function sentences(html: string): string[] {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ');
  return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 25);
}

/**
 * Analiza una nota y produce el reporte de confianza editorial.
 */
export function analyzeTrust(input: {
  titulo: string;
  cuerpo: string;
  categoria?: string;
}): TrustReport {
  const sents = sentences(`${input.titulo}. ${input.cuerpo}`);

  const hechos: TrustFinding[] = [];
  const atribuciones: TrustFinding[] = [];
  const noConfirmada: TrustFinding[] = [];
  const noDisponible: TrustFinding[] = [];
  const riesgos: TrustFinding[] = [];
  const contradicciones: TrustFinding[] = [];
  const fuentes = new Set<string>();

  for (const s of sents) {
    const atribuida = RE_ATRIBUCION.test(s);
    const provisional = RE_NO_CONFIRMADA.test(s);
    const noDisponibleHit = RE_NO_DISPONIBLE.test(s);
    const esSuceso = RE_SUCESO.test(s);

    for (const m of s.matchAll(RE_FUENTE)) fuentes.add(m[0]);

    if (noDisponibleHit) {
      // Información honestamente no disponible: se registra, nunca se penaliza.
      noDisponible.push({ text: s.slice(0, 160) });
      continue;
    }
    if (provisional) {
      noConfirmada.push({ text: s.slice(0, 160) });
      // provisional sin atribución = riesgo
      if (!atribuida) {
        riesgos.push({ text: s.slice(0, 160), detail: 'afirmación provisional sin fuente' });
      }
      continue;
    }
    if (atribuida) {
      atribuciones.push({ text: s.slice(0, 160) });
    } else {
      hechos.push({ text: s.slice(0, 160) });
    }

    // Riesgo editorial: delito afirmado sobre persona identificada sin atribución.
    if (esSuceso && !atribuida && RE_DELITO_AFIRMADO.test(s)) {
      const nombres = s.match(RE_NOMBRE_PROPIO) ?? [];
      if (nombres.length > 0) {
        riesgos.push({ text: s.slice(0, 160), detail: `delito afirmado sobre ${nombres[0]} sin atribución` });
      } else {
        riesgos.push({ text: s.slice(0, 160), detail: 'delito afirmado sin atribución ni víctima/atribución clara' });
      }
    }

    // Contradicción básica: "confirmó" + "investiga" sobre el mismo hecho.
    if (RE_ATRIBUCION.test(s) && /confirm/i.test(s) && /investig/i.test(s)) {
      contradicciones.push({ text: s.slice(0, 160), detail: 'misma oración mezcla confirmación e investigación abierta' });
    }
  }

  const hasFecha = RE_FECHA.test(`${input.titulo} ${input.cuerpo}`);
  const lugares = `${input.titulo} ${input.cuerpo}`.match(RE_LUGAR) ?? [];

  // Riesgos agregados de la nota
  if (RE_SUCESO.test(input.titulo + ' ' + input.cuerpo) && atribuciones.length === 0 && sents.length > 3) {
    riesgos.push({ text: input.titulo.slice(0, 120), detail: 'nota de sucesos sin ninguna atribución de fuente' });
  }
  if (!hasFecha) {
    riesgos.push({ text: input.titulo.slice(0, 120), detail: 'sin referencia temporal detectable' });
  }

  const nivel: TrustLevel =
    riesgos.length > 0 ? 'BAJA'
    : atribuciones.length === 0 && fuentes.size === 0 ? 'BAJA'
    : atribuciones.length >= 1 && (hasFecha || lugares.length > 0) ? 'ALTA'
    : 'MEDIA';

  return {
    hechos,
    atribuciones,
    noConfirmada,
    noDisponible,
    riesgos,
    contradicciones,
    fuentes: [...fuentes],
    nivel,
    requiereRevisionHumana: riesgos.length > 0 || contradicciones.length > 0,
    resumen:
      `${sents.length} afirmaciones | ${atribuciones.length} atribuidas | ` +
      `${noConfirmada.length} sin confirmar | ${noDisponible.length} no disponibles | ` +
      `${riesgos.length} riesgos | ${contradicciones.length} contradicciones | fuentes: ${fuentes.size}`,
  };
}
