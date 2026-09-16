// tests/nios/reader-experience/reader-experience.test.ts
// Tests obligatorios del ReaderExperienceEngine (Fase 2.2).

import { describe, it, expect } from 'vitest';
import { makeContent } from '@/tests/nios/validators/adversarial-helpers';
import { baseNoticia } from '@/tests/nios/validators/adversarial-helpers';
import {
  antorchaContenido,
  antorchaFuenteOrigen,
  antorchaPuntosClaveTruncados,
} from '@/tests/fixtures/antorcha';
import {
  validateArticle,
  detect,
  runReaderExperienceEngine,
  puntosClaveRepairer,
} from '@/lib/nios/reader-experience';
import type { Repairer } from '@/lib/nios/reader-experience/types';

const VALID_TITULO = 'Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre';
const VALID_RESUMEN =
  'La iniciativa centroamericana recorrerá Nicaragua durante cuatro días de septiembre y busca fortalecer la unión de los pueblos antes de entregar la antorcha a Costa Rica. Organizadores locales confirmaron que estudiantes y autoridades acompañarán el trayecto.';
const VALID_FUENTE = 'Ministerio de Educación de Nicaragua';

function reparableNoticia() {
  return baseNoticia({
    titulo: VALID_TITULO,
    resumen: VALID_RESUMEN,
    contenido: antorchaContenido + makeContent(300, 3),
    fuente: VALID_FUENTE,
    puntosClave: antorchaPuntosClaveTruncados,
  });
}

function validNoticia() {
  return baseNoticia({
    titulo: VALID_TITULO,
    resumen: VALID_RESUMEN,
    contenido: makeContent(400, 3),
    fuente: VALID_FUENTE,
    puntosClave: [
      antorchaFuenteOrigen.primerPunto,
      antorchaFuenteOrigen.segundoPunto,
      antorchaFuenteOrigen.tercerPunto,
    ],
  });
}

function invalidTitleNoticia() {
  return baseNoticia({
    titulo: 'X',
    resumen: VALID_RESUMEN,
    contenido: makeContent(400, 3),
    fuente: VALID_FUENTE,
  });
}

// ============================================================
// 1. DETECT
// ============================================================

describe('ReaderExperienceEngine — fase DETECT', () => {
  it('1. DETECT no modifica el artículo de entrada', () => {
    const n = reparableNoticia();
    const before = JSON.stringify(n);
    detect(n);
    expect(JSON.stringify(n)).toBe(before);
  });

  it('2. DETECT devuelve problemas con evidencia y confianza del 100%', () => {
    const n = reparableNoticia();
    const issues = detect(n);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((i) => i.confidence === 1)).toBe(true);
    expect(issues.every((i) => i.evidence && i.evidence.length > 0)).toBe(true);
  });

  it('3. DETECT propone reparación cuando existe una segura', () => {
    const n = reparableNoticia();
    const issues = detect(n);
    const pk = issues.find((i) => i.field === 'puntosClave');
    expect(pk).toBeDefined();
    expect(pk?.proposedRepair).toBeDefined();
    expect(pk?.proposedRepair?.field).toBe('puntosClave');
  });

  it('4. DETECT no propone reparación para issues sin reparador', () => {
    const n = invalidTitleNoticia();
    const issues = detect(n);
    const title = issues.find((i) => i.field === 'titulo');
    expect(title).toBeDefined();
    expect(title?.proposedRepair).toBeUndefined();
  });
});

// ============================================================
// 2. VALIDATE
// ============================================================

describe('ReaderExperienceEngine — fase VALIDATE', () => {
  it('5. VALIDATE utiliza los validators congelados como autoridad', () => {
    const n = invalidTitleNoticia();
    const result = validateArticle(n);
    expect(result.issues.some((i) => i.field === 'titulo' && i.code === 'T1.2')).toBe(true);
  });

  it('6. VALIDATE considera un artículo sin issues bloqueantes como válido', () => {
    const n = validNoticia();
    const result = validateArticle(n);
    expect(result.valid).toBe(true);
  });

  it('7. VALIDATE detecta issues bloqueantes y los reporta', () => {
    const n = reparableNoticia();
    const result = validateArticle(n);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.blocking)).toBe(true);
  });
});

// ============================================================
// 3. SAFE REPAIR
// ============================================================

