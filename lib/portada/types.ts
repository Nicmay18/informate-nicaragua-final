import type { Noticia } from '@/lib/types';
import type { ResultadoEditorial } from '@/lib/editorial';

export type PortadaSectionId =
  | 'principal'
  | 'destacadas'
  | 'ultimas'
  | 'mas_leidas'
  | 'recomendadas_ia'
  | 'ocultas';

export interface PortadaItem {
  noticia: Noticia;
  resultado: ResultadoEditorial;
}

export interface PortadaSlot {
  id: string;
  section: PortadaSectionId;
  position: number;
  slug: string;
  pinned?: boolean;
}

export interface ScheduledReplacement {
  id: string;
  slotId: string;
  section: PortadaSectionId;
  replacementSlug: string;
  scheduledAt: string;
}

export interface PortadaConfig {
  sections: Record<PortadaSectionId, PortadaSlot[]>;
  scheduledReplacements: ScheduledReplacement[];
  version: number;
  updatedAt: string;
}

export interface PortadaCandidatesResponse {
  items: PortadaItem[];
  config: PortadaConfig;
}
