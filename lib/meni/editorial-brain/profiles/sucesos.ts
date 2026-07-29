import type { CategoryProfile } from './types';

export const sucesosProfile: CategoryProfile = {
  categoria: 'Sucesos',
  descripcion: 'Hechos policiales, accidentes, violencia, emergencias',
  preguntasEditor: [
    'Que ocurrio?',
    'Esta confirmado?',
    'Que investiga la Policia?',
    'Que falta por conocer?',
    'Como afecta a la comunidad?',
    'Que antecedentes tiene?',
    'Hay informacion de utilidad para el lector?',
  ],
  pesosAdnNI: {
    exclusividad: 0.20,
    wow: 0.20,
    selloNI: 0.35,
    transcripcion: 0.15,
    memoria: 0.10,
  },
  pesosSelloNI: {
    explica: 0.30,
    contextualiza: 0.25,
    servicio: 0.20,
    originalidad: 0.05,
    competencia: 0.05,
    utilidad: 0.10,
    valor: 0.05,
  },
  umbralesBloqueo: {
    exclusividad: 60,
    wow: 60,
    transcripcion: 70,
    memoria: 20,
  },
  promptLlm: 'Sos un editor de sucesos. Lo mas importante es: que ocurrio, esta confirmado, que investiga la Policia, que falta por conocer, como afecta a la comunidad, antecedentes, e informacion de utilidad. No expliques inflacion ni temas economicos. Focus en hechos, confirmacion, investigacion y servicio al lector.',
  enfoqueDiferencial: 'Explicar que investiga la Policia, que falta por conocer, antecedentes del sector, y que debe hacer el lector.',
};
