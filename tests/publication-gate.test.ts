import { describe, it, expect } from 'vitest';
import { computePublicationAllowed } from '@/lib/meni/editor-autonomo/decision';

describe('Decisión final de publicación — inmutable', () => {
  it('1. QuoteGuard PASS + MENI PASS → permitido', () => {
    expect(computePublicationAllowed({
      editorialPublicar: true, qualityGateBloqueado: false, quoteGuardOk: true,
    })).toBe(true);
  });

  it('2. QuoteGuard FAIL + MENI PASS → bloqueado', () => {
    expect(computePublicationAllowed({
      editorialPublicar: true, qualityGateBloqueado: false, quoteGuardOk: false,
    })).toBe(false);
  });

  it('3. QuoteGuard PASS + MENI FAIL → bloqueado', () => {
    expect(computePublicationAllowed({
      editorialPublicar: false, qualityGateBloqueado: false, quoteGuardOk: true,
    })).toBe(false);
  });

  it('4. QuoteGuard FAIL + MENI FAIL → bloqueado', () => {
    expect(computePublicationAllowed({
      editorialPublicar: false, qualityGateBloqueado: false, quoteGuardOk: false,
    })).toBe(false);
  });

  it('5. Supervisor FAIL → bloqueado', () => {
    expect(computePublicationAllowed({
      editorialPublicar: true, qualityGateBloqueado: false, quoteGuardOk: true,
      supervisorApproved: false,
    })).toBe(false);
  });

  it('6. Quality Gate FAIL → bloqueado', () => {
    expect(computePublicationAllowed({
      editorialPublicar: true, qualityGateBloqueado: true, quoteGuardOk: true,
    })).toBe(false);
  });

  it('7. ningún FAIL puede revertirse — composición AND pura', () => {
    // Toda combinación con al menos un FAIL debe dar false.
    const flags = [true, false];
    for (const eb of flags) for (const qg of flags) for (const quo of flags) for (const sup of flags) {
      const allowed = computePublicationAllowed({
        editorialPublicar: eb,
        qualityGateBloqueado: qg,
        quoteGuardOk: quo,
        supervisorApproved: sup,
      });
      const expected = eb && !qg && quo && sup;
      expect(allowed).toBe(expected);
    }
  });
});
