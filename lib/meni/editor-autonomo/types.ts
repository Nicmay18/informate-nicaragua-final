import type { MeniResult } from '@/lib/meni';
import type { QualityGateResult } from '@/lib/meni/quality-gate';
import type { EditorBrainResult } from '@/lib/meni/editor-brain';

export interface MeniAutonomousInput {
  fuente: string;
  categoriaSugerida?: string;
  url?: string;
}

export interface MeniAutonomousResult {
  tituloSEO: string;
  bajada: string;
  articuloCompleto: string;
  metaDescripcion: string;
  slug: string;
  tags: string[];
  categoria: string;
  departamento: string;
  promptImagenIA: string;
  copyFacebook: string;
  copyWhatsApp: string;
  copyTelegram: string;
  jsonLd: string;
  checklistEeatDiscover: string;
  diagnosticoEditorial: string;
  diagnosticoTecnico: string;
  riesgoEditorial: 'VERDE' | 'AMARILLO' | 'ROJO';
  riesgoTecnico: 'BAJO' | 'MEDIO' | 'ALTO';
  scoreMeni: number;
  aprobado: boolean;
  correccionesAplicadas: string[];
  recomendaciones: string[];
  evaluacion: MeniResult;
  qualityGatePre?: QualityGateResult;
  qualityGatePost?: QualityGateResult;
  editorBrain?: EditorBrainResult;
  _provider?: string;
  _error?: string;
}
