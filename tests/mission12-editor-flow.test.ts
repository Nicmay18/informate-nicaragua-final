// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { runMeni } from '@/lib/meni';
import { resolveEditorialClassification } from '@/lib/editorial/canonical';
import type { NoticiaInput } from '@/lib/meni';

function baseInput(overrides: Partial<NoticiaInput>): NoticiaInput {
  return {
    titulo: 'Noticia de prueba',
    contenido: 'Contenido de prueba',
    resumen: 'Resumen de prueba',
    categoria: 'General',
    autor: 'Tester',
    fecha: new Date().toISOString(),
    slug: 'prueba',
    ...overrides,
  };
}

describe('Misión 12 — Flujo EDITOR UI → MENI → RESULTADO', () => {
  it(
    '1. Editor selecciona Nacionales y MENI mantiene Nacionales',
    { timeout: 30000 },
    () => {
      const input = baseInput({
        titulo: 'Centro de monitoreo en Nicaragua fortalece vigilancia ante terremotos y otros fenómenos naturales',
        contenido: 'El gobierno de Nicaragua inauguró un centro de monitoreo para terremotos y fenómenos naturales.',
        resumen: 'Centro de monitoreo en Nicaragua para terremotos y otros fenómenos naturales',
        categoria: 'Nacionales',
      });
      const result = runMeni(input);
      expect(result.editorCategory).toBe('Nacionales');
      expect(result.categoria).toBe('Nacionales');
      expect(result.classificationSource).toBe('editor');
      expect(result.classificationConflict).toBe(false);
      expect(result.classificationStatus).toBe('OK');
    }
  );

  it(
    '2. Editor selecciona Internacionales y MENI mantiene Internacionales',
    { timeout: 30000 },
    () => {
      const input = baseInput({
        titulo: 'Nicaragüense muere en Panamá y autoridades investigan las circunstancias del hecho',
        contenido: 'Una ciudadana nicaragüense falleció en territorio panameño.',
        resumen: 'Nicaragüense muere en Panamá',
        categoria: 'Internacionales',
      });
      const result = runMeni(input);
      expect(result.editorCategory).toBe('Internacionales');
      expect(result.categoria).toBe('Internacionales');
      expect(result.classificationSource).toBe('editor');
      expect(result.classificationConflict).toBe(false);
    }
  );

  it(
    '3. Conflicto: editor Nacionales + contenido internacional → finalCategory Nacionales con conflicto',
    { timeout: 30000 },
    () => {
      const input = baseInput({
        titulo: 'Proyecto en Nicaragua avanza con apoyo internacional',
        contenido: 'Una delegación de Panamá, México y Costa Rica colabora con Nicaragua en la instalación.',
        resumen: 'Visita internacional en Nicaragua',
        categoria: 'Nacionales',
      });
      const result = runMeni(input);
      expect(result.categoria).toBe('Nacionales');
      expect(result.editorCategory).toBe('Nacionales');
      expect(result.classificationSource).toBe('editor');
      expect(result.classificationConflict).toBe(true);
      expect(result.classificationStatus).toBe('CATEGORY_CONFLICT');
      expect(result.suggestedCategory).toBe('Internacionales');
      expect(result.classificationReason).toContain('mantiene');
    }
  );

  it(
    '4. Inverso: editor Internacionales + contenido nacional → finalCategory Internacionales con conflicto',
    { timeout: 30000 },
    () => {
      const input = baseInput({
        titulo: 'Gobierno de Nicaragua inaugura centro de monitoreo de emergencias',
        contenido: 'El gobierno de Nicaragua inauguró un centro de monitoreo para emergencias.',
        resumen: 'Centro de monitoreo nacional',
        categoria: 'Internacionales',
      });
      const result = runMeni(input);
      expect(result.categoria).toBe('Internacionales');
      expect(result.editorCategory).toBe('Internacionales');
      expect(result.classificationSource).toBe('editor');
      expect(result.classificationConflict).toBe(true);
      expect(result.classificationStatus).toBe('CATEGORY_CONFLICT');
    }
  );

  it(
    '5. Sin categoría explícita: MENI sugiere automáticamente',
    { timeout: 30000 },
    () => {
      const input = baseInput({
        titulo: 'NASA registra bola de fuego que cruzó seis estados de EE.UU.',
        contenido: 'La NASA confirmó un fenómeno visto en Estados Unidos.',
        resumen: 'Bola de fuego en EE.UU.',
        categoria: 'General',
      });
      const result = runMeni(input);
      expect(result.editorCategory).toBeUndefined();
      expect(result.classificationSource).toBe('AI');
      expect(result.suggestedCategory).toBeDefined();
      expect(result.classificationReason).toBeTruthy();
      expect(result.classificationConfidence).toBeGreaterThan(0);
    }
  );

  it('6. Perfil sucesos NO sobrescribe categoría Espectáculos en el resolver canónico', () => {
    const resolved = resolveEditorialClassification({
      titulo: 'Toro embiste a hombre durante Tope de Toros en Managua',
      contenido: 'Un hombre resultó herido durante el Tope de Toros en Managua. Fue atendido por paramédicos.',
      resumen: 'Incidente en Tope de Toros',
      categoria: 'Espectáculos',
      perfil: 'sucesos',
    });
    expect(resolved.finalCategory).toBe('Espectáculos');
    expect(resolved.editorCategory).toBe('Espectáculos');
    expect(resolved.classificationSource).toBe('editor');
    expect(resolved.classificationConflict).toBe(true);
    expect(resolved.suggestedCategory).toBe('Sucesos');
  });

  it(
    '7. Persistencia: la categoría seleccionada sobrevive intacta en el resultado',
    { timeout: 30000 },
    () => {
      const input = baseInput({
        titulo: 'Centro de monitoreo en Nicaragua',
        contenido: 'El gobierno de Nicaragua activa centro de monitoreo.',
        resumen: 'Centro de monitoreo',
        categoria: 'Nacionales',
      });
      const result = runMeni(input);
      expect(result.categoria).toBe(input.categoria);
      expect(result.classificationSource).toBe('editor');
      expect(result.classificationConflict).toBe(false);
    }
  );
});
