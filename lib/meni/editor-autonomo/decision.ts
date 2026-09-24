/**
 * Decisión final de publicación — composición única e inmutable.
 * =============================================================
 * Un FAIL de cualquier etapa (Editorial Brain, Quality Gate, Quote Guard,
 * Supervisor) es TERMINAL: ninguna etapa posterior puede revertirlo.
 *
 * publicationAllowed =
 *   editorialBrain.publicar
 *   AND !qualityGate.bloqueado
 *   AND quoteGuard.ok
 *   AND supervisorApproved
 */

export interface PublicationGateInput {
  /** Editorial Brain decidió publicar */
  editorialPublicar: boolean;
  /** Quality Gate no bloqueó */
  qualityGateBloqueado: boolean;
  /** Quote Guard: citas/atribuciones verificadas contra fuente */
  quoteGuardOk: boolean;
  /** Supervisor Editorial aprobó (PUBLICAR / PUBLICAR_CON_CAMBIOS) */
  supervisorApproved?: boolean;
}

export function computePublicationAllowed(input: PublicationGateInput): boolean {
  return (
    input.editorialPublicar === true &&
    input.qualityGateBloqueado === false &&
    input.quoteGuardOk === true &&
    (input.supervisorApproved ?? true) === true
  );
}
