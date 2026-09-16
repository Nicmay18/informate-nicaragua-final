import type { Noticia } from '@/lib/types';

/**
 * Issue generado por un validator.
 * Contrato: funciones puras que reciben Noticia/subconjunto y devuelven Issue[].
 */
export interface Issue {
  code: string;
  field: string;
  message: string;
  blocking: boolean;
}

/**
 * Registro de una reparación intentada.
 * Estructura: before → proposedChange → after.
 * Si validationResult.valid es false, after === before (rollback).
 */
export interface RepairRecord {
  field: string;
  before: unknown;
  proposedChange: unknown;
  after: unknown;
  validationResult: {
    valid: boolean;
    issues: Issue[];
  };
}

/**
 * Resultado de reparar puntos clave.
 * puntosClave es null cuando no existe reparación segura: se oculta el módulo.
 */
export interface PuntosClaveRepairResult {
  puntosClave: string[] | null;
  records: RepairRecord[];
}

/**
 * Función validator canónica para campos del artículo.
 */
export type ArticleValidator = (noticia: Noticia) => Issue[];
