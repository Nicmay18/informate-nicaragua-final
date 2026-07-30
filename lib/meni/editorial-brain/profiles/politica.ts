import type { CategoryProfile } from './types';

export const politicaProfile: CategoryProfile = {
  categoria: 'Politica',
  descripcion: 'Política, gobierno, decisiones públicas, legislación',
  preguntasEditor: [
    'Que decidieron?',
    'Quien lo anuncio?',
    'A quien afecta?',
    'Que cambia en la practica?',
    'Que dicen las partes?',
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
  promptLlm: 'Sos un editor de politica. Lo mas importante es: que decidieron, quien lo anuncio, a quien afecta, que cambia en la practica, y que dicen las partes. Explica el impacto real en la poblacion.',
  enfoqueDiferencial: 'Explicar que cambia para el ciudadano, que institucion interviene, y que sigue ahora.',
};
