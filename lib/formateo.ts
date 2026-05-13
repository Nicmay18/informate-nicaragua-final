/**
 * ================================================================
 * FORMATEO PERIODÍSTICO PROFESIONAL
 * ================================================================
 * Convierte cualquier texto plano o HTML en artículo con formato
 * periodístico digital estricto. Aplica automáticamente:
 * - Párrafos cortos (máx 4 líneas / ~320 caracteres)
 * - Subtítulos H2 detectados por MAYÚSCULAS o patrones
 * - Blockquotes para citas entre comillas
 * - Listas con viñetas para enumeraciones
 * - Limpieza de basura no editorial
 */

const MAX_PARRAFO = 320;
const PALABRAS_POR_MIN = 200;

/**
 * Parsea una fecha de forma determinista sin depender de la zona horaria local.
 * Soporta strings ISO (YYYY-MM-DDTHH:mm:ss.sssZ) y YYYY-MM-DD.
 */
function parseDateParts(dateStr: string | Date): { day: number; month: number; year: number } | null {
  const str = typeof dateStr === 'string' ? dateStr : dateStr.toISOString();
  // Extraer YYYY-MM-DD directamente del string para evitar timezone shifts
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return {
      year: parseInt(m[1], 10),
      month: parseInt(m[2], 10) - 1, // 0-based
      day: parseInt(m[3], 10),
    };
  }
  // Fallback para formatos no estándar
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() };
}

/**
 * Formatea una fecha a español de manera determinista (sin depender de toLocaleDateString)
 * para evitar hydration mismatches entre SSR y cliente.
 */
export function formatDateES(dateStr: string | Date): string {
  const parts = parseDateParts(dateStr);
  if (!parts) return String(dateStr);
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${parts.day} de ${meses[parts.month]} de ${parts.year}`;
}

/**
 * Formatea una fecha a español corto (día mes corto) de manera determinista.
 */
export function formatDateShortES(dateStr: string | Date): string {
  const parts = parseDateParts(dateStr);
  if (!parts) return String(dateStr);
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parts.day} ${meses[parts.month]}`;
}

/* ================================================================
   DETECTORES DE PATRONES PERIODÍSTICOS
   ================================================================ */

function esSubtitulo(linea: string): boolean {
  const l = linea.trim();
  if (l.length < 4 || l.length > 70) return false;
  // Si termina en ':' es título de lista, NO subtítulo del artículo
  if (l.endsWith(':')) return false;
  // MAYÚSCULAS puras (pero más de una palabra para evitar acrónimos sueltos)
  if (l === l.toUpperCase() && !l.endsWith('.') && l.split(/\s+/).length > 1) return true;
  // Patrones comunes de subtítulo periodístico (más específicos)
  const patrones = /^(el|la|los|las|un|una|nuevos?|antiguos?|impacto|alerta|riesgo|crisis|futuro|revelan?|exigen|denuncian?|declaran?|anuncian?|confirman?|detalles|consecuencias|reacciones|declaraciones)\s+/i;
  if (patrones.test(l) && !l.endsWith('.') && l.split(/\s+/).length > 1) return true;
  return false;
}

function esCita(linea: string): boolean {
  const l = linea.trim();
  return l.startsWith('"') && l.includes('"') && l.length > 30;
}

function esLista(linea: string): boolean {
  const l = linea.trim();
  // Viñetas: guiones, asteriscos, bullets, checkmarks, warnings, emojis varios
  return /^(\s*[-\*•✓✅⚠️🔍📖💡❗👉📌]\s)/.test(l) || /^(\s*\d+[\.)]\s)/.test(l);
}

/* ================================================================
   FORMATEADOR PRINCIPAL
   ================================================================ */

