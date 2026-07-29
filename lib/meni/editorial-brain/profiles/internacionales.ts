import type { CategoryProfile } from './types';

export const internacionalesProfile: CategoryProfile = {
  categoria: 'Internacionales',
  descripcion: 'Noticias del exterior relevantes para Nicaragua',
  preguntasEditor: [
    'Por que importa en Nicaragua?',
    'Como repercute?',
    'Cual es el contexto?',
    'Que antecedentes existen?',
    'Por que esta noticia merece publicarse aqui?',
  ],
  pesosAdnNI: {
    exclusividad: 0.30,
    wow: 0.25,
    selloNI: 0.30,
    transcripcion: 0.10,
    memoria: 0.05,
  },
  pesosSelloNI: {
    explica: 0.30,
    contextualiza: 0.35,
    servicio: 0.05,
    originalidad: 0.10,
    competencia: 0.10,
    utilidad: 0.05,
    valor: 0.05,
  },
  umbralesBloqueo: {
    exclusividad: 70,
    wow: 60,
    transcripcion: 70,
    memoria: 15,
  },
  promptLlm: 'Sos un editor de internacionales. Lo mas importante es: por que importa en Nicaragua, como repercute, cual es el contexto, que antecedentes existen, y por que merece publicarse aqui. Conecta siempre con Nicaragua.',
  enfoqueDiferencial: 'Conectar el hecho internacional con Nicaragua: por que importa aqui, como repercute, y que antecedentes existen.',
};
