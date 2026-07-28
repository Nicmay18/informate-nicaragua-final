import type { MeniPrioridad, MeniCategoria } from './types';

export const MIN_APPROVED_SCORE = Number(process.env.MENI_MIN_APPROVED_SCORE || '85');

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
  if (score >= 98) return 'A+';
  if (score >= 95) return 'A';
  if (score >= 90) return 'B+';
  if (score >= 85) return 'B';
  if (score >= 80) return 'C';
  return 'F';
}

export function normalizeCategory(raw: string): MeniCategoria {
  const map: Record<string, MeniCategoria> = {
    sucesos: 'Sucesos',
    nacionales: 'Nacionales',
    internacionales: 'Internacionales',
    deportes: 'Deportes',
    tecnologia: 'Tecnología',
    economia: 'Economía',
    cultura: 'Cultura',
    espectaculos: 'Espectáculos',
    politica: 'Política',
    salud: 'Salud',
    educacion: 'Educación',
  };
  const key = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  return map[key] || 'General';
}

export function approved(veredicto: string, score: number): boolean {
  return veredicto !== 'no_publicar' && veredicto !== 'EDITOR_INCONSISTENT' && score >= MIN_APPROVED_SCORE;
}
