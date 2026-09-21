/**
 * Generación de metadatos SEO a partir de la evidencia editorial.
 * No re-procesa HTML; consume texto plano ya extraído.
 */

export function generarMetaDescription(textoPlano: string, resumen?: string): string {
  if (resumen && resumen.length >= 150) {
    return resumen.slice(0, 155).trim();
  }
  const base = (textoPlano || '').replace(/\s+/g, ' ').trim();
  if (base.length <= 155) return base;
  return base.slice(0, 152).trim() + '...';
}

export function generarTituloSEO(titulo: string, categoria?: string, departamento?: string): string {
  const parts = [titulo.trim()];
  if (departamento) parts.push(departamento.trim());
  if (categoria) parts.push(categoria.trim());
  const full = parts.join(' - ');
  if (full.length <= 60) return full;
  return full
    .slice(0, 60)
    .replace(/\s+\S*$/, '')
    .replace(/\s+(en|de|del|el|la|los|las|y|a|con|por|para|sin|sobre|tras|al)$/i, '')
    .trim() + '…';
}
