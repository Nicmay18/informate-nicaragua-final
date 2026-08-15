import type { MeniPrioridad, MeniCategoria } from './types';

export const MIN_APPROVED_SCORE = Number(process.env.MENI_MIN_APPROVED_SCORE || '90');

// MENI Score V2 — desactivado por defecto. Puede cambiarse en runtime con setUseMeniScoreV2().
export let USE_MENI_SCORE_V2 = false;

export function setUseMeniScoreV2(value: boolean): void {
  USE_MENI_SCORE_V2 = value;
}

// Pesos internos de MENI Score V2. Suman 1.0.
export const MENI_V2_WEIGHTS = {
  utilidad: 0.10,
  profundidad: 0.20,
  originalidad: 0.20,
  eeat: 0.20,
  aportePropio: 0.05,
  adnNI: 0.25,
} as const;

export const MENI_V2_BLEND = {
  base: 0.50,
  valor: 0.50,
};

export function computePriority(veredicto: string): MeniPrioridad {
  switch (veredicto) {
    case 'cobertura_especial':
    case 'portada':
      return 'PORTADA';
    case 'publicar_destacado':
      return 'ALTA';
    case 'publicar_estandar':
      return 'MEDIA';
    case 'publicar_breve':
    case 'no_publicar':
    default:
      return 'BAJA';
  }
}

export function scoreToGrade(score: number): string {
  if (score >= 95) return 'PUBLICABLE ORO';
  if (score >= 90) return 'PUBLICABLE';
  if (score >= 80) return 'MEJORAR';
  return 'NO PUBLICAR';
}

export function normalizeCategory(raw: string): MeniCategoria {
  const map: Record<string, MeniCategoria> = {
    sucesos: 'Sucesos',
    judicial: 'Sucesos',
    policial: 'Sucesos',
    crimen: 'Sucesos',
    nacionales: 'Nacionales',
    nacional: 'Nacionales',
    comunidad: 'Nacionales',
    local: 'Nacionales',
    economia: 'Nacionales',
    economica: 'Nacionales',
    cultura: 'Nacionales',
    cultural: 'Nacionales',
    politica: 'Nacionales',
    politico: 'Nacionales',
    gobierno: 'Nacionales',
    salud: 'Nacionales',
    educacion: 'Nacionales',
    educativa: 'Nacionales',
    educativo: 'Nacionales',
    ambiente: 'Nacionales',
    turismo: 'Nacionales',
    gastronomia: 'Nacionales',
    internacionales: 'Internacionales',
    internacional: 'Internacionales',
    deportes: 'Deportes',
    deportivo: 'Deportes',
    tecnologia: 'Tecnología',
    tecnologica: 'Tecnología',
    espectaculos: 'Espectáculos',
    espectaculo: 'Espectáculos',
    entretenimiento: 'Espectáculos',
    evento: 'Espectáculos',
    show: 'Espectáculos',
    serviciopublico: 'Nacionales',
    utilidad: 'Nacionales',
  };
  const key = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  return map[key] || 'General';
}

export function approved(veredicto: string, score: number): boolean {
  return veredicto !== 'no_publicar' && veredicto !== 'EDITOR_INCONSISTENT' && score >= MIN_APPROVED_SCORE;
}
