export interface EditorialDnaDimension {
  score: number;
  bloquear: boolean;
  razon: string | null;
}

export interface SelloNIDimensions {
  explica: number;
  contextualiza: number;
  servicio: number;
  originalidad: number;
  competencia: number;
  utilidad: number;
  valor: number;
}

export interface EditorialDnaResult {
  exclusividad: EditorialDnaDimension;
  wow: EditorialDnaDimension;
  selloNI: SelloNIDimensions;
  transcripcion: EditorialDnaDimension;
  memoria: EditorialDnaDimension & { totalArticulosRelacionados: number };
  adnNI: number;
  bloquear: boolean;
  motivoBloqueo: string | null;
  detalle: string;
}
