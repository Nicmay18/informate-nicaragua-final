import type { CategoryProfile } from './types';

export const culturaProfile: CategoryProfile = {
  categoria: 'Cultura',
  descripcion: 'Cultura, patrimonio, tradiciones, arte, manifestaciones culturales',
  preguntasEditor: [
    'Que actividad cultural es?',
    'Cual es su historia o significado?',
    'Donde y cuando ocurre?',
    'Como asistir o participar?',
    'Para quien es?',
  ],
  pesosAdnNI: {
    exclusividad: 0.15,
    wow: 0.20,
    selloNI: 0.45,
    transcripcion: 0.10,
    memoria: 0.10,
  },
  pesosSelloNI: {
    explica: 0.20,
    contextualiza: 0.25,
    servicio: 0.20,
    originalidad: 0.15,
    competencia: 0.05,
    utilidad: 0.10,
    valor: 0.05,
  },
  umbralesBloqueo: {
    exclusividad: 45,
    wow: 50,
    transcripcion: 70,
    memoria: 20,
  },
  promptLlm: 'Sos un editor de cultura. Lo mas importante es: que actividad cultural es, su historia o significado, donde y cuando ocurre, como asistir o participar, y para quien es. Conecta con la identidad nicaraguense.',
  enfoqueDiferencial: 'Explicar el significado cultural, la historia, y como asistir o participar.',
};