describe('ReaderExperienceEngine — fase SAFE REPAIR', () => {
  it('8. SAFE REPAIR registra before, proposedChange, after y validationResult', () => {
    const n = reparableNoticia();
    const applied = puntosClaveRepairer.apply(n);
    expect(applied).toBeDefined();
    expect(applied?.records.length).toBeGreaterThan(0);
    const record = applied!.records[0];
    expect(record).toHaveProperty('before');
    expect(record).toHaveProperty('proposedChange');
    expect(record).toHaveProperty('after');
    expect(record).toHaveProperty('validationResult');
  });

  it('9. SAFE REPAIR repara los puntos clave truncados con oraciones originales', () => {
    const n = reparableNoticia();
    const result = runReaderExperienceEngine(n);
    expect(result.status).toBe('committed');
    expect(result.final.puntosClave).toEqual([
      antorchaFuenteOrigen.primerPunto,
      antorchaFuenteOrigen.segundoPunto,
      antorchaFuenteOrigen.tercerPunto,
    ]);
  });

  it('10. SAFE REPAIR solo modifica el campo objetivo', () => {
    const n = reparableNoticia();
    const result = runReaderExperienceEngine(n);
    expect(result.changes).toHaveProperty('puntosClave');
    expect(Object.keys(result.changes).sort()).toEqual(['puntosClave']);
  });
});

// ============================================================
// 4. VALIDATE AGAIN + COMMIT / ROLLBACK
// ============================================================

describe('ReaderExperienceEngine — VALIDATE AGAIN, COMMIT y ROLLBACK', () => {
  it('11. COMMIT cuando la reparación es válida y la segunda validación pasa', () => {
    const n = reparableNoticia();
    const result = runReaderExperienceEngine(n);
    expect(result.status).toBe('committed');
    expect(result.post.valid).toBe(true);
  });

  it('12. ROLLBACK cuando la reparación introduce un issue bloqueante', () => {
    const n = reparableNoticia();
    const badRepairer: Repairer = {
      name: 'bad-pk11',
      rule: 'PK11_INJECTION',
      field: 'puntosClave',
      allowedFields: ['puntosClave'],
      canRepair: (_, issues) => issues.some((i) => i.field === 'puntosClave'),
      propose: (noticia) => ({
        repairer: 'bad-pk11',
        rule: 'PK11_INJECTION',
        field: 'puntosClave',
        reason: 'Inyectar punto idéntico al título',
        before: noticia.puntosClave,
        after: [noticia.titulo + '.'],
      }),
      apply: (noticia) => ({
        noticia: { ...noticia, puntosClave: [noticia.titulo + '.'] },
        records: [
          {
            field: 'puntosClave',
            before: noticia.puntosClave,
            proposedChange: [noticia.titulo + '.'],
            after: [noticia.titulo + '.'],
            validationResult: { valid: true, issues: [] },
          },
        ],
      }),
    };
    const result = runReaderExperienceEngine(n, { repairers: [badRepairer] });
    expect(result.status).toBe('rolled_back');
    expect(result.post.issues.some((i) => i.code === 'PK11')).toBe(true);
    expect(result.final).toEqual(n);
  });

  it('13. ROLLBACK cuando el problema objetivo persiste tras reparar', () => {
    const n = reparableNoticia();
    const noOpRepairer: Repairer = {
      name: 'noop',
      rule: 'NO_FIX',
      field: 'puntosClave',
      allowedFields: ['puntosClave'],
      canRepair: (_, issues) => issues.some((i) => i.field === 'puntosClave'),
      propose: (noticia) => ({
        repairer: 'noop',
        rule: 'NO_FIX',
        field: 'puntosClave',
        reason: 'No aplicar cambio',
        before: noticia.puntosClave,
        after: noticia.puntosClave,
      }),
      apply: (noticia) => ({
        noticia: { ...noticia },
        records: [],
      }),
    };
    const result = runReaderExperienceEngine(n, { repairers: [noOpRepairer] });
    expect(result.status).toBe('rolled_back');
    expect(result.final).toEqual(n);
  });

  it('14. COMMIT aplica exactamente los cambios validados', () => {
    const n = reparableNoticia();
    const result = runReaderExperienceEngine(n);
    expect(result.status).toBe('committed');
    expect(result.changes.puntosClave.before).toEqual(n.puntosClave);
    expect(result.changes.puntosClave.after).toEqual(result.final.puntosClave);
  });

  it('15. ROLLBACK restaura el estado original sin cambios parciales', () => {
    const n = reparableNoticia();
    const badRepairer: Repairer = {
      name: 'half-baked',
      rule: 'PK_INVALID',
      field: 'puntosClave',
      allowedFields: ['puntosClave'],
      canRepair: (_, issues) => issues.some((i) => i.field === 'puntosClave'),
      propose: (noticia) => ({
        repairer: 'half-baked',
        rule: 'PK_INVALID',
        field: 'puntosClave',
        reason: 'Punto mal formado',
        before: noticia.puntosClave,
        after: ['punto mal formado'],
      }),
      apply: (noticia) => ({
        noticia: { ...noticia, puntosClave: ['punto mal formado'] },
        records: [
          {
            field: 'puntosClave',
            before: noticia.puntosClave,
            proposedChange: ['punto mal formado'],
            after: ['punto mal formado'],
            validationResult: { valid: true, issues: [] },
          },
        ],
      }),
    };
    const result = runReaderExperienceEngine(n, { repairers: [badRepairer] });
    expect(result.status).toBe('rolled_back');
    expect(result.final.puntosClave).toEqual(n.puntosClave);
    expect(result.final).toEqual(n);
  });

  it('16. BLOCKED cuando no existe reparador seguro para el issue', () => {
    const n = invalidTitleNoticia();
    const result = runReaderExperienceEngine(n);
    expect(result.status).toBe('blocked');
  });
});

