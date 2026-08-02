import type { NiosModuleReport, NiosRecommendation } from './types';
import { rec } from './utils';

export interface CompetitorTopic {
  topic: string;
  coverage: 'covered' | 'not_covered' | 'partial';
  opportunity: string;
}

export async function runCompetitorIntelligence(): Promise<NiosModuleReport> {
  const _topics: CompetitorTopic[] = [
    { topic: 'Comparación de medios no está automatizada', coverage: 'not_covered', opportunity: 'Requiere integración futura con fuentes externas.' },
  ];
  void _topics;

  const recommendations: NiosRecommendation[] = [
    rec(
      'Competitor Intelligence requiere configuración externa',
      'No se tienen feeds ni APIs de competidores conectadas.',
      'info',
      'Configurar monitoreo manual ético de medios nacionales e internacionales; luego conectar fuentes RSS/API respetando propiedad intelectual.',
      'competitors'
    ),
    rec(
      'Identificar temas no cubiertos por Nicaragua Informate',
      'Módulo listo para recibir comparaciones cuando haya fuentes.',
      'low',
      'Documentar lista de competidores y tópicos a monitorear en la fase 2 del NIOS.',
      'competitors'
    ),
  ];

  return {
    module: 'competitors',
    status: 'not_implemented',
    summary: 'Competitor Intelligence: esperando fuentes externas. No se realizan comparaciones automáticas.',
    metrics: [
      { label: 'Fuentes conectadas', value: 0 },
      { label: 'Temas comparados', value: 0 },
      { label: 'Oportunidades detectadas', value: 0 },
    ],
    recommendations,
  };
}
