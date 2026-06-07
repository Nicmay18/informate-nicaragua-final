/**
 * Extrae encabezados H2/H3 del HTML de un artículo,
 * les asigna IDs únicos basados en el texto,
 * y devuelve tanto el HTML modificado como la lista de encabezados.
 */

export interface TocItem {
  level: number;
  text: string;
  id: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 60);
}

export function injectTocIds(html: string): { html: string; items: TocItem[] } {
  if (!html) return { html: '', items: [] };

  // Solo procesar si hay suficiente contenido (~1000 palabras)
  const wordCount = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  if (wordCount < 100) {
    return { html, items: [] };
  }

  const items: TocItem[] = [];
  const seen = new Set<string>();

  // Regex para encontrar <h2>...</h2> y <h3>...</h3>
  const headingRegex = /<h([23])[^>]*>(.*?)<\/h\1>/gi;

  const modifiedHtml = html.replace(headingRegex, (_match, level, content) => {
    // Extraer texto plano del contenido del heading (quitar tags internos)
    const plainText = content.replace(/<[^>]+>/g, '').trim();
    let id = slugify(plainText);

    // Evitar IDs duplicados
    if (seen.has(id)) {
      let counter = 1;
      while (seen.has(`${id}-${counter}`)) {
        counter++;
      }
      id = `${id}-${counter}`;
    }
    seen.add(id);

    items.push({ level: parseInt(level, 10), text: plainText, id });

    // Reemplazar el heading con uno que tenga id
    return `<h${level} id="${id}">${content}</h${level}>`;
  });

  return { html: modifiedHtml, items };
}
