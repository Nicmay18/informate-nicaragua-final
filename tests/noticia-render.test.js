/**
 * Tests para verificar que el contenido HTML en noticias se renderiza correctamente
 * en noticia.html sin escapar los <p> tags.
 */

function esc(text) {
  if (typeof text !== 'string') return text;
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function normalizeContent(text) {
  let contentIsHTML = false;
  if (!text) return { pars: [], isHTML: false };
  if (/<p[>\s]/i.test(text)) {
    contentIsHTML = true;
    const matches = text.match(/<p[^>]*>(.*?)<\/p>/gis) || [];
    const pars = matches.map(m => m.replace(/<\/?p[^>]*>/gi, '').trim()).filter(p => p.length > 0);
    return { pars, isHTML: true };
  }
  let cleaned = text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n');
  const pars = cleaned.split('\n\n').map(p => p.replace(/\s+/g, ' ').trim()).filter(p => p.length > 0);
  return { pars, isHTML: false };
}

describe('normalizeContent', () => {
  test('detecta contenido con <p> tags y extrae parrafos', () => {
    const input = '<p>Primer parrafo.</p>\n<p>Segundo parrafo.</p>';
    const result = normalizeContent(input);
    expect(result.isHTML).toBe(true);
    expect(result.pars).toEqual(['Primer parrafo.', 'Segundo parrafo.']);
  });

  test('no detecta HTML cuando no hay <p> tags', () => {
    const input = 'Parrafo uno.\n\nParrafo dos.';
    const result = normalizeContent(input);
    expect(result.isHTML).toBe(false);
    expect(result.pars).toEqual(['Parrafo uno.', 'Parrafo dos.']);
  });

  test('maneja texto plano con saltos de linea', () => {
    const input = 'Linea uno.\n\n\n\nLinea dos.';
    const result = normalizeContent(input);
    expect(result.pars).toEqual(['Linea uno.', 'Linea dos.']);
  });

  test('maneja contenido vacio', () => {
    expect(normalizeContent('')).toEqual({ pars: [], isHTML: false });
    expect(normalizeContent(null)).toEqual({ pars: [], isHTML: false });
  });
});

describe('renderizado HTML', () => {
  test('no escapa contenido HTML pre-formateado', () => {
    const result = normalizeContent('<p>Texto <strong>importante</strong>.</p>');
    expect(result.isHTML).toBe(true);
    const p = result.pars[0];
    expect(p).toContain('<strong>');
    // Al renderizar, NO se debe usar esc() sobre p
    expect(esc(p)).not.toEqual(p);
    expect(p).toBe('Texto <strong>importante</strong>.');
  });

  test('escapa contenido plano para evitar XSS', () => {
    const result = normalizeContent('Texto con <script>alert(1)</script> malicioso.');
    expect(result.isHTML).toBe(false);
    const rendered = result.pars.map(p => esc(p)).join('');
    expect(rendered).not.toContain('<script>');
    expect(rendered).toContain('&lt;script&gt;');
  });
});
