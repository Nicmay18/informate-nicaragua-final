import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSocialCopies } from '@/lib/distribution/social-copy';

const page = readFileSync(join(process.cwd(), 'public/panel.html'), 'utf8');
const script = page.split('<script type="module">').pop()!.split('</script>')[0];
const sharingScript = script.slice(script.indexOf('    window.cambiarTabRedes ='), script.indexOf('    window.invalidarCacheFacebook ='));
const noticia = {
  slug: 'nota-masaya', titulo: 'Hombre hallado sin vida en Masaya', categoria: 'Sucesos',
  resumen: 'El hombre fue hallado en la carretera Masaya-Catarina.',
  contenido: 'El dictamen forense estableció broncoaspiración.', metaDescription: 'Descripción de la nota.',
};
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const copies = (article = noticia) => ({ success: true, source: 'plantilla', validation: 'sin_ia', ...buildSocialCopies(article) });
const textarea = (id: string) => document.getElementById(id) as HTMLTextAreaElement;
const element = (id: string) => document.getElementById(id)!;

function loadPanel() {
  const dom = new DOMParser().parseFromString(page, 'text/html');
  document.body.innerHTML = dom.getElementById('panelCompartirManual')!.outerHTML;
  element('panelCompartirManual').scrollIntoView = vi.fn();
  const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
  const scope: Record<string, (...args: any[]) => any> = {};
  const fetch = vi.fn(async (url: string, options: RequestInit) => {
    const body = JSON.parse(options.body as string);
    if (url === '/api/admin/shortlink') return response({ shortUrl: `https://nicaraguainformate.com/l/${body.source}1` });
    if (url === '/api/admin/copy-social') return response(copies(body));
    throw new Error(`Solicitud no prevista: ${url}`);
  });
  new Function('window', 'document', 'fetch', 'navigator', 'showToast', 'cambiarTabRedes', 'AbortSignal', sharingScript)(
    scope, document, fetch, { clipboard }, vi.fn(), (tab: string) => scope.cambiarTabRedes(tab), AbortSignal,
  );
  return { scope, fetch, clipboard };
}

function deferred() {
  let resolve!: (value: Response) => void;
  const promise = new Promise<Response>(r => { resolve = r; });
  return { promise, resolve };
}

