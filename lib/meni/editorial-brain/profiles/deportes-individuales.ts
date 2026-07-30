import type { CategoryProfile } from './types';

export const deportesIndividualesProfile: CategoryProfile = {
  categoria: 'DeportesIndividuales',
  descripcion: 'Boxeo, sanda, karate, natación, atletismo, ciclismo, tenis — deportes individuales',
  preguntasEditor: [
    'Que disciplina es?',
    'Quien compite?',
    'Cual fue el resultado?',
    'Donde y cuando?',
    'Que sigue para el atleta?',
    'Hubo marcas o records?',
  ],
  pesosAdnNI: {
    exclusividad: 0.15,
    wow: 0.25,
    selloNI: 0.35,
    transcripcion: 0.15,
    memoria: 0.10,
  },
  pesosSelloNI: {
    explica: 0.20,
    contextualiza: 0.20,
    servicio: 0.10,
    originalidad: 0.10,
    competencia: 0.10,
    utilidad: 0.10,
    valor: 0.20,
  },
  umbralesBloqueo: {
    exclusividad: 50,
    wow: 55,
    transcripcion: 70,
    memoria: 20,
  },
  promptLlm: 'Sos un editor de deportes individuales. Lo mas importante es: disciplina, quien compite, resultado, donde y cuando, que sigue para el atleta, y marcas o records. No preguntes por alineaciones, tabla o proximo partido.',
  enfoqueDiferencial: 'Analisis del resultado, trayectoria del atleta, marcas, y proximos retos.',
};
