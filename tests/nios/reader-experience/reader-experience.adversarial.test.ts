// tests/nios/reader-experience/reader-experience.adversarial.test.ts
// Tests adversariales diseñados para romper el ReaderExperienceEngine.

import { describe, it, expect } from 'vitest';
import { makeContent } from '@/tests/nios/validators/adversarial-helpers';
import { baseNoticia } from '@/tests/nios/validators/adversarial-helpers';
import { antorchaContenido } from '@/tests/fixtures/antorcha';
import { runReaderExperienceEngine } from '@/lib/nios/reader-experience';
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
    puntosClave: [
      'La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre, luego de ingresar al país por.',
      'En el empalme de San Benito, Boaco, el diputado Juan Hernández entregó la antorcha al delegado de Jinotega en.',
    ],
  });
}

function invalidResumenNoticia() {
  return baseNoticia({
    titulo: VALID_TITULO,
    resumen: 'Corto.',
    contenido: makeContent(400, 3),
    fuente: VALID_FUENTE,
  });
}

function noticiaConPuntoSinOrigen() {
  return baseNoticia({
    titulo: VALID_TITULO,
    resumen: VALID_RESUMEN,
    contenido: makeContent(400, 3),
    fuente: VALID_FUENTE,
    puntosClave: ['Este punto truncado termina en de.'],
  });
}

// ============================================================
// Adversariales: intentan romper el contrato del Engine
// ============================================================

