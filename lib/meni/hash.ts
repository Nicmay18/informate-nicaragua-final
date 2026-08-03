/**
 * MENI Input Hash
 * ===============
 * Deterministic hash of the article input used for traceability.
 * Same input must produce same hash.
 */

export function computeInputHash(input: {
  titulo: string;
  resumen?: string;
  contenido: string;
  categoria?: string;
  autor?: string;
}): string {
  const key = [
    input.titulo?.trim() || '',
    input.resumen?.trim() || '',
    input.contenido?.trim() || '',
    input.categoria?.trim() || '',
    input.autor?.trim() || '',
  ].join('||');

  let h = 0;
  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i);
    h = (h << 5) - h + c;
    h = h & h;
  }
  const hash = Math.abs(h).toString(36).padStart(12, '0');
  return `meni-${hash}`;
}
