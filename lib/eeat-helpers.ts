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
    .filter((s) => s.length > 40);
}

export function extractPuntosClave(contenido: string, limite = 4): string[] {
  if (!contenido) return [];
  const texto = stripHtml(contenido);
  const frases = splitSentences(texto);
  const relevantes = frases.filter((f) => {
    const lower = f.toLowerCase();
    // Prioriza oraciones con cifras, nombres propios o información concreta
    return /\d/.test(f) || /[A-Z][a-z]+ [A-Z][a-z]+/.test(f) || lower.includes('según') || lower.includes('segun') || lower.includes('dijo') || lower.includes('anunció');
  });
  const base = relevantes.length > 0 ? relevantes : frases;
  return base.slice(0, limite);
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
