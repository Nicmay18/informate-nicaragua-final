import { describe, it, expect } from 'vitest';
import { resolvePage } from '@/lib/pagination';

const PAGE_SIZE = 12;
// Corpus real actual: ~443 publicadas → 37 páginas
const TOTAL_443 = 443;
const LAST_443 = Math.ceil(TOTAL_443 / PAGE_SIZE); // 37

describe('resolvePage — política única de paginación', () => {
  it('page=1 → ok', () => {
    expect(resolvePage('1', TOTAL_443, PAGE_SIZE)).toEqual({ status: 'ok', page: 1, totalPages: LAST_443 });
  });

  it('sin page → página 1', () => {
    expect(resolvePage(undefined, TOTAL_443, PAGE_SIZE)).toEqual({ status: 'ok', page: 1, totalPages: LAST_443 });
  });

  it('page=2 → ok', () => {
    expect(resolvePage('2', TOTAL_443, PAGE_SIZE)).toMatchObject({ status: 'ok', page: 2 });
  });

  it('última página → ok', () => {
    expect(resolvePage(String(LAST_443), TOTAL_443, PAGE_SIZE)).toMatchObject({ status: 'ok', page: LAST_443 });
  });

  it('última página + 1 → 404', () => {
    expect(resolvePage(String(LAST_443 + 1), TOTAL_443, PAGE_SIZE).status).toBe('not_found');
  });

  it('page=99 → 404', () => {
    expect(resolvePage('99', TOTAL_443, PAGE_SIZE).status).toBe('not_found');
  });

  it('page=0 → 404', () => {
    expect(resolvePage('0', TOTAL_443, PAGE_SIZE).status).toBe('not_found');
  });

  it('page negativa → 404', () => {
    expect(resolvePage('-3', TOTAL_443, PAGE_SIZE).status).toBe('not_found');
  });

  it('page no numérica → 404', () => {
    expect(resolvePage('abc', TOTAL_443, PAGE_SIZE).status).toBe('not_found');
  });

  it('page decimal → 404', () => {
    expect(resolvePage('2.5', TOTAL_443, PAGE_SIZE).status).toBe('not_found');
  });

  it('corpus pequeño (10 docs → 1 página): page=2 → 404', () => {
    expect(resolvePage('2', 10, PAGE_SIZE).status).toBe('not_found');
  });

  it('corpus 0 docs → totalPages=1, page=1 ok, page=2 → 404', () => {
    expect(resolvePage('1', 0, PAGE_SIZE)).toMatchObject({ status: 'ok', page: 1, totalPages: 1 });
    expect(resolvePage('2', 0, PAGE_SIZE).status).toBe('not_found');
  });

  it('corpus >300 (501 docs → 42 páginas): página 30 → ok (no vacía)', () => {
    expect(resolvePage('30', 501, PAGE_SIZE)).toMatchObject({ status: 'ok', page: 30 });
  });
});