// ============================================================
// 5. IDEMPOTENCIA
// ============================================================

describe('ReaderExperienceEngine — idempotencia', () => {
  it('17. Segundo run sobre artículo ya válido devuelve no_changes', () => {
    const n = validNoticia();
    const first = runReaderExperienceEngine(n);
    expect(first.status).toBe('no_changes');
    const second = runReaderExperienceEngine(first.final);
    expect(second.status).toBe('no_changes');
  });

  it('18. Run sobre noticia reparada no genera cambios adicionales', () => {
    const n = reparableNoticia();
    const first = runReaderExperienceEngine(n);
    expect(first.status).toBe('committed');
    const second = runReaderExperienceEngine(first.final);
    expect(second.status).toBe('no_changes');
  });
});

// ============================================================
// 6. SEGURIDAD Y AUDITORÍA
// ============================================================

describe('ReaderExperienceEngine — seguridad y auditoría', () => {
  it('19. El motor es puro: no modifica el objeto de entrada', () => {
    const n = reparableNoticia();
    const before = JSON.stringify(n);
    runReaderExperienceEngine(n);
    expect(JSON.stringify(n)).toBe(before);
  });

  it('20. El motor nunca inventa datos: reparación usa oraciones originales', () => {
    const n = reparableNoticia();
    const result = runReaderExperienceEngine(n);
    expect(result.status).toBe('committed');
    for (const punto of result.final.puntosClave ?? []) {
      expect(n.contenido).toContain(punto.replace(/[.!?]+$/, ''));
    }
  });

  it('21. El resultado no incluye estados de publicación automática', () => {
    const n = reparableNoticia();
    const result = runReaderExperienceEngine(n);
    expect(result.status).not.toBe('published');
    expect(result.status).not.toBe('auto_published');
    expect(result).not.toHaveProperty('publicado');
  });

  it('22. La bitácora de auditoría registra todas las fases ejecutadas', () => {
    const n = reparableNoticia();
    const result = runReaderExperienceEngine(n);
    const stages = result.audit.steps.map((s) => s.stage);
    expect(stages).toContain('detect');
    expect(stages).toContain('validate');
    expect(stages).toContain('repair');
    expect(stages).toContain('validate_again');
    expect(stages).toContain('commit');
  });
});

// ============================================================
// 7. CONFIGURACIÓN
// ============================================================

describe('ReaderExperienceEngine — configuración', () => {
  it('23. maxRepairs evita reparaciones masivas ilimitadas', () => {
    const n = reparableNoticia();
    const result = runReaderExperienceEngine(n, { maxRepairs: 0 });
    expect(result.repair.applied).toBe(false);
    expect(result.repair.records.length).toBe(0);
    expect(result.status).toBe('rolled_back');
  });

  it('24. allowedFields rechaza reparadores que tocan campos ajenos', () => {
    const n = reparableNoticia();
    const scopeRepairer: Repairer = {
      name: 'scope-violation',
      rule: 'SCOPE',
      field: 'puntosClave',
      allowedFields: ['resumen'], // se declara para resumen, no puntosClave
      canRepair: (_, issues) => issues.some((i) => i.field === 'puntosClave'),
      propose: (noticia) => ({
        repairer: 'scope-violation',
        rule: 'SCOPE',
        field: 'resumen',
        reason: 'Cambiar resumen',
        before: noticia.resumen,
        after: noticia.resumen,
      }),
      apply: (noticia) => ({
        noticia: { ...noticia },
        records: [],
      }),
    };
    const result = runReaderExperienceEngine(n, {
      repairers: [scopeRepairer],
      allowedFields: ['resumen'],
    });
    expect(result.repair.applied).toBe(false);
    expect(result.repair.records.length).toBe(0);
    expect(result.status).toBe('rolled_back');
  });
});