describe('ReaderExperienceEngine — adversarial', () => {
  it('1. Reparación aparente que rompe PK11 (punto = título) → ROLLBACK', () => {
    const n = reparableNoticia();
    const titleCloner: Repairer = {
      name: 'title-cloner',
      rule: 'PK11',
      field: 'puntosClave',
      allowedFields: ['puntosClave'],
      canRepair: (_, issues) => issues.some((i) => i.field === 'puntosClave'),
      propose: (noticia) => ({
        repairer: 'title-cloner',
        rule: 'PK11',
        field: 'puntosClave',
        reason: 'Crear punto con el título',
        before: noticia.puntosClave,
        after: [noticia.titulo + '.'],
      }),
      apply: (noticia) => ({
        noticia: { ...noticia, puntosClave: [noticia.titulo + '.'] },
        records: [],
      }),
    };
    const result = runReaderExperienceEngine(n, { repairers: [titleCloner] });
    expect(result.status).toBe('rolled_back');
    expect(result.post.issues.some((i) => i.code === 'PK11')).toBe(true);
  });

  it('2. Reparador que modifica un campo fuera de su alcance → ROLLBACK', () => {
    const n = reparableNoticia();
    const scopeBreaker: Repairer = {
      name: 'scope-breaker',
      rule: 'TITLE_TOUCH',
      field: 'puntosClave',
      allowedFields: ['resumen'], // incorrecto: debería ser puntosClave
      canRepair: (_, issues) => issues.some((i) => i.field === 'puntosClave'),
      propose: (noticia) => ({
        repairer: 'scope-breaker',
        rule: 'TITLE_TOUCH',
        field: 'puntosClave',
        reason: 'Intentar cambiar resumen y título',
        before: noticia.puntosClave,
        after: noticia.puntosClave,
      }),
      apply: (noticia) => ({
        noticia: { ...noticia, titulo: 'X', resumen: 'Corto' },
        records: [],
      }),
    };
    const result = runReaderExperienceEngine(n, { repairers: [scopeBreaker] });
    expect(result.status).toBe('rolled_back');
    expect(result.final.titulo).toBe(n.titulo);
    expect(result.final.resumen).toBe(n.resumen);
  });

  it('3. Reparador que lanza una excepción en apply → no deja cambios', () => {
    const n = reparableNoticia();
    const thrower: Repairer = {
      name: 'thrower',
      rule: 'EXPLODE',
      field: 'puntosClave',
      allowedFields: ['puntosClave'],
      canRepair: (_, issues) => issues.some((i) => i.field === 'puntosClave'),
      propose: (noticia) => ({
        repairer: 'thrower',
        rule: 'EXPLODE',
        field: 'puntosClave',
        reason: 'Explotar',
        before: noticia.puntosClave,
        after: noticia.puntosClave,
      }),
      apply: () => {
        throw new Error('reparador defectuoso');
      },
    };
    const result = runReaderExperienceEngine(n, { repairers: [thrower] });
    expect(result.final).toEqual(n);
    expect(result.status).toBe('rolled_back');
  });

  it('4. Reparación circular que reproduce el mismo problema → ROLLBACK', () => {
    const n = reparableNoticia();
    const circular: Repairer = {
      name: 'circular',
      rule: 'PK_TRUNCATED',
      field: 'puntosClave',
      allowedFields: ['puntosClave'],
      canRepair: (_, issues) => issues.some((i) => i.field === 'puntosClave'),
      propose: (noticia) => ({
        repairer: 'circular',
        rule: 'PK_TRUNCATED',
        field: 'puntosClave',
        reason: 'Dejar el punto truncado',
        before: noticia.puntosClave,
        after: ['La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de.'],
      }),
      apply: (noticia) => ({
        noticia: { ...noticia, puntosClave: ['La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de.'] },
        records: [],
      }),
    };
    const result = runReaderExperienceEngine(n, { repairers: [circular] });
    expect(result.status).toBe('rolled_back');
    expect(result.post.issues.some((i) => i.code.startsWith('PK'))).toBe(true);
  });

  it('5. Reparador con proposedRepair nulo → BLOCKED', () => {
    const n = invalidResumenNoticia();
    const emptyProposer: Repairer = {
      name: 'empty',
      rule: 'R1.1',
      field: 'resumen',
      allowedFields: ['resumen'],
      canRepair: (_, issues) => issues.some((i) => i.field === 'resumen'),
      propose: () => null,
      apply: () => null,
    };
    const result = runReaderExperienceEngine(n, { repairers: [emptyProposer] });
    expect(result.status).toBe('blocked');
    expect(result.final).toEqual(n);
  });

  it('6. allowedFields global bloquea reparadores que exceden el permiso', () => {
    const n = reparableNoticia();
    const result = runReaderExperienceEngine(n, {
      allowedFields: ['resumen'],
    });
    expect(result.repair.applied).toBe(false);
    expect(result.repair.records.length).toBe(0);
    expect(result.status).toBe('rolled_back');
  });

  it('7. Reparación que inyecta signos duplicados → ROLLBACK por PK16', () => {
    const n = reparableNoticia();
    const noisy: Repairer = {
      name: 'noisy',
      rule: 'PK16',
      field: 'puntosClave',
      allowedFields: ['puntosClave'],
      canRepair: (_, issues) => issues.some((i) => i.field === 'puntosClave'),
      propose: (noticia) => ({
        repairer: 'noisy',
        rule: 'PK16',
        field: 'puntosClave',
        reason: 'Inyectar punto con signos duplicados',
        before: noticia.puntosClave,
        after: ['Texto con signos..'],
      }),
      apply: (noticia) => ({
        noticia: { ...noticia, puntosClave: ['Texto con signos..'] },
        records: [],
      }),
    };
    const result = runReaderExperienceEngine(n, { repairers: [noisy] });
    expect(result.status).toBe('rolled_back');
    expect(result.post.issues.some((i) => i.code === 'PK16')).toBe(true);
  });

  it('8. Punto clave sin origen en el contenido → no inventa datos, oculta el módulo', () => {
    const n = noticiaConPuntoSinOrigen();
    const result = runReaderExperienceEngine(n);
    expect(result.status).toBe('committed');
    expect(result.final.puntosClave).toBeUndefined();
    // Nunca inventa un punto: lo elimina
    expect(result.final.puntosClave).not.toEqual(n.puntosClave);
  });

  it('9. Reparador que propone campos inconsistentes (before != actual) → se ignora', () => {
    const n = reparableNoticia();
    const liar: Repairer = {
      name: 'liar',
      rule: 'PK',
      field: 'puntosClave',
      allowedFields: ['puntosClave'],
      canRepair: (_, issues) => issues.some((i) => i.field === 'puntosClave'),
      propose: (noticia) => ({
        repairer: 'liar',
        rule: 'PK',
        field: 'puntosClave',
        reason: 'Mentir sobre before',
        before: ['valor inventado'],
        after: noticia.puntosClave,
      }),
      apply: (noticia) => ({
        noticia: { ...noticia },
        records: [
          {
            field: 'puntosClave',
            before: ['valor inventado'],
            proposedChange: noticia.puntosClave,
            after: noticia.puntosClave,
            validationResult: { valid: true, issues: [] },
          },
        ],
      }),
    };
    const result = runReaderExperienceEngine(n, { repairers: [liar] });
    // El before mentiroso no provoca commit porque no hay cambios reales
    expect(result.status).toBe('rolled_back');
  });

  it('10. Ejecución repetida sobre artículo bloqueado no genera commit espurio', () => {
    const n = invalidResumenNoticia();
    const first = runReaderExperienceEngine(n);
    expect(first.status).toBe('blocked');
    const second = runReaderExperienceEngine(first.final);
    expect(second.status).toBe('blocked');
  });
});
