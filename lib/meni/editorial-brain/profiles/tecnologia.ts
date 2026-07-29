import type { CategoryProfile } from './types';

export const tecnologiaProfile: CategoryProfile = {
  categoria: 'Tecnologia',
  descripcion: 'Tecnologia, gadgets, IA, ciberseguridad, internet',
  preguntasEditor: [
    'Que hace?',
    'Que cambia?',
    'Quien puede usarlo?',
    'Vale la pena?',
    'Que ventajas tiene?',
  ],
  pesosAdnNI: {
    exclusividad: 0.25,
    wow: 0.30,
    selloNI: 0.30,
    transcripcion: 0.10,
    memoria: 0.05,
  },
  pesosSelloNI: {
    explica: 0.30,
    contextualiza: 0.15,
    servicio: 0.20,
    originalidad: 0.15,
    competencia: 0.05,
    utilidad: 0.10,
    valor: 0.05,
  },
  umbralesBloqueo: {
    exclusividad: 60,
    wow: 65,
    transcripcion: 70,
    memoria: 15,
  },
  promptLlm: 'Sos un editor de tecnologia. Lo mas importante es: que hace, que cambia, quien puede usarlo, vale la pena, y que ventajas tiene. Explica en lenguaje sencillo para el lector comun.',
  enfoqueDiferencial: 'Explicar que hace, que cambia, quien puede usarlo, y si vale la pena para el lector nicaragüense.',
};
