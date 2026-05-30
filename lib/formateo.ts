// lib/formateo.ts
// Todas las funciones de formateo en un solo lugar

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// ============ FECHAS ============

export function formatDateES(date: string | Date | undefined): string {
  if (!date) return 'Fecha no disponible';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  } catch {
    return String(date);
  }
}

export function formatDateShortES(date: string | Date | undefined): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return String(date);
  }
}

export function timeAgo(date: string | Date | undefined): string {
  if (!date) return 'Hace un momento';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
  } catch {
    return String(date);
  }
}

export function formatTime(date: string | Date | undefined): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function formatDateTime(date: string | Date | undefined): string {
  if (!date) return '';
  return `${formatDateES(date)} • ${formatTime(date)}`;
}

// ============ TIEMPO DE LECTURA ============

export function tiempoLectura(texto: string): number {
  if (!texto) return 1;
  const palabras = texto.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(palabras / 200));
}

// ============ NÚMEROS ============

export function fmtViews(v: number | undefined): string {
  if (!v || v === 0) return '0';
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(v);
}

// ============ SLUGS ============

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function slugifyCategory(name: string): string {
  return slugify(name);
}

// ============ HTML ============

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&quot;|&lt;|&gt;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function limpiarHtml(html: string): string {
  if (!html) return '';
  // Si ya tiene HTML estructurado, solo limpiar basura
  if (html.includes('<p>') || html.includes('<h')) return html;
  return stripHtml(html);
}

export function formatearNoticia(texto: string): string {
  if (!texto) return '';
  // Envolver párrafos sueltos en <p>
  const parrafos = texto.split(/\n\n+/).filter(p => p.trim());
  if (parrafos.length <= 1) return texto;
  return parrafos.map(p => `<p>${p.trim()}</p>`).join('');
}

// ============ EXTRACTORES DE CONTENIDO ============

export function extractFirstSentence(text: string): string {
  const cleaned = text.replace(/^\s+/, '');
  const match = cleaned.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : cleaned.trim();
}

export function extractKeySentence(text: string, position: 'middle' | 'end' = 'middle'): string {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 300);

  if (sentences.length === 0) return '';

  if (position === 'middle') {
    const mid = Math.floor(sentences.length / 2);
    return sentences[mid] ? sentences[mid] + '.' : '';
  }
  return sentences[sentences.length - 1] ? sentences[sentences.length - 1] + '.' : '';
}

export function extractPoints(text: string, maxPoints: number = 3): string[] {
  const plain = stripHtml(text);
  const sentences = plain
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 40 && s.length < 230);
  return sentences.slice(0, maxPoints);
}

export function extractTags(categoria: string, titulo: string): string[] {
  const base = [categoria];
  const words = titulo.toLowerCase().split(/\s+/).filter(w => w.length > 5);
  const significant = words.filter(w => 
    !['sobre', 'entre', 'desde', 'hasta', 'durante', 'contra', 'según', 'segun', 'nicaragua', 'informate'].includes(w)
  );
  return [...base, ...significant.slice(0, 4)].map(t => 
    t.charAt(0).toUpperCase() + t.slice(1)
  );
}

export function capitalizeFirst(str: string): string {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
