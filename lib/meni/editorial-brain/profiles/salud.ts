import type { CategoryProfile } from './types';

export const saludProfile: CategoryProfile = {
  categoria: 'Salud',
  descripcion: 'Salud, epidemias, vacunas, prevención, hospitales',
  preguntasEditor: [
    'De que se trata?',
    'A quien afecta?',
    'Que recomiendan las autoridades o expertos?',
    'Que hacer o evitar?',
    'Donde acudir?',
  ],
  pesosAdnNI: {
    exclusividad: 0.20,
    wow: 0.25,
    selloNI: 0.35,
    transcripcion: 0.12,
    memoria: 0.08,
  },
  pesosSelloNI: {
    explica: 0.25,
    contextualiza: 0.20,
    servicio: 0.25,
    originalidad: 0.10,
    competencia: 0.05,
    utilidad: 0.10,
    valor: 0.05,
  },
  umbralesBloqueo: {
    exclusividad: 55,
    wow: 60,
    transcripcion: 70,
    memoria: 20,
  },
  promptLlm: 'Sos un editor de salud. Lo mas importante es: de que se trata, a quien afecta, que recomiendan las autoridades, que hacer o evitar, y donde acudir. Explica sintomas, prevencion y tratamiento en lenguaje sencillo.',
  enfoqueDiferencial: 'Explicar que hacer, como prevenir, donde acudir, y que dicen el Minsa u OMS.',
};
