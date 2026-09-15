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

/** Bloque inline "Si te interesa" — un solo enlace contextual. */
function buildSiTeInteresaLine(link: RelatedLink): string {
  return (
    `<p class="ni-sti">` +
    `<strong class="ni-sti__label">Si te interesa:</strong> ` +
    `<a class="ni-sti__link" href="${escapeHtml(link.url)}">${escapeHtml(link.anchor)}</a>` +
    `</p>`
  );
}

/**
 * Inyecta hasta 2 enlaces "Si te interesa" dentro del cuerpo,
 * distribuidos a ~1/3 y ~2/3 del artículo para integración contextual.
 * Devuelve el HTML modificado; los enlaces usados deben excluirse de
 * "Lea también" en el llamador para evitar duplicados.
 */
export function injectInternalLinks(html: string, links: RelatedLink[] | undefined): string {
  if (!links || links.length === 0) return html;
  if (!html || html.trim().length === 0) return html;

  const picked = links.slice(0, 2);
  const paragraphs = html.split('</p>');
  const total = paragraphs.length - 1; // bloques <p> reales

  if (total < 3) {
    // Contenido corto: un solo enlace al final
    return html + buildSiTeInteresaLine(picked[0]);
  }

  // Posiciones de inserción (índice de párrafo tras el cual insertar)
  const positions = picked.length === 1
    ? [Math.max(1, Math.floor(total / 2))]
    : [Math.max(1, Math.floor(total / 3)), Math.max(2, Math.floor((2 * total) / 3))];

  const insertMap = new Map<number, string>();
  picked.forEach((link, i) => {
    const pos = Math.min(positions[i], total - 1);
    if (!insertMap.has(pos)) insertMap.set(pos, buildSiTeInteresaLine(link));
  });

  // Reconstruir restaurando los </p> que split() eliminó
  let out = '';
  for (let i = 0; i < paragraphs.length; i++) {
    out += paragraphs[i];
    if (i < total) out += '</p>';
    const sti = insertMap.get(i);
    if (sti) out += sti;
  }
  return out;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
