import type { MeniPrioridad, MeniCategoria } from './types';

export const MIN_APPROVED_SCORE = Number(process.env.MENI_MIN_APPROVED_SCORE || '90');

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
    internacionales: 'Internacionales',
    internacional: 'Internacionales',
    deportes: 'Deportes',
    deportivo: 'Deportes',
    tecnologia: 'Tecnología',
    tecnologica: 'Tecnología',
    economia: 'Economía',
    economica: 'Economía',
    cultura: 'Cultura',
    cultural: 'Cultura',
    espectaculos: 'Espectáculos',
    espectaculo: 'Espectáculos',
    entretenimiento: 'Espectáculos',
    evento: 'Espectáculos',
    show: 'Espectáculos',
    politica: 'Política',
    politico: 'Política',
    gobierno: 'Política',
    salud: 'Salud',
    educacion: 'Educación',
    educativa: 'Educación',
    serviciopublico: 'General',
    utilidad: 'General',
  };
  const key = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  return map[key] || 'General';
}

export function approved(veredicto: string, score: number): boolean {
  return veredicto !== 'no_publicar' && veredicto !== 'EDITOR_INCONSISTENT' && score >= MIN_APPROVED_SCORE;
}
