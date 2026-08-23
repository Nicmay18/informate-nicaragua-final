// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { resolveEditorialClassification, resolvePublicCategory } from '@/lib/editorial/canonical';
import type { Noticia } from '@/lib/types';

describe('Misión 11 — Precedencia editorial y trazabilidad de categoría', () => {
  function article(titulo: string, contenido: string, categoria?: string): Partial<Noticia> {
    return {
      titulo,
      contenido,
      resumen: contenido,
      categoria,
    };
  }

  it('TEST 1: Editor NACIONAL + centro de monitoreo en Nicaragua → Nacionales', () => {
    const a = article(
      'Centro de monitoreo en Nicaragua para terremotos y otros fenómenos',
      'El gobierno de Nicaragua inauguró un centro de monitoreo para terremotos y fenómenos naturales.',
      'Nacionales',
    );
    const r = resolveEditorialClassification(a);
    expect(r.finalCategory).toBe('Nacionales');
    expect(r.classificationSource).toBe('editor');
    expect(r.classificationConflict).toBe(false);
    expect(r.classificationReason).toContain('Nacionales');
    expect(r.classificationReason).toContain('editor');
    expect(resolvePublicCategory(a)).toBe('Nacionales');
  });

  it('TEST 2: Editor INTERNACIONAL + nicaragüense muere en Panamá → Internacionales', () => {
    const a = article(
      'Nicaragüense muere en Panamá',
      'Una ciudadana nicaragüense falleció en territorio panameño.',
      'Internacionales',
    );
    const r = resolveEditorialClassification(a);
    expect(r.finalCategory).toBe('Internacionales');
    expect(r.classificationSource).toBe('editor');
    expect(resolvePublicCategory(a)).toBe('Internacionales');
  });

  it('TEST 3: Editor NACIONAL + cooperación internacional en Nicaragua → Nacionales', () => {
    const a = article(
      'Gobierno anuncia proyecto en Nicaragua con cooperación internacional',
      'El gobierno de Nicaragua presentó un proyecto de infraestructura con apoyo extranjero.',
      'Nacionales',
    );
    const r = resolveEditorialClassification(a);
    expect(r.finalCategory).toBe('Nacionales');
    expect(r.classificationSource).toBe('editor');
    expect(resolvePublicCategory(a)).toBe('Nacionales');
  });

  it('TEST 4: Editor INTERNACIONAL + gobierno extranjero afecta a nicaragüenses → Internacionales', () => {
    const a = article(
      'Gobierno de otro país anuncia medida que afecta a nicaragüenses',
      'Una medida del extranjero tendrá repercusiones para ciudadanos nicaragüenses.',
      'Internacionales',
    );
    const r = resolveEditorialClassification(a);
    expect(r.finalCategory).toBe('Internacionales');
    expect(r.classificationSource).toBe('editor');
    expect(resolvePublicCategory(a)).toBe('Internacionales');
  });

  it('TEST 5: Editor NACIONAL + estudio extranjero sobre terremotos en Nicaragua → Nacionales', () => {
    const a = article(
      'Estudio científico extranjero analiza terremotos que podrían afectar Nicaragua',
      'Investigadores internacionales publicaron un análisis sobre sismos con impacto en Nicaragua.',
      'Nacionales',
    );
    const r = resolveEditorialClassification(a);
    expect(r.finalCategory).toBe('Nacionales');
    expect(r.classificationSource).toBe('editor');
    expect(resolvePublicCategory(a)).toBe('Nacionales');
  });

  it('TEST 6: Editor INTERNACIONAL + nicaragüenses en el extranjero → Internacionales, puede reportar conflicto', () => {
    const a = article(
      'Nicaragüenses desaparecidos o fallecidos en el extranjero',
      'Varios connacionales fueron reportados como fallecidos fuera del país.',
      'Internacionales',
    );
    const r = resolveEditorialClassification(a);
    expect(r.finalCategory).toBe('Internacionales');
    expect(r.classificationSource).toBe('editor');
    expect(resolvePublicCategory(a)).toBe('Internacionales');
  });

  it('TEST 7: Editor NACIONAL + cooperación extranjera para proyecto nacional → Nacionales', () => {
    const a = article(
      'Nicaragua recibe cooperación extranjera para proyecto nacional',
      'Un organismo internacional financia un proyecto que se ejecuta en Nicaragua.',
      'Nacionales',
    );
    const r = resolveEditorialClassification(a);
    expect(r.finalCategory).toBe('Nacionales');
    expect(r.classificationSource).toBe('editor');
    expect(resolvePublicCategory(a)).toBe('Nacionales');
  });

  it('TEST 8: Editor NACIONAL + Panamá solo como contexto → Nacionales con CATEGORY_CONFLICT', () => {
    const a = article(
      'Proyecto nacional avanza mientras Panamá estudia similar iniciativa',
      'La obra en Nicaragua avanza. Panamá también analiza una propuesta parecida.',
      'Nacionales',
    );
    const r = resolveEditorialClassification(a);
    expect(r.finalCategory).toBe('Nacionales');
    expect(r.classificationSource).toBe('editor');
    expect(r.classificationConflict).toBe(true);
    expect(r.classificationStatus).toBe('CATEGORY_CONFLICT');
    expect(r.classificationReason).toContain('señales de Internacionales');
    expect(resolvePublicCategory(a)).toBe('Nacionales');
  });

  it('TEST 9: Editor INTERNACIONAL + Nicaragua en comparación regional → Internacionales, puede reportar conflicto', () => {
    const a = article(
      'Artículo sobre Nicaragua dentro de una comparación regional',
      'Se comparan políticas de Nicaragua con las de otros países de la región.',
      'Internacionales',
    );
    const r = resolveEditorialClassification(a);
    expect(r.finalCategory).toBe('Internacionales');
    expect(r.classificationSource).toBe('editor');
    expect(resolvePublicCategory(a)).toBe('Internacionales');
  });

  it('TEST NO OVERWRITE: editor NACIONAL + IA sugiere INTERNACIONAL mantiene Nacionales', () => {
    const a: Partial<Noticia> = {
      titulo: 'Proyecto en Nicaragua avanza con apoyo internacional',
      contenido: 'Una delegación de Panamá, México y Costa Rica colabora con Nicaragua.',
      resumen: 'Visita internacional en Nicaragua',
      categoria: 'Nacionales',
    };
    const r = resolveEditorialClassification(a);
    expect(r.finalCategory).toBe('Nacionales');
    expect(r.classificationSource).toBe('editor');
    expect(r.classificationConflict).toBe(true);
    expect(r.classificationStatus).toBe('CATEGORY_CONFLICT');
    expect(r.classificationReason).toContain('mantiene');
  });

  it('TEST AUSENCIA CATEGORÍA: sin categoría editor, IA clasifica con source AI y confianza', () => {
    const a: Partial<Noticia> = {
      titulo: 'NASA registra bola de fuego que cruzó seis estados de EE.UU.',
      contenido: 'La NASA confirmó un fenómeno visto en Estados Unidos.',
      resumen: 'Bola de fuego en EE.UU.',
    };
    const r = resolveEditorialClassification(a);
    expect(r.finalCategory).toBe('Internacionales');
    expect(r.classificationSource).toBe('AI');
    expect(r.classificationConfidence).toBeGreaterThan(0);
    expect(r.classificationReason).toContain('MENI sugiere');
    expect(r.classificationReason).toContain('confianza');
    expect(resolvePublicCategory(a)).toBe('Internacionales');
  });

  it('TEST CASO REAL A: Centro de monitoreo → trazabilidad completa', () => {
    const a: Partial<Noticia> = {
      titulo: 'Centro de monitoreo en Nicaragua para terremotos y otros fenómenos',
      contenido: 'El nuevo centro de monitoreo ubicado en Nicaragua detectará terremotos y alertará a la población.',
      resumen: 'Centro de monitoreo en Nicaragua para terremotos',
      categoria: 'Nacionales',
    };
    const r = resolveEditorialClassification(a);
    expect(r.editorCategory).toBe('Nacionales');
    expect(r.finalCategory).toBe('Nacionales');
    expect(r.classificationSource).toBe('editor');
    expect(r.classificationReason).toBeTruthy();
  });

  it('TEST CASO REAL B: Nicaragüense muere en Panamá → trazabilidad completa', () => {
    const a: Partial<Noticia> = {
      titulo: 'Nicaragüense muere en Panamá',
      contenido: 'Una mujer nicaragüense falleció en Panamá.',
      resumen: 'Nicaragüense muere en Panamá',
      categoria: 'Internacionales',
    };
    const r = resolveEditorialClassification(a);
    expect(r.editorCategory).toBe('Internacionales');
    expect(r.finalCategory).toBe('Internacionales');
    expect(r.classificationSource).toBe('editor');
    expect(r.classificationReason).toBeTruthy();
  });
});
