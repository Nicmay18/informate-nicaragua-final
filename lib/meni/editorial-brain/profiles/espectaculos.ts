import type { CategoryProfile } from './types';

export const espectaculosProfile: CategoryProfile = {
  categoria: 'Espectaculos',
  descripcion: 'Conciertos, cine, teatro, eventos culturales, festivales',
  preguntasEditor: [
    'Vale la pena asistir?',
    'Que encontrara el visitante?',
    'Donde?',
    'Cuando?',
    'Cuanto cuesta?',
    'Quien puede ir?',
    'Que hace diferente este evento?',
  ],
  pesosAdnNI: {
    exclusividad: 0.15,
    wow: 0.15,
    selloNI: 0.45,
    transcripcion: 0.10,
    memoria: 0.15,
  },
  pesosSelloNI: {
    explica: 0.10,
    contextualiza: 0.10,
    servicio: 0.40,
    originalidad: 0.15,
    competencia: 0.05,
    utilidad: 0.15,
    valor: 0.05,
  },
  umbralesBloqueo: {
    exclusividad: 45,
    wow: 50,
    transcripcion: 70,
    memoria: 20,
  },
  promptLlm: 'Sos un editor de espectaculos. Lo mas importante es: vale la pena asistir, que encontrara el visitante, donde, cuando, cuanto cuesta, quien puede ir, y que hace diferente este evento. Nunca preguntes sobre consecuencias economicas.',
  enfoqueDiferencial: 'Informacion practica para el visitante: donde, cuando, cuanto cuesta, quien puede ir, y que hace diferente.',
};
