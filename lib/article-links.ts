/**
 * Inyecta links internos dentro del HTML del artículo.
 * Inserta después del primer o segundo párrafo para integración natural.
 */
export interface RelatedLink {
  url: string;
  anchor: string;
  type: string;
}

export function buildRelatedContentBlock(links: RelatedLink[]): string {
  const listItems = links
    .map(
      (link) =>
        `<li class="ni-related__item">` +
        `<a class="ni-related__link" href="${escapeHtml(link.url)}">${escapeHtml(link.anchor)}</a>` +
        `</li>`,
    )
    .join('\n');

  return (
    `<aside class="ni-related" aria-label="También te puede interesar">` +
    `<h3 class="ni-related__title">También te puede interesar</h3>` +
    `<ul class="ni-related__list">\n${listItems}\n</ul>` +
    `</aside>`
  );
}

export function injectInternalLinks(html: string, links: RelatedLink[] | undefined): string {
  if (!links || links.length === 0) return html;
  if (!html || html.trim().length === 0) return html;

  const linkBlock = buildRelatedContentBlock(links);

  // Buscar cierre de </p> para insertar después del primer o segundo párrafo
  const paragraphs = html.split('</p>');
  if (paragraphs.length < 2) return html + linkBlock; // poco contenido, append al final

  // Insertar después del segundo párrafo si existe, sino después del primero
  const insertIndex = paragraphs.length >= 3 ? 2 : 1;
  paragraphs[insertIndex] = linkBlock + paragraphs[insertIndex];

  return paragraphs.join('</p>');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
