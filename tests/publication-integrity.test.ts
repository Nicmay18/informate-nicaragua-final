/**
 * Test de integridad de publicación.
 * Regla absoluta: published = true SOLO SI approvedMeni = true AND archived != true
 */
import { describe, it, expect } from 'vitest';
import { isPublicNews } from '@/lib/data';
import type { Noticia } from '@/lib/types';

describe('Integridad de publicación', () => {
  it('permite publicación cuando aprobadoMeni=true, publicado=true, archived=false', () => {
    const n: Partial<Noticia> = {
      aprobadoMeni: true,
      publicado: true,
      archived: false,
      estado: 'publicado',
    };
    expect(isPublicNews(n)).toBe(true);
  });

  it('bloquea cuando aprobadoMeni=false', () => {
    const n: Partial<Noticia> = {
      aprobadoMeni: false,
      publicado: true,
      archived: false,
      estado: 'publicado',
    };
    expect(isPublicNews(n)).toBe(false);
  });

  it('bloquea cuando archived=true', () => {
    const n: Partial<Noticia> = {
      aprobadoMeni: true,
      publicado: true,
      archived: true,
      estado: 'publicado',
    };
    expect(isPublicNews(n)).toBe(false);
  });

  it('bloquea cuando estado=borrador', () => {
    const n: Partial<Noticia> = {
      aprobadoMeni: true,
      publicado: true,
      archived: false,
      estado: 'borrador',
    };
    expect(isPublicNews(n)).toBe(false);
  });

  it('bloquea cuando estado=archivado', () => {
    const n: Partial<Noticia> = {
      aprobadoMeni: true,
      publicado: true,
      archived: false,
      estado: 'archivado',
    };
    expect(isPublicNews(n)).toBe(false);
  });

  it('bloquea cuando publicado=false', () => {
    const n: Partial<Noticia> = {
      aprobadoMeni: true,
      publicado: false,
      archived: false,
      estado: 'publicado',
    };
    expect(isPublicNews(n)).toBe(false);
  });

  it('bloquea cuando aprobadoMeni es undefined', () => {
    const n: Partial<Noticia> = {
      aprobadoMeni: undefined,
      publicado: true,
      archived: false,
      estado: 'publicado',
    };
    expect(isPublicNews(n)).toBe(false);
  });
});
