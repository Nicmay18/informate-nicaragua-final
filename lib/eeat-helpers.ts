import { AUTHORS } from './authors';

const DEFAULT_AUTHOR_PHOTO = '/logo.webp';

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);
}

function concisar(frase: string, minPalabras = 12, maxPalabras = 18): string {
  const palabras = frase.split(/\s+/).filter(Boolean);
  const corte = Math.min(Math.max(palabras.length, minPalabras), maxPalabras);
  const recorte = palabras.slice(0, corte);
  const oracion = recorte
    .join(' ')
    .replace(/[\s,;:-]+$/g, '')
    .trim();
  if (!oracion) return '';
  return oracion.charAt(0).toUpperCase() + oracion.slice(1) + '.';
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
