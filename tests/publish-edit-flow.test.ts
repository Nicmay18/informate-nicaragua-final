// Flujo crítico: publicar → listar (Admin) → editar nota publicada → revalidación.
// Cubre las causas raíz corregidas en la auditoría de cierre:
//  1. Orden del listado Admin con `fecha` de tipo mixto (Timestamp + string ISO).
//  2. Edición de nota publicada revalida artículo individual y categoría (server-side).
//  3. `resumen` pasa por el gate de contenido (antes se descartaba silenciosamente).
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  verifyAdminToken: vi.fn(() => true),
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(),
}));

const revalidatePathSpy = vi.fn();
const revalidateTagSpy = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathSpy(...args),
  revalidateTag: (...args: unknown[]) => revalidateTagSpy(...args),
}));

const guardarConMeniMock = vi.fn();
vi.mock('@/lib/editorial/guardar-con-meni', () => ({
  guardarConMeni: (...args: unknown[]) => guardarConMeniMock(...args),
}));

vi.mock('@/lib/slug', () => ({
  ensureUniqueSlug: vi.fn(async (t: string) => t.toLowerCase().replace(/\s+/g, '-')),
}));

function chainableQuery(snap: any) {
  const q: any = {};
  q.where = vi.fn().mockReturnValue(q);
  q.orderBy = vi.fn().mockReturnValue(q);
  q.limit = vi.fn().mockReturnValue(q);
  q.select = vi.fn().mockReturnValue(q);
  q.get = vi.fn().mockResolvedValue(snap);
  return q;
}

function meniOk(categoria = 'Sucesos') {
  return {
    ok: true,
    meni: { blockingIssues: [], scoreFinal: 95 },
    supervisor: { verdict: 'PUBLICAR', issues: [], resultingState: 'PUBLISHED' },
    supervisorApproved: true,
    updateData: { categoria, aprobadoMeni: true, scoreMeni: 95 },
  };
}

beforeEach(() => {
  revalidatePathSpy.mockClear();
  revalidateTagSpy.mockClear();
  guardarConMeniMock.mockClear();
});

describe('Publicar → listar: orden del Admin con fechas de tipo mixto', () => {
  it('la nota nueva (Timestamp) aparece ANTES que las legacy (string ISO)', async () => {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const docs = [
      // Firestore con orderBy(fecha,desc) crudo devolvería los strings primero:
      { id: 'legacy-1', data: () => ({ slug: 'legacy-1', titulo: 'Legacy', categoria: 'Nacionales', publicado: true, estado: 'publicado', fecha: '2026-09-10T10:00:00.000Z' }) },
      { id: 'nueva-1', data: () => ({ slug: 'nueva-1', titulo: 'Nueva', categoria: 'Sucesos', publicado: true, estado: 'publicado', fecha: { toDate: () => new Date('2026-09-16T12:00:00Z') }, publishedAt: { toDate: () => new Date('2026-09-16T12:00:00Z') } }) },
      { id: 'legacy-2', data: () => ({ slug: 'legacy-2', titulo: 'Legacy 2', categoria: 'Deportes', publicado: true, estado: 'publicado', fecha: '2026-09-12T10:00:00.000Z' }) },
    ];
    (getAdminDb as any).mockReturnValue({ collection: vi.fn().mockReturnValue(chainableQuery({ docs })) });

    const { GET } = await import('@/app/api/admin/news/route');
    const { NextRequest } = await import('next/server');
    const res = await GET(new NextRequest('http://localhost/api/admin/news'));
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.news.map((n: any) => n.id)).toEqual(['nueva-1', 'legacy-2', 'legacy-1']);
  }, 60000);
});

function mockDocDb(existingData: Record<string, unknown>, afterData?: Record<string, unknown>) {
  const update = vi.fn().mockResolvedValue(undefined);
  const snapBefore = { exists: true, data: () => existingData };
  const snapAfter = { exists: true, data: () => afterData ?? existingData };
  const get = vi.fn()
    .mockResolvedValueOnce(snapBefore) // lectura inicial del PUT
    .mockResolvedValue(snapAfter); // relectura para categoría posterior
  const ref = { get, update };
  const collection = vi.fn().mockReturnValue({
    doc: vi.fn().mockReturnValue(ref),
    where: vi.fn().mockReturnValue(chainableQuery({ empty: true, docs: [] })),
  });
  return { db: { collection }, update, get };
}

