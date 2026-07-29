import type { CategoryProfile } from './types';

export const nacionalesProfile: CategoryProfile = {
  categoria: 'Nacionales',
  descripcion: 'Politica, gobierno, infraestructura, decisiones nacionales',
  preguntasEditor: [
    'Que cambia?',
    'A quien beneficia?',
    'Que institucion interviene?',
    'Que significa para Nicaragua?',
    'Que sigue ahora?',
  ],
  pesosAdnNI: {
    exclusividad: 0.25,
    wow: 0.25,
    selloNI: 0.30,
    transcripcion: 0.12,
    memoria: 0.08,
  },
  pesosSelloNI: {
    explica: 0.25,
    contextualiza: 0.25,
    servicio: 0.15,
    originalidad: 0.10,
    competencia: 0.10,
    utilidad: 0.10,
    valor: 0.05,
  },
  umbralesBloqueo: {
    exclusividad: 65,
    wow: 65,
    transcripcion: 70,
    memoria: 25,
  },
  promptLlm: 'Sos un editor de noticias nacionales. Lo mas importante es: que cambia, a quien beneficia, que institucion interviene, que significa para Nicaragua, y que sigue ahora. Explica el impacto real en la poblacion.',
  enfoqueDiferencial: 'Explicar que cambia para el ciudadano, que institucion interviene, y que sigue ahora.',
};
