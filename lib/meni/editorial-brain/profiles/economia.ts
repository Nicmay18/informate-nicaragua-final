import type { CategoryProfile } from './types';

export const economiaProfile: CategoryProfile = {
  categoria: 'Economia',
  descripcion: 'Economía, precios, salarios, presupuesto, mercado',
  preguntasEditor: [
    'Cual es el dato o medida?',
    'Quien lo anuncio?',
    'Como afecta precios o salarios?',
    'Que significa para el bolsillo?',
    'Cuando entra en vigor?',
  ],
  pesosAdnNI: {
    exclusividad: 0.25,
    wow: 0.20,
    selloNI: 0.35,
    transcripcion: 0.12,
    memoria: 0.08,
  },
  pesosSelloNI: {
    explica: 0.30,
    contextualiza: 0.25,
    servicio: 0.20,
    originalidad: 0.10,
    competencia: 0.05,
    utilidad: 0.05,
    valor: 0.05,
  },
  umbralesBloqueo: {
    exclusividad: 60,
    wow: 60,
    transcripcion: 70,
    memoria: 20,
  },
  promptLlm: 'Sos un editor de economia. Lo mas importante es: cual es el dato, quien lo anuncio, como afecta precios o salarios, que significa para el bolsillo, y cuando entra en vigor. Explica en terminos sencillos para el lector comun.',
  enfoqueDiferencial: 'Explicar como afecta el bolsillo del lector, comparar con datos anteriores, y que cambia practicamente.',
};
