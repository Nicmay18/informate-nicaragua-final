/**
 * MENI Editorial Tiers — Niveles de exigencia graduados
 * ========================================================
 * No todas las notas requieren los mismos requisitos.
 * Un flash de última hora no debe cumplir los mismos criterios que un reportaje.
 *
 * Nivel 1 — FLASH: prioridad en rapidez y precisión; requisitos mínimos.
 * Nivel 2 — NOTICIA: explicación y contexto moderados.
 * Nivel 3 — REPORTAJE: exige ADN NI alto, antecedentes, valor diferencial.
 * Nivel 4 — INVESTIGACION: activa todos los motores y exige el máximo nivel.
 */

export type EditorialTier = 'FLASH' | 'NOTICIA' | 'REPORTAJE' | 'INVESTIGACION';

export interface TierThresholds {
  minPalabras: number;
  minAdnNI: number;
  minExclusividad: number;
  minWow: number;
  exigeServiceValue: boolean;
  exigeDifferentialValue: boolean;
  exigeContexto: boolean;
  exigeFuentes: boolean;
  maxTranscripcion: number;
  minQualityGateScore: number;
  descripcion: string;
}

export const TIER_THRESHOLDS: Record<EditorialTier, TierThresholds> = {
  FLASH: {
    minPalabras: 80,
    minAdnNI: 50,
    minExclusividad: 30,
    minWow: 30,
    exigeServiceValue: false,
    exigeDifferentialValue: false,
    exigeContexto: false,
    exigeFuentes: false,
    maxTranscripcion: 60,
    minQualityGateScore: 60,
    descripcion: 'Flash / Última hora: prioridad en rapidez y precisión. Requisitos mínimos.',
  },
  NOTICIA: {
    minPalabras: 200,
    minAdnNI: 60,
    minExclusividad: 50,
    minWow: 50,
    exigeServiceValue: true,
    exigeDifferentialValue: false,
    exigeContexto: true,
    exigeFuentes: false,
    maxTranscripcion: 50,
    minQualityGateScore: 65,
    descripcion: 'Nota informativa: explicación y contexto moderados.',
  },
  REPORTAJE: {
    minPalabras: 400,
    minAdnNI: 70,
    minExclusividad: 65,
    minWow: 65,
    exigeServiceValue: true,
    exigeDifferentialValue: true,
    exigeContexto: true,
    exigeFuentes: true,
    maxTranscripcion: 40,
    minQualityGateScore: 75,
    descripcion: 'Nota desarrollada: exige ADN NI alto, antecedentes, valor diferencial.',
  },
  INVESTIGACION: {
    minPalabras: 600,
    minAdnNI: 80,
    minExclusividad: 75,
    minWow: 75,
    exigeServiceValue: true,
    exigeDifferentialValue: true,
    exigeContexto: true,
    exigeFuentes: true,
    maxTranscripcion: 30,
    minQualityGateScore: 85,
    descripcion: 'Especial o reportaje: activa todos los motores y exige el máximo nivel.',
  },
};

/**
 * Clasifica automáticamente el tier editorial según el contenido.
 * Factores: longitud, categoría, presencia de antecedentes, complejidad.
 */
export function detectTier(input: {
  titulo: string;
  contenido: string;
  categoria?: string;
}): EditorialTier {
  const textoPlano = input.contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoPlano.split(/\s+/).filter(Boolean).length;

  // Si tiene menos de 120 palabras, es flash
  if (palabras < 120) return 'FLASH';

  // Si tiene menos de 350 palabras, es noticia
  if (palabras < 350) return 'NOTICIA';

  // Si tiene más de 600 palabras y menciona antecedentes/investigación, es investigación
  const lower = textoPlano.toLowerCase();
  const tieneInvestigacion = /\binvestigaci[oó]n\b|\bindagaci[oó]n\b|\bexclusiva\b|\bdenuncia\b|\bfiltraci[oó]n\b/i.test(lower);
  const tieneReportaje = /\breportaje\b|\bespecial\b|\bcr[oó]nica\b|\ban[aá]lisis\b/i.test(lower);

  if (palabras >= 600 && (tieneInvestigacion || tieneReportaje)) return 'INVESTIGACION';

  // Default para contenido extenso
  if (palabras >= 350) return 'REPORTAJE';

  return 'NOTICIA';
}
