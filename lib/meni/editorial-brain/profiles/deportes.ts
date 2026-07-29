import type { CategoryProfile } from './types';

export const deportesProfile: CategoryProfile = {
  categoria: 'Deportes',
  descripcion: 'Resultados, torneos, selecciones, atletas',
  preguntasEditor: [
    'Cual fue el resultado?',
    'Quienes jugaron?',
    'Donde y cuando fue?',
    'Que significa este resultado?',
    'Como queda la tabla?',
    'Cual es el proximo partido?',
    'Hubo figuras destacadas?',
  ],
  pesosAdnNI: {
    exclusividad: 0.15,
    wow: 0.20,
    selloNI: 0.40,
    transcripcion: 0.15,
    memoria: 0.10,
  },
  pesosSelloNI: {
    explica: 0.20,
    contextualiza: 0.20,
    servicio: 0.10,
    originalidad: 0.10,
    competencia: 0.10,
    utilidad: 0.10,
    valor: 0.20,
  },
  umbralesBloqueo: {
    exclusividad: 50,
    wow: 55,
    transcripcion: 70,
    memoria: 20,
  },
  promptLlm: 'Sos un editor de deportes. Lo mas importante es: resultado, quien jugo, donde y cuando, que significa, como queda la tabla, proximo partido, y figuras destacadas. No preguntes sobre consecuencias economicas.',
  enfoqueDiferencial: 'Analisis del resultado, estadisticas, como queda la tabla, y que viene ahora para el equipo.',
};
