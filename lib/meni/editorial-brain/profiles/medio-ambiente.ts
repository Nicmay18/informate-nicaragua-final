import type { CategoryProfile } from './types';

export const medioAmbienteProfile: CategoryProfile = {
  categoria: 'MedioAmbiente',
  descripcion: 'Clima, desastres naturales, medio ambiente, Ineter, Marena',
  preguntasEditor: [
    'Que fenomeno ocurrio?',
    'Donde y cuando?',
    'Que lo causo?',
    'Como afecta a la poblacion?',
    'Que hacen las autoridades o expertos?',
    'Que debe hacer el lector?',
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
    contextualiza: 0.25,
    servicio: 0.25,
    originalidad: 0.10,
    competencia: 0.05,
    utilidad: 0.05,
    valor: 0.05,
  },
  umbralesBloqueo: {
    exclusividad: 55,
    wow: 60,
    transcripcion: 70,
    memoria: 20,
  },
  promptLlm: 'Sos un editor de medio ambiente. Lo mas importante es: que fenomeno ocurrio, donde y cuando, que lo causo, como afecta a la poblacion, que hacen las autoridades, y que debe hacer el lector. Incluye alertas y recomendaciones del Ineter o Marena.',
  enfoqueDiferencial: 'Explicar que hacer, que autoridades informaron, y que precauciones tomar.',
};
