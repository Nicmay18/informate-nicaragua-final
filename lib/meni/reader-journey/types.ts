/**
 * Reader Journey Engine — Types
 * =============================
 * MENI v7: No es lo mismo informar que enseñar.
 *
 * Mapea el viaje del lector:
 * ¿Qué sabe? → ¿Qué necesita saber? → ¿Qué entenderá? → ¿Qué recordará?
 *
 * El sello de Nicaragua Informate: "aquí sí explican la noticia".
 */

export interface ReaderJourneyResult {
  queSabe: string[];
  queNecesitaSaber: string[];
  queEntendera: string[];
  queRecordara: string[];
  brechaDeConocimiento: string[];
  objetivoPedagogico: string;
  score: number;
}

export interface ReaderJourneyInput {
  titulo: string;
  contenido: string;
  fuente?: string;
  categoria?: string;
}
