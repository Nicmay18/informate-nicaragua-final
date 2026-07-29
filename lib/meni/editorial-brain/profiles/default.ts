import type { CategoryProfile } from './types';

export const defaultProfile: CategoryProfile = {
  categoria: 'General',
  descripcion: 'Perfil por defecto - equivalente a Nacionales',
  preguntasEditor: [
    'Que ocurrio?',
    'Donde y cuando?',
    'Quien esta involucrado?',
    'Por que es importante para el lector?',
    'Que contexto necesita el lector?',
    'Que sigue ahora?',
  ],
  pesosAdnNI: {
    exclusividad: 0.25,
    wow: 0.25,
    selloNI: 0.30,
    transcripcion: 0.15,
    memoria: 0.05,
  },
  pesosSelloNI: {
    explica: 0.20,
    contextualiza: 0.20,
    servicio: 0.15,
    originalidad: 0.15,
    competencia: 0.10,
    utilidad: 0.10,
    valor: 0.10,
  },
  umbralesBloqueo: {
    exclusividad: 65,
    wow: 65,
    transcripcion: 70,
    memoria: 20,
  },
  promptLlm: 'Sos un editor general de Nicaragua Informate. Lo mas importante es: que ocurrio, donde y cuando, quien esta involucrado, por que es importante, que contexto necesita el lector, y que sigue ahora.',
  enfoqueDiferencial: 'Explicar el hecho, dar contexto, y ofrecer servicio al lector.',
};
