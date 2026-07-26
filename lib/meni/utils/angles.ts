import type { MeniCategoria } from '../types';

const ANGULOS: Record<MeniCategoria, string[]> = {
  Sucesos: ['Causa y efecto inmediato', 'Impacto en la comunidad', 'Respuesta de autoridades'],
  Nacionales: ['Consecuencias políticas', 'Efectos en la población', 'Posición institucional'],
  Internacionales: ['Impacto regional', 'Reacción de Nicaragua', 'Contexto geopolítico'],
  Deportes: ['Resultado y estadísticas', 'Consecuencias para el ranking', 'Próximo desafío'],
  Tecnología: ['Cómo afecta al usuario', 'Fecha de disponibilidad', 'Comparativa con alternativas'],
  Economía: ['Cifras y tendencias', 'Impacto en precios', 'Recomendación para consumidores'],
  Cultura: ['Origen e historia', 'Relevancia local', 'Próximas presentaciones'],
  Espectáculos: ['Quién participa', 'Dónde y cuándo', 'Repercusión'],
  Política: ['Análisis de actores', 'Cronología', 'Implicaciones legales'],
  Salud: ['Recomendaciones oficiales', 'Datos epidemiológicos', 'Dónde acudir'],
  Educación: ['Afectación a estudiantes', 'Cronograma', 'Alternativas'],
  General: ['Explicación del hecho', 'Contexto necesario', 'Qué sigue'],
};

export function getAngle(categoria: MeniCategoria): string {
  const list = ANGULOS[categoria] || ANGULOS.General;
  return list[0] || 'Explicación del hecho';
}

export function getAngleOptions(categoria: MeniCategoria): string[] {
  return ANGULOS[categoria] || ANGULOS.General;
}