export function formatearNoticia(texto: string): string {
  if (!texto) return '';

  // Si ya tiene HTML estructurado (h2, blockquote, ul), preservarlo
  if (texto.includes('<h2') || texto.includes('<blockquote') || texto.includes('<ul')) {
    return limpiarHtml(texto);
  }

  // === FASE 1: LIMPIEZA INICIAL ===
  let limpio = texto
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Eliminar basura no editorial del final
    .replace(/\bcompartir\b[\s\S]*$/i, '')
    .replace(/\bno\s+hay\s+noticias\s+relacionadas\b[\s\S]*$/i, '')
    .replace(/\bradio\s+en\s+vivo\b[\s\S]*$/i, '')
    .replace(/\bfacebook\b[\s\S]*$/i, '')
    .replace(/\bwhatsapp\b[\s\S]*$/i, '')
    .replace(/\btelegram\b[\s\S]*$/i, '')
    // Normalizar espacios
    .replace(/  +/g, ' ')
    .replace(/\n{3,}/g, '\n\n');

  // === FASE 2: DIVIDIR EN BLOQUES ===
  const lineas = limpio.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const bloques: string[] = [];
  let parrafoActual = '';

  function flushParrafo() {
    if (parrafoActual.trim()) {
      // Dividir párrafo largo en pedazos de ~MAX_PARRAFO chars
      const partes = partirParrafo(parrafoActual.trim());
      partes.forEach(p => bloques.push(`<p>${escaparHtml(p)}</p>`));
      parrafoActual = '';
    }
  }

  for (const linea of lineas) {
    // Detectar subtítulo
    if (esSubtitulo(linea)) {
      flushParrafo();
      bloques.push(`<h2>${escaparHtml(linea)}</h2>`);
      continue;
    }

    // Detectar cita
    if (esCita(linea)) {
      flushParrafo();
      bloques.push(`<blockquote>${escaparHtml(linea)}</blockquote>`);
      continue;
    }

    // Detectar lista
    if (esLista(linea)) {
      flushParrafo();
      // Agrupar items consecutivos
      const items: string[] = [linea.replace(/^[\-\*•✓✅⚠️🔍\d+[\.)]]\s*/, '')];
      // Nota: el loop externo ya avanza linea por linea, así que el manejo de listas
      // múltiples lo haremos en post-proceso
      bloques.push(`<li>${escaparHtml(items[0])}</li>`);
      continue;
    }

    // Acumular párrafo
    if (linea.length < 50 && !linea.endsWith('.')) {
      // Si termina en ':' es título de lista/descripción, NO subtítulo
      if (linea.endsWith(':')) {
        parrafoActual += (parrafoActual ? ' ' : '') + linea;
        continue;
      }
      // Si es solo una palabra o número, no es subtítulo
      if (linea.split(/\s+/).filter(Boolean).length <= 1) {
        parrafoActual += (parrafoActual ? ' ' : '') + linea;
        continue;
      }
      // Posible fragmento de subtítulo no detectado
      flushParrafo();
      bloques.push(`<h2>${escaparHtml(linea)}</h2>`);
      continue;
    }

    parrafoActual += (parrafoActual ? ' ' : '') + linea;

    if (parrafoActual.length > MAX_PARRAFO) {
      flushParrafo();
    }
  }
  flushParrafo();

  // === FASE 3: POST-PROCESO ===
  // Agrupar <li> consecutivos en <ul>
  const final: string[] = [];
  let enLista = false;

  for (const bloque of bloques) {
    if (bloque.startsWith('<li>')) {
      if (!enLista) {
        final.push('<ul>');
        enLista = true;
      }
      final.push(bloque);
    } else {
      if (enLista) {
        final.push('</ul>');
        enLista = false;
      }
      final.push(bloque);
    }
  }
  if (enLista) final.push('</ul>');

  return final.join('\n');
}

/* ================================================================
   UTILIDADES INTERNAS
   ================================================================ */

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function partirParrafo(texto: string): string[] {
  if (texto.length <= MAX_PARRAFO) return [texto];

  const partes: string[] = [];
  let actual = '';
  const oraciones = texto.split(/(?<=[.!?])\s+/);

  for (const oracion of oraciones) {
    const o = oracion.trim();
    if (!o) continue;

    if (actual.length + o.length > MAX_PARRAFO && actual.length > 100) {
      partes.push(actual.trim());
      actual = o;
    } else {
      actual += (actual ? ' ' : '') + o;
    }
  }
  if (actual) partes.push(actual.trim());
  return partes;
}

/* ================================================================
   LIMPIADOR DE HTML
   Preserva estructura periodística, elimina basura
   ================================================================ */

const BLOCK_TAG_RE = /<(p|h[1-6]|blockquote|ul|ol|li|div|section|article|br|table|tr|td)[\s>/]/i;

export function limpiarHtml(html: string): string {
  if (!html) return '';

  // Detectar si es REALMENTE HTML estructurado (tags de bloque), no un simple '<'
  const hasBlockTags = BLOCK_TAG_RE.test(html);

  // Si no es HTML estructurado, pasar por formatearNoticia que convierte \n a <p>
  if (!hasBlockTags) {
    return formatearNoticia(html);
  }

  let limpio = html
    // Quitar basura no editorial del final
    .replace(/\bcompartir\b[\s\S]*$/i, '')
    .replace(/\bno\s+hay\s+noticias\s+relacionadas\b[\s\S]*$/i, '')
    .replace(/\bradio\s+en\s+vivo\b[\s\S]*$/i, '')
    // Preservar h2, h3, blockquote, ul, ol, li, strong, em, p, br
    // Solo limpiar atributos de spam
    .replace(/\s*style="[^"]*"/gi, '')
    .replace(/\s*class="[^"]*"/gi, '')
    .replace(/\s*align="[^"]*"/gi, '')
    .replace(/\s*valign="[^"]*"/gi, '')
    .replace(/\s*width="[^"]*"/gi, '')
    .replace(/\s*height="[^"]*"/gi, '')
    .replace(/\s*font-family="[^"]*"/gi, '')
    // Eliminar span/font vacíos o con solo estilo
    .replace(/<span[^>]*>(.*?)<\/span>/gi, '$1')
    .replace(/<font[^>]*>(.*?)<\/font>/gi, '$1')
    // Normalizar espacios
    .replace(/ +/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    // Eliminar párrafos vacíos
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p><br\s*\/?>\s*<\/p>/g, '');

  return limpio.trim();
}

/* ================================================================
   EXTRACTORES Y CONTADORES
   ================================================================ */

export function extraerResumen(texto: string, maxLength: number = 150): string {
  if (!texto) return '';
  const textoPlano = texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (textoPlano.length <= maxLength) return textoPlano;
  const cortado = textoPlano.substring(0, maxLength);
  const ultimoEspacio = cortado.lastIndexOf(' ');
  return (ultimoEspacio > 0 ? cortado.substring(0, ultimoEspacio) : cortado) + '...';
}

export function contarPalabras(texto: string): number {
  if (!texto) return 0;
  const textoPlano = texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return textoPlano.split(' ').filter(p => p.length > 0).length;
}

export function tiempoLectura(texto: string): number {
  const palabras = contarPalabras(texto);
  return Math.max(1, Math.ceil(palabras / PALABRAS_POR_MIN));
}