describe('panel social UI sin servicios externos', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  it('valida sintaxis del módulo completo sin ejecutarlo', () => {
    expect(() => new Function(script.replace(/^\s*import\s+[^;]+;/gm, ''))).not.toThrow();
    expect(page).not.toMatch(/onclick="mostrarPanelCompartir\(\{/);
    expect(sharingScript).toContain('solicitarCopySocial');
  });
  it('envía el cuerpo completo, muestra evidencia y conserva links por canal', async () => {
    const { scope, fetch, clipboard } = loadPanel();
    await scope.mostrarPanelCompartir(noticia);
    const apiCall = fetch.mock.calls.find(([url]) => url === '/api/admin/copy-social')!;
    expect(JSON.parse(apiCall[1].body as string)).toMatchObject(noticia);
    expect(textarea('shareTextoFacebook').value).toBe(buildSocialCopies(noticia).facebookPost);
    expect(textarea('sharePrimerComentario').value).toContain('utm_source=facebook');
    expect(textarea('shareTextoTelegram').value).not.toMatch(/<b>|<a /);
    expect(textarea('shareTextoTelegram').value).toContain('/l/telegram1');
    expect(textarea('shareTextoCompleto').value).toContain('/l/whatsapp1');
    expect(element('shareCopyAngle').textContent).toBe('Enfoque: Dictamen forense');
    expect(element('shareCopyEvidence').textContent).toContain('estableció broncoaspiración');
    expect(element('shareCopyDetails').style.display).toBe('block');
    scope.cambiarTabRedes('facebook');
    expect(element('tabRedes_facebook').style.display).toBe('block');
    expect(element('tabRedes_telegram').style.display).toBe('none');
    await scope.copiarTextoRedesId('sharePrimerComentario', 'primer comentario');
    expect(clipboard.writeText).toHaveBeenCalledWith(textarea('sharePrimerComentario').value);
    scope.cambiarTabRedes('whatsapp');
    expect(element('tabRedes_whatsapp').style.display).toBe('block');
    const whatsapp = new URL((element('shareWhatsappLink') as HTMLAnchorElement).href);
    expect(whatsapp.searchParams.get('text')).toBe(textarea('shareTextoCompleto').value);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('la respuesta tardía de una nota no sobrescribe la siguiente', async () => {
    const { scope, fetch } = loadPanel();
    const old = deferred();
    const next = { ...noticia, slug: 'nota-nueva', titulo: 'Nueva noticia de Masaya' };
    fetch.mockImplementation(async (url, options) => {
      const body = JSON.parse(options.body as string);
      if (url.includes('shortlink')) return response({});
      return body.slug === noticia.slug ? old.promise : response(copies(next));
    });
    const first = scope.mostrarPanelCompartir(noticia);
    await scope.mostrarPanelCompartir(next);
    old.resolve(response(copies()));
    await first;
    expect(element('shareTituloHeader').textContent).toBe(next.titulo);
    expect(textarea('shareTextoFacebook').value).toBe(copies(next).facebookPost);
    expect(textarea('sharePrimerComentario').value).toContain('/nota-nueva?');
  });
  it('no duplica solicitudes mientras está generando y conserva copy si falla la API', async () => {
    const { scope, fetch } = loadPanel();
    await scope.mostrarPanelCompartir(noticia);
    const pending = deferred();
    fetch.mockReturnValue(pending.promise);
    const first = scope.regenerarCopyFacebook();
    await scope.regenerarCopyFacebook();
    expect(fetch).toHaveBeenCalledTimes(4);
    pending.resolve(response({}, 503));
    await first;
    expect(textarea('shareTextoFacebook').value).toBe(copies().facebookPost);
    expect(element('shareCopyStatus').textContent).toContain('No se pudo');
    expect((element('btnRegenerarCopyFb') as HTMLButtonElement).disabled).toBe(false);
  });
  it('si la API falla al abrir, no permite copiar un mensaje de carga', async () => {
    const { scope, fetch, clipboard } = loadPanel();
    fetch.mockResolvedValue(response({}, 503));
    await scope.mostrarPanelCompartir(noticia);
    await scope.copiarTextoRedesId('shareTextoFacebook', 'Facebook');
    expect(clipboard.writeText).not.toHaveBeenCalled();
    expect(textarea('shareTextoFacebook').value).toBe('');
    expect(element('shareCopyStatus').textContent).toContain('No se pudo');
  });
  it('rechaza shortlinks externos y mantiene URLs canónicas con UTM', async () => {
    const { scope, fetch } = loadPanel();
    fetch.mockImplementation(async url => url.includes('shortlink')
      ? response({ shortUrl: 'https://otro.test/l/link' }) : response(copies()));
    await scope.mostrarPanelCompartir(noticia);
    expect(textarea('shareTextoTelegram').value).toContain('utm_source=telegram');
    expect(textarea('shareTextoCompleto').value).toContain('utm_source=whatsapp');
    expect(document.body.textContent).not.toContain('otro.test');
  });
  it('muestra evidencia como texto y no como HTML ejecutable', async () => {
    const { scope, fetch } = loadPanel();
    const data = copies();
    data.analysis.evidencia = '<img src=x onerror=alert(1)>';
    fetch.mockImplementation(async url => url.includes('shortlink') ? response({}) : response(data));
    await scope.mostrarPanelCompartir(noticia);
    expect(element('shareCopyEvidence').querySelector('img')).toBeNull();
    expect(element('shareCopyEvidence').textContent).toContain('<img');
  });
});
