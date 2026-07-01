/**
 * Inyecta links internos dentro del HTML del artículo.
 * Inserta después del primer o segundo párrafo para integración natural.
 */
export interface RelatedLink {
  url: string;
  anchor: string;
  type: string;
}

export function injectInternalLinks(html: string, links: RelatedLink[] | undefined): string {
  if (!links || links.length === 0) return html;
  if (!html || html.trim().length === 0) return html;

  // Construir bloque de links
  const linkItems = links
    .map((link) => `<a href="${escapeHtml(link.url)}" style="color:#991b1b;text-decoration:underline;font-weight:600;">${escapeHtml(link.anchor)}</a>`)
    .join(' · ');

  const linkBlock = `<div style="margin:20px 0;padding:14px 18px;background:#fef2f2;border-left:3px solid #991b1b;border-radius:0 8px 8px 0;font-size:15px;line-height:1.6;color:#374151;"><strong style="color:#7f1d1d;">También te puede interesar:</strong> ${linkItems}</div>`;

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