describe('Editar nota publicada → el cambio llega a Firestore y se revalida todo', () => {
  const existing = {
    slug: 'nota-publicada',
    titulo: 'Título original',
    contenido: '<p>Contenido original</p>',
    resumen: 'Resumen original',
    categoria: 'Sucesos',
    estado: 'publicado',
    publicado: true,
    aprobadoMeni: true,
  };

  it('editar una palabra del contenido actualiza Firestore y revalida artículo + categoría + índices', async () => {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const { db, update } = mockDocDb(existing);
    (getAdminDb as any).mockReturnValue(db);
    guardarConMeniMock.mockResolvedValue(meniOk('Sucesos'));

    const { PUT } = await import('@/app/api/admin/news/[id]/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/admin/news/abc', {
      method: 'PUT',
      body: JSON.stringify({ contenido: '<p>Contenido corregido</p>' }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: 'abc' }) });
    const json = await res.json();

    expect(json.success).toBe(true);
    // MENI + Supervisor actuaron como autoridad (gate de contenido)
    expect(guardarConMeniMock).toHaveBeenCalledTimes(1);
    // El update llegó a Firestore con el contenido corregido
    const updateArg = update.mock.calls[0][0];
    expect(String(updateArg.contenido)).toContain('Contenido corregido');
    // Revalidación server-side de TODAS las superficies afectadas
    const paths = revalidatePathSpy.mock.calls.map((c) => c[0]);
    expect(paths).toContain('/');
    expect(paths).toContain('/noticias');
    expect(paths).toContain('/noticias/nota-publicada');
    expect(paths).toContain('/categoria/sucesos');
    expect(revalidateTagSpy.mock.calls.map((c) => c[0])).toContain('noticias');
  }, 60000);

  it('editar solo el resumen pasa por MENI y NO se descarta silenciosamente', async () => {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const { db, update } = mockDocDb(existing);
    (getAdminDb as any).mockReturnValue(db);
    guardarConMeniMock.mockResolvedValue(meniOk('Sucesos'));

    const { PUT } = await import('@/app/api/admin/news/[id]/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/admin/news/abc', {
      method: 'PUT',
      body: JSON.stringify({ resumen: 'Resumen corregido con una palabra nueva' }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: 'abc' }) });
    expect((await res.json()).success).toBe(true);

    expect(guardarConMeniMock).toHaveBeenCalledTimes(1);
    const updateArg = update.mock.calls[0][0];
    expect(updateArg.resumen).toBe('Resumen corregido con una palabra nueva');
  }, 60000);

  it('cambiar la categoría revalida la categoría anterior Y la nueva', async () => {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const { db } = mockDocDb(existing, { ...existing, categoria: 'Nacionales' });
    (getAdminDb as any).mockReturnValue(db);
    guardarConMeniMock.mockResolvedValue(meniOk('Nacionales'));

    const { PUT } = await import('@/app/api/admin/news/[id]/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/admin/news/abc', {
      method: 'PUT',
      body: JSON.stringify({ contenido: '<p>Contenido original</p>', categoria: 'Nacionales' }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: 'abc' }) });
    expect((await res.json()).success).toBe(true);

    const paths = revalidatePathSpy.mock.calls.map((c) => c[0]);
    expect(paths).toContain('/categoria/sucesos');
    expect(paths).toContain('/categoria/nacionales');
  }, 60000);

  it('edición de metadata (imagen) no requiere MENI pero sí revalida', async () => {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const { db, update } = mockDocDb(existing);
    (getAdminDb as any).mockReturnValue(db);

    const { PUT } = await import('@/app/api/admin/news/[id]/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/admin/news/abc', {
      method: 'PUT',
      body: JSON.stringify({ imagen: 'https://example.com/nueva.webp' }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: 'abc' }) });
    expect((await res.json()).success).toBe(true);

    expect(guardarConMeniMock).not.toHaveBeenCalled();
    expect(update.mock.calls[0][0].imagen).toBe('https://example.com/nueva.webp');
    const paths = revalidatePathSpy.mock.calls.map((c) => c[0]);
    expect(paths).toContain('/noticias/nota-publicada');
    expect(paths).toContain('/categoria/sucesos');
  }, 60000);

  it('MENI bloqueante impide la edición y NO revalida nada', async () => {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const { db, update } = mockDocDb(existing);
    (getAdminDb as any).mockReturnValue(db);
    guardarConMeniMock.mockResolvedValue({
      ok: false,
      meni: { blockingIssues: [{ code: 'X1', title: 'Bloqueo', description: 'test' }], scoreFinal: 40 },
      supervisor: { verdict: 'NO_PUBLICAR', issues: [] },
      supervisorApproved: false,
      updateData: {},
    });

    const { PUT } = await import('@/app/api/admin/news/[id]/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/admin/news/abc', {
      method: 'PUT',
      body: JSON.stringify({ contenido: '<p>Contenido inválido</p>' }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: 'abc' }) });

    expect(res.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
    expect(revalidatePathSpy).not.toHaveBeenCalled();
  }, 60000);
});
