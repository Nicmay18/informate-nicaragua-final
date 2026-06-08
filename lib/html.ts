/**
 * HTML post-processing utilities for article content
 * - Add rel="nofollow noopener noreferrer" and target="_blank" to external links
 * - Add loading="lazy" and decoding="async" to <img> tags
 */

export function enhanceArticleHtml(html: string, siteBase: string): string {
  if (!html) return '';
  let output = html;

  // Normalize site base (no trailing slash)
  const base = (siteBase || '').replace(/\/$/, '').toLowerCase();

  // Enhance external links
  output = output.replace(/<a\s+([^>]*?href=["']?([^"'>\s#]+)[^>]*?)>/gi, (match, attrs, href) => {
    try {
      const url = new URL(href, base || 'https://nicaraguainformate.com');
      const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
      const isExternal = isHttp && base && !url.origin.toLowerCase().includes(new URL(base).host.toLowerCase());

      let newAttrs = String(attrs);

      if (isExternal) {
        // target
        if (!/\btarget=/.test(newAttrs)) {
          newAttrs += ' target="_blank"';
        }
        // rel
        const relMatch = newAttrs.match(/\brel=["']([^"']*)["']/i);
        if (relMatch) {
          const relVals = new Set(relMatch[1].split(/\s+/).filter(Boolean));
          ['nofollow', 'noopener', 'noreferrer'].forEach((v) => relVals.add(v));
          newAttrs = newAttrs.replace(/\brel=["'][^"']*["']/i, `rel="${Array.from(relVals).join(' ')}"`);
        } else {
          newAttrs += ' rel="nofollow noopener noreferrer"';
        }
      }

      // Ensure noopener for any _blank even if internal
      if (/\btarget=["']?_blank["']?/i.test(newAttrs) && !/\brel=/.test(newAttrs)) {
        newAttrs += ' rel="noopener noreferrer"';
      }

      return `<a ${newAttrs}>`;
    } catch {
      return match; // in case URL parsing fails
    }
  });

  // Enhance <img> tags
  output = output.replace(/<img\b([^>]*)>/gi, (_match, attrs) => {
    let newAttrs = String(attrs);
    if (!/\bloading=/.test(newAttrs)) newAttrs += ' loading="lazy"';
    if (!/\bdecoding=/.test(newAttrs)) newAttrs += ' decoding="async"';
    // Prefer width/height if present; do not guess sizes here
    return `<img${newAttrs}>`;
  });

  return output;
}
