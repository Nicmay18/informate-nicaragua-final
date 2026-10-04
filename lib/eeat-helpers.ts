import { AUTHORS } from './authors';

const DEFAULT_AUTHOR_PHOTO = '/logo.webp';

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    // headings no son oraciones de contenido: si se extraen junto al
    // párrafo siguiente producen puntos fusionados ("Managua El Centro…")
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Marcador interno: protege el punto de las abreviaturas para que
// splitSentences no rompa nombres propios ("Dr. Carlos Vanzetti").
const ABR_MARK = '\u0000';

function protegerAbreviaturas(texto: string): string {
  return texto
    // multi-punto: a. m., p. m., EE. UU., i. e., e. g., S. S., R. S.
    .replace(/\b((?:[A-Za-zÁÉÍÓÚÑáéíóúñ]\.\s?){2,})/g, (m) => m.replace(/\./g, ABR_MARK))
    // abreviaturas simples frecuentes en español editorial
    .replace(/\b(Dr|Dra|Ing|Lic|Licda|Prof|Profa|Sr|Sra|Srta|Ud|Uds|Mtro|Mtra|etc|aprox|av|km|pag|pág|num|St|vs|vol|cap|sec|dept|dto|fig|tel|cel)\./gi, `$1${ABR_MARK}`);
}

function restaurarAbreviaturas(texto: string): string {
  return texto.split(ABR_MARK).join('.');
}

function splitSentences(text: string, minLen = 30): string[] {
  return protegerAbreviaturas(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => restaurarAbreviaturas(s).trim())
    .filter((s) => s.length > minLen);
}

function concisar(frase: string, minPalabras = 12, maxPalabras = 30): string {
  const palabras = frase.split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return '';
  const limpio = frase.trim().replace(/[.\s,;:—-]+$/g, '');
  // Oración completa: no recortar — el punto final es real, no fabricado
  if (palabras.length <= maxPalabras) {
    return limpio.charAt(0).toUpperCase() + limpio.slice(1) + '.';
  }
  // Oración larga: cortar en el último límite de cláusula dentro del máximo
  const dentro = palabras.slice(0, maxPalabras).join(' ');
  const lastSep = Math.max(dentro.lastIndexOf(','), dentro.lastIndexOf(';'), dentro.lastIndexOf('—'));
  if (lastSep > 0) {
    const cand = dentro.slice(0, lastSep).trim();
    if (cand.split(/\s+/).filter(Boolean).length >= minPalabras) {
      return cand.charAt(0).toUpperCase() + cand.slice(1) + '.';
    }
  }
  // Sin límite de cláusula útil: truncar con '…' (honesto, no punto falso)
  const trunc = dentro.replace(/[\s,;:—-]+$/g, '');
  return trunc.charAt(0).toUpperCase() + trunc.slice(1) + '…';
}

export function extractPuntosClave(contenido: string, limite = 3): string[] {
  if (!contenido) return [];
  const texto = stripHtml(contenido);
  const frases = splitSentences(texto);
  if (frases.length === 0) return [];

  const conDatos = frases.filter((f) => {
    const lower = f.toLowerCase();
    return /\d/.test(f) || /[A-Z][a-z]+ [A-Z][a-z]+/.test(f) || lower.includes('según') || lower.includes('segun') || lower.includes('dijo') || lower.includes('anunció') || lower.includes('según') || lower.includes('afirmó') || lower.includes('indicó') || lower.includes('señaló');
  });

  const base = conDatos.length >= limite ? conDatos : frases;

  // Seleccionar distribución: primera, mitad y última para cubrir qué/cómo/consecuencia
  const seleccion: string[] = [];
  if (base.length > 0) seleccion.push(base[0]);
  if (base.length > 2) seleccion.push(base[Math.floor(base.length / 2)]);
  if (base.length > 1) seleccion.push(base[base.length - 1]);

  // Si la selección no alcanza, rellenar con el resto de oraciones
  for (const f of base) {
    if (seleccion.length >= limite) break;
    if (!seleccion.includes(f)) seleccion.push(f);
  }

  return seleccion
    .slice(0, limite)
    .map((f) => concisar(f))
    .filter(Boolean);
}

