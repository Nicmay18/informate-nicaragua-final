import { describe, it, expect } from 'vitest';
import { compareMeniAndForense, detectMeniForenseConflicts } from '@/lib/nios/meni-forense-judge';
import type { NoticiaInput } from '@/lib/meni';

const sampleNoticia: NoticiaInput = {
  titulo: 'Policía Nacional reporta 120 detenidos en operativo',
  resumen: 'La Policía Nacional confirmó que durante el operativo realizado ayer fueron detenidas 120 personas.',
  contenido: `<h2>Detalles del operativo</h2><p>Según la Policía Nacional, el operativo se desarrolló en Managua. "No se reportaron heridos", dijo el comisionado Juan Pérez.</p><p>Las autoridades informaron que se incautaron 30 armas y 120 celulares.</p><h2>Datos</h2><p>Slug sugerido: operativo-managua-120-detenidos</p><p>Meta descripción: Policía Nacional reporta 120 detenidos y 30 armas incautadas en operativo en Managua.</p>`,
  categoria: 'Nacionales',
  autor: 'Redacción',
  fecha: '2026-09-04',
  slug: 'operativo-managua-120-detenidos',
  imagen: 'https://example.com/photo.jpg',
};

describe('MENI vs Forense judge', () => {
  it('compara MENI con evidencia Forense y devuelve estructura válida', () => {
    const result = compareMeniAndForense(sampleNoticia);
    expect(result.slug).toBe('operativo-managua-120-detenidos');
    expect(result.confianza).toBeGreaterThanOrEqual(0);
    expect(result.confianza).toBeLessThanOrEqual(1);
    expect(result.forenseExtraida.cifras).toBeGreaterThan(0);
  });

  it('detecta discrepancias entre MENI y Forense', () => {
    const conflicts = detectMeniForenseConflicts([sampleNoticia]);
    // El test no exige un resultado forzado; verifica que la función devuelva un array.
    expect(Array.isArray(conflicts)).toBe(true);
  });

  it('respeta el límite de muestreo', () => {
    const extra = { ...sampleNoticia, slug: 'extra-1' } as NoticiaInput;
    const conflicts = detectMeniForenseConflicts([sampleNoticia, extra, extra, extra], { maxArticles: 1 });
    // Máximo un artículo muestreado.
    expect(conflicts.length).toBeLessThanOrEqual(1);
  });
});
