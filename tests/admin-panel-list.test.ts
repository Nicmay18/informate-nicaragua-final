import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

const panel = readFileSync('public/panel.html', 'utf8');

function loadPanel(rows: any[]) {
  document.body.innerHTML = '<h2 id="noticiasCountTitle"></h2><input id="searchNoticias"><select id="filtroNivel"><option value=""></option></select><select id="filtroEstado"><option value=""></option><option value="publicado">Publicado</option></select><div><div id="listaNoticiasCompleta"></div></div>';
  const w: any = {};
  const toast = vi.fn();
  const published = panel.slice(panel.indexOf('    function esPublicadaAdmin('), panel.indexOf('    async function cargarEstadisticas('));
  const render = panel.slice(panel.indexOf('    window.cargarNoticias ='), panel.indexOf('    window.cargarNoticiaParaEditar ='));
  new Function('window', 'document', 'getNoticiasCache', 'getFechaMs', 'slugCategoria', 'formatearFechaRobusta', 'showToast', 'invalidatePanelCache', `${published}\n${render}`)(w, document, async () => rows, (v: string) => Date.parse(v) || 0, (s: string) => s, (s: string) => s, toast, vi.fn());
  return { w, toast };
}

const visible = () => Array.from(document.querySelectorAll<HTMLElement>('.news-item')).filter(el => el.style.display !== 'none');

describe('Panel real: listado continuo y filtros', () => {
  it('renderiza todos los registros en orden, incluidos los posteriores a 50 y 100', async () => {
    const rows = Array.from({ length: 442 }, (_, i) => ({ id: String(i), titulo: `Noticia ${i}`, categoria: 'Sucesos', publicado: true, estado: 'publicado', fecha: new Date(1800000000000 - i * 1000).toISOString() }));
    const { w, toast } = loadPanel(rows);
    await w.cargarNoticias();
    expect(toast).not.toHaveBeenCalled();
    expect(visible().map(el => el.dataset.id)).toEqual(rows.map(n => n.id));
    expect(visible()[50].dataset.id).toBe('50');
    expect(visible()[100].dataset.id).toBe('100');
    expect(visible().at(-1)?.dataset.id).toBe('441');
    expect(document.getElementById('noticiasCountTitle')?.textContent).toBe('Gestión de Noticias (442)');
  });

  it('combina categoría, publicado y búsqueda; conserva filtros al refrescar y quitar búsqueda', async () => {
    const rows = [
      { id: 'a', titulo: 'Una noticia nueva', categoria: 'Sucesos', publicado: true, estado: 'publicado' },
      { id: 'b', titulo: 'Una noticia vieja', categoria: 'Sucesos', publicado: true, estado: 'publicado' },
      { id: 'c', titulo: 'Una noticia nueva', categoria: 'Nacionales', publicado: true, estado: 'publicado' },
      { id: 'd', titulo: 'Una noticia nueva', categoria: 'Sucesos', publicado: false, estado: 'borrador' },
    ];
    const { w } = loadPanel(rows);
    (document.getElementById('filtroEstado') as HTMLSelectElement).value = 'publicado';
    (document.getElementById('searchNoticias') as HTMLInputElement).value = 'nueva';
    await w.cargarNoticias('Sucesos');
    expect(visible().map(el => el.dataset.id)).toEqual(['a']);
    await w.cargarNoticias('Sucesos');
    expect(visible().map(el => el.dataset.id)).toEqual(['a']);
    await w.buscarNoticias('');
    expect(visible().map(el => el.dataset.id)).toEqual(['a', 'b']);
    expect(document.getElementById('noticiasCountTitle')?.textContent).toBe('Gestión de Noticias (2)');
  });

  it('recarga una nueva nota y una edición sin duplicar ni perder filas', async () => {
    const rows = [{ id: 'old', titulo: 'Original', categoria: 'Sucesos', publicado: true, estado: 'publicado' }];
    const { w } = loadPanel(rows);
    await w.cargarNoticias();
    rows.unshift({ ...rows[0], id: 'new', titulo: 'Nueva' });
    await w.cargarNoticias();
    expect(visible().map(el => el.dataset.id)).toEqual(['new', 'old']);
    rows[1].titulo = 'Corregida';
    await w.cargarNoticias();
    expect(visible().map(el => el.dataset.id)).toEqual(['new', 'old']);
    expect(visible()[1].textContent).toContain('Corregida');
  });
});
