/**
 * VALIDATE → REJECT → LOG para defectos mecánicos conocidos del pipeline de
 * generación. Solo patrones imposibles o verbatim fabricados — nunca heurística
 * editorial. Detectado durante el saneamiento de 474 notas (ver .audit/).
 */

const DEFECTS: Array<{ code: string; re: RegExp; desc: string }> = [
  // Concatenación imposible del generador: "motocicletacicleta(s)", "...ciclista(s)"
  { code: 'CONCAT_MOTOCICLETA', re: /motocicletaciclet|motocicletaciclist/i, desc: 'palabra concatenada imposible (motocicleta*)' },
  // Duplicación mecánica observada: "personas personas"
  { code: 'DUP_PERSONAS', re: /\bpersonas\s+personas\b/i, desc: 'duplicación mecánica "personas personas"' },
  // Concordancia rota del generador: "el afectación", "del afectación", "afectado afectada"
  { code: 'CONCORDANCIA_AFECTACION', re: /\b(?:el|del)\s+afectación\b|afectado\s+afectada/i, desc: 'concordancia rota en "afectación"' },
  // Citas fabricadas verbatim del pipeline (testigos/vecinos inexistentes)
  { code: 'CITA_FABRICADA', re: /testigo ocular manifestó|vecino que presenció los hechos comentó|declaración de residente local|maría lópez,?\s+vecina del barrio|recabado por la redacción|transeúte que captó el momento/i, desc: 'plantilla de cita fabricada (testigo/vecino/residente inexistente)' },
  // Remanente de anchor roto en bloque "También te puede interesar": <li>slug">texto
  { code: 'LI_ROTO', re: /<li>[a-z0-9-]{6,}">/i, desc: 'anchor roto en lista de enlaces relacionados' },
];

/** Devuelve los códigos de defecto encontrados en el texto (título/resumen/contenido). */
export function findGenerationDefects(text: string): { code: string; desc: string }[] {
  if (!text) return [];
  return DEFECTS.filter(d => d.re.test(text)).map(({ code, desc }) => ({ code, desc }));
}