export function extractFuente(contenido: string, resumen = ''): { fuente: string; fuentesComplementarias: string[] } {
  const texto = `${contenido || ''} ${resumen || ''}`;
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]\r\n]+)/g;
  const matches = [...texto.matchAll(urlRegex)].map((m) => m[0].split(/[).,;!?\s]/)[0]);
  const unique = Array.from(new Set(matches.filter((u) => u.length > 10)));
  return {
    fuente: unique[0] || '',
    fuentesComplementarias: unique.slice(1, 4),
  };
}

export function getAutorFoto(autor: string | undefined): string {
  if (!autor) return DEFAULT_AUTHOR_PHOTO;
  const normalized = autor.trim().toLowerCase();
  for (const a of Object.values(AUTHORS)) {
    if (a.name.toLowerCase() === normalized || a.slug === normalized || normalized.includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(normalized)) {
      return a.photo || DEFAULT_AUTHOR_PHOTO;
    }
  }
  return DEFAULT_AUTHOR_PHOTO;
}

// ─────────────────────────────────────────────────────────────
// Cortes lingüísticos seguros — nunca a media palabra ni tras abreviatura
// ─────────────────────────────────────────────────────────────

/**
 * Detecta texto que quedó truncado a media palabra/oración:
 *  - no cierra en unidad final (. ! ? … " » ) ])
 *  - o cierra con "…" precedido de un fragmento de 1-2 letras ("para e…").
 */
export function isTextoRotoPorCorte(texto: string): boolean {
  const t = (texto || '').trim();
  if (!t) return false;
  // Elipsis tras palabra = corte del pipeline antiguo ("durant…", "Cost…").
  // Solo es legítima si sigue a un cierre de oración completo (.!?).
  if (/(?:\.\.\.|…)$/.test(t)) return !/[.!?]["”»)\]]?\s*(?:\.\.\.|…)$/.test(t);
  // termina en abreviatura que exige nombre propio: "Neurocirugía “Dr." es roto
  // ("etc." sí es un cierre válido y no entra en esta lista)
  if (/(Dr|Dra|Ing|Lic|Licda|Prof|Profa|Sr|Sra|Srta|Ud|Uds|Mtro|Mtra|St|Sto|Sta)\."?\s*$/i.test(t)) return true;
  if (!/[.!?…"”»)\]]$/.test(t)) return true;
  return false;
}

/**
 * Devuelve el texto terminando en unidad lingüística válida:
 * oración completa > límite de cláusula > límite de palabra + "…".
 * Jamás corta una palabra ni deja un fragmento suelto.
 */
export function extractoSeguro(texto: string, maxChars = 220): string {
  const t = (texto || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (!isTextoRotoPorCorte(t) && t.length <= maxChars) return t;

  const dentro = t.slice(0, maxChars);
  // 1) último cierre de oración — escaneado con abreviaturas protegidas
  //    ("Dr." no cuenta como fin de oración) y piso pequeño: una oración
  //    completa corta siempre gana a una elipsis a media palabra.
  const protegido = protegerAbreviaturas(dentro);
  let fin = -1;
  for (const m of protegido.matchAll(/[.!?](?=["”»)\]]?\s|$)/g)) fin = m.index!;
  const minimo = Math.min(60, Math.floor(maxChars * 0.4));
  if (fin >= 15) return dentro.slice(0, fin + 1);
  // 2) último límite de cláusula
  const clausula = Math.max(dentro.lastIndexOf(', '), dentro.lastIndexOf('; '), dentro.lastIndexOf(' — '), dentro.lastIndexOf(': '));
  if (clausula >= minimo) return dentro.slice(0, clausula).replace(/[\s,;:—-]+$/g, '') + '…';
  // 3) último límite de palabra — nunca a media palabra
  const finPalabra = dentro.lastIndexOf(' ');
  if (finPalabra > minimo) return dentro.slice(0, finPalabra).replace(/[\s,;:—-]+$/g, '') + '…';
  return t;
}

/**
 * Reconstruye un resumen/dek desde el contenido: oraciones completas
 * consecutivas hasta el límite. Devuelve '' si no hay material.
 */
export function buildDek(contenido: string, maxChars = 220): string {
  const frases = splitSentences(stripHtml(contenido || ''), 1);
  let dek = '';
  for (const f of frases) {
    const cand = dek ? dek + ' ' + f : f;
    if (cand.length <= maxChars) { dek = cand; if (dek.length >= 80) break; }
    else break;
  }
  return dek;
}