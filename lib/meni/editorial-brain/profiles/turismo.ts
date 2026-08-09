import type { CategoryProfile } from './types';

export const turismoProfile: CategoryProfile = {
  categoria: 'Turismo',
  descripcion: 'Destinos turísticos, guías de viaje, miradores, atractivos, servicios al visitante',
  preguntasEditor: [
    'Cual es el destino o atractivo?',
    'Donde esta ubicado?',
    'Como llegar?',
    'Cuando y en que horarios se puede visitar?',
    'Cuanto cuesta si aplica?',
    'Que actividades o atractivos ofrece?',
    'Que servicios estan disponibles?',
    'Que recomendaciones practicas necesita el visitante?',
    'Hay condiciones o advertencias de visita?',
    'Cual es la fuente de los datos (precios, horarios, acceso)?',
  ],
  pesosAdnNI: {
    exclusividad: 0.15,
    wow: 0.15,
    selloNI: 0.50,
    transcripcion: 0.10,
    memoria: 0.10,
  },
  pesosSelloNI: {
    explica: 0.15,
    contextualiza: 0.15,
    servicio: 0.40,
    originalidad: 0.10,
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
  promptLlm: 'Sos un editor de turismo y servicios. Lo mas importante es: cual es el destino, donde esta, como llegar, horarios, precio si aplica, que actividades ofrece, servicios disponibles, recomendaciones practicas y advertencias. Nunca exijas variacion economica, institucion interviniente o fenomeno climatico.',
  enfoqueDiferencial: 'Informacion util y verificable para el visitante: ubicacion, acceso, horarios, costos, actividades, servicios y advertencias.',
};
