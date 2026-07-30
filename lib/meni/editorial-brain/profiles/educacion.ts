import type { CategoryProfile } from './types';

export const educacionProfile: CategoryProfile = {
  categoria: 'Educacion',
  descripcion: 'Educación, escuelas, universidades, becas, calendario académico',
  preguntasEditor: [
    'Que anuncio o medida es?',
    'Quien la aplica?',
    'A quien afecta?',
    'Cuando empieza o vence?',
    'Que debe hacer el estudiante o familia?',
  ],
  pesosAdnNI: {
    exclusividad: 0.20,
    wow: 0.20,
    selloNI: 0.40,
    transcripcion: 0.12,
    memoria: 0.08,
  },
  pesosSelloNI: {
    explica: 0.25,
    contextualiza: 0.20,
    servicio: 0.25,
    originalidad: 0.10,
    competencia: 0.05,
    utilidad: 0.10,
    valor: 0.05,
  },
  umbralesBloqueo: {
    exclusividad: 55,
    wow: 55,
    transcripcion: 70,
    memoria: 20,
  },
  promptLlm: 'Sos un editor de educacion. Lo mas importante es: que anuncio o medida es, quien la aplica, a quien afecta, cuando empieza o vence, y que debe hacer el estudiante o familia. Explica requisitos, plazos y tramites.',
  enfoqueDiferencial: 'Explicar que debe hacer el estudiante o familia, donde acudir, y los plazos.',
};
