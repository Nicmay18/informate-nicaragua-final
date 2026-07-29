export interface AdnNiWeights {
  exclusividad: number;
  wow: number;
  selloNI: number;
  transcripcion: number;
  memoria: number;
}

export interface SelloNiWeights {
  explica: number;
  contextualiza: number;
  servicio: number;
  originalidad: number;
  competencia: number;
  utilidad: number;
  valor: number;
}

export interface BloqueoThresholds {
  exclusividad: number;
  wow: number;
  transcripcion: number;
  memoria: number;
}

export interface CategoryProfile {
  categoria: string;
  descripcion: string;
  preguntasEditor: string[];
  pesosAdnNI: AdnNiWeights;
  pesosSelloNI: SelloNiWeights;
  umbralesBloqueo: BloqueoThresholds;
  promptLlm: string;
  enfoqueDiferencial: string;
}
