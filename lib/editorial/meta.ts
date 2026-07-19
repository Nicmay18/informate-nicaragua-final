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
  return parts.join(' - ').slice(0, 60).trim();
}
