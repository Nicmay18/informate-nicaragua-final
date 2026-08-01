import { describe, it, expect } from 'vitest';
import { calificarMeni, diagnosticarMeni } from '@/lib/meni/editor-meni';

describe('Editor MENI', () => {
  it('califica 95-100 como Publicable Oro', () => {
    const r = calificarMeni(96);
    expect(r.calificacion).toBe('PUBLICABLE_ORO');
    expect(r.texto).toBe('Publicable Oro');
  });

  it('califica 85-94 como Publicable con revisión', () => {
    const r = calificarMeni(91);
    expect(r.calificacion).toBe('PUBLICABLE_REVISION');
    expect(r.texto).toBe('Publicable con revisión');
  });

  it('califica 70-84 como Necesita mejoras', () => {
    const r = calificarMeni(78);
    expect(r.calificacion).toBe('NECESITA_MEJORAS');
    expect(r.texto).toBe('Necesita mejoras');
  });

  it('califica menos de 70 como No publicar', () => {
    const r = calificarMeni(65);
    expect(r.calificacion).toBe('NO_PUBLICAR');
    expect(r.texto).toBe('No publicar sin edición');
  });

  it('genera fortalezas y acciones para una noticia Oro', () => {
    const d = diagnosticarMeni({
      score: 96,
      utilidad: 95,
      profundidad: 92,
      eeat: 96,
      originalidad: 90,
      aportePropio: 100,
      adnNI: 88,
    });
    expect(d.calificacion).toBe('PUBLICABLE_ORO');
    expect(d.fortalezas.length).toBeGreaterThan(0);
    expect(d.debilidades.length).toBe(0);
    expect(d.acciones).toContain('Listo para publicar.');
  });

  it('detecta debilidades y acciones en una noticia con revisión', () => {
    const d = diagnosticarMeni({
      score: 91,
      utilidad: 88,
      profundidad: 52,
      eeat: 95,
      originalidad: 90,
      aportePropio: 100,
      adnNI: 88,
    });
    expect(d.calificacion).toBe('PUBLICABLE_REVISION');
    expect(d.fortalezas.length).toBeGreaterThan(0);
    expect(d.debilidades).toContain('Falta contexto histórico, institucional o cifras.');
    expect(d.acciones).toContain('Añadir antecedentes, contexto o cifras oficiales.');
  });

  it('exige revisión completa para noticias bajo 85', () => {
    const d = diagnosticarMeni({
      score: 82,
      utilidad: 70,
      profundidad: 70,
      eeat: 80,
      originalidad: 85,
      aportePropio: 0,
      adnNI: 80,
    });
    expect(d.calificacion).toBe('NECESITA_MEJORAS');
    expect(d.acciones).toContain('Revisión editorial completa antes de publicar.');
    expect(d.acciones).toContain('Añadir análisis o aporte propio de Nicaragua Informate.');
  });

  it('bloquea publicación para score menor a 70', () => {
    const d = diagnosticarMeni({
      score: 65,
      utilidad: 50,
      profundidad: 50,
      eeat: 55,
      originalidad: 60,
      aportePropio: 0,
      adnNI: 55,
    });
    expect(d.calificacion).toBe('NO_PUBLICAR');
    expect(d.acciones).toContain('No publicar sin edición sustancial.');
  });
});
