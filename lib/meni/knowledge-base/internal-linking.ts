/**
 * Smart Internal Linking — Detecta entidades en el contenido de un artículo
 * y agrega enlaces internos automáticamente a las páginas de entidad.
 * Nunca enlaza dos veces la misma entidad. Prioriza experiencia del lector.
 */

import { extractEntities } from './entity-extractor';

export interface InternalLink {
  text: string;
  url: string;
  entityName: string;
  entityType: string;
}

/**
 * Detecta entidades en el texto y genera enlaces internos.
 * Solo enlaza la primera ocurrencia de cada entidad.
 */
export function generateInternalLinks(
  title: string,
  content: string,
  category: string,
): InternalLink[] {
  const entities = extractEntities(title, content, category);
  const links: InternalLink[] = [];
  const seenEntities = new Set<string>();

  for (const entity of entities) {
    if (seenEntities.has(entity.id)) continue;
    seenEntities.add(entity.id);

    const plainText = content.replace(/<[^>]+>/g, ' ');

    const namePattern = entity.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${namePattern}\\b`, 'i');

    if (regex.test(plainText)) {
      links.push({
        text: entity.name,
        url: `/entidad/${entity.slug}`,
        entityName: entity.name,
        entityType: entity.type,
      });
    }
  }

  return links.slice(0, 8);
}

/**
 * Aplica enlaces internos al contenido HTML.
 * Reemplaza la primera ocurrencia de cada entidad con un enlace.
 * No modifica texto dentro de etiquetas <a> existentes.
 */
export function applyInternalLinks(
  content: string,
  links: InternalLink[],
): string {
  let result = content;
  const linkedTexts = new Set<string>();

  for (const link of links) {
    if (linkedTexts.has(link.text.toLowerCase())) continue;

    const namePattern = link.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Solo reemplazar fuera de etiquetas existentes
    // Buscar la primera ocurrencia que no esté dentro de un <a>
    const regex = new RegExp(`\\b(${namePattern})\\b(?!([^<]*>)|([^<]*<\\/a>))`, 'i');

    if (regex.test(result)) {
      result = result.replace(
        regex,
        `<a href="${link.url}" title="${link.entityName}">${link.text}</a>`,
      );
      linkedTexts.add(link.text.toLowerCase());
    }
  }

  return result;
}
