/**
 * Taxonomía editorial formal — NIVELES DE CLASIFICACIÓN
 * ======================================================
 * Define qué significa cada dimensión para evitar contaminación entre
 * la sección de publicación (CATEGORÍA) y la clasificación temática (PERFIL).
 *
 * No toca el motor editorial estable; expone únicamente reglas de validación.
 */

import type { MeniContentProfile } from './profile-detector';

/** CATEGORY = sección de publicación / rubro editorial de la noticia. */
export type ContentCategory =
  | 'Nacionales'
  | 'Sucesos'
  | 'Internacionales'
  | 'Deportes'
  | 'Espectáculos'
  | 'Tecnología'
  | 'Cultura'
  | 'Salud'
  | 'Economía'
  | 'Política'
  | 'Ambiente'
  | 'Gastronomía'
  | 'Turismo'
  | 'Educación'
  | 'Astronomía'
  | 'General';

/** Secciones de publicación permitidas. */
export const PUBLICATION_SECTIONS: ContentCategory[] = [
  'Nacionales',
  'Sucesos',
  'Internacionales',
  'Deportes',
  'Espectáculos',
  'Tecnología',
  'Cultura',
  'Salud',
  'Economía',
  'Política',
  'Ambiente',
  'Gastronomía',
  'Turismo',
  'Educación',
  'Astronomía',
  'General',
];

export interface TaxonomyDefinition {
  dimension: string;
  meaning: string;
  source: string;
  mutable: boolean;
}

export const TAXONOMY: Record<string, TaxonomyDefinition> = {
  TEMA: {
    dimension: 'TEMA',
    meaning:
      'Sujeto central del contenido: qué o de quién habla la noticia. Ejemplo: "eclipse lunar".',
    source: 'Texto analizado por el detector MENI.',
    mutable: false,
  },
  CATEGORIA: {
    dimension: 'CATEGORIA',
    meaning:
      'Sección de publicación (rubro editorial). Determina dónde se ubica en la navegación. Ejemplo: "Nacionales".',
    source: 'Campo noticias.categoria; validado contra PUBLICATION_SECTIONS.',
    mutable: true,
  },
  PERFIL: {
    dimension: 'PERFIL',
    meaning:
      'Perfil temático de MENI: el módulo editorial que mejor sirve al tema. Ejemplo: "astronomia".',
    source: 'detectContentProfile (palabras clave del texto).',
    mutable: false,
  },
  INTENCION: {
    dimension: 'INTENCION',
    meaning:
      'Qué pregunta resuelve para el lector. Ejemplo: "¿Cómo y a qué hora ver el eclipse en Nicaragua?".',
    source: 'Análisis editorial MENI.',
    mutable: false,
  },
  AUDIENCIA: {
    dimension: 'AUDIENCIA',
    meaning:
      'Segmento ciudadano al que sirve la información. Ejemplo: "público general interesado en eventos astronómicos".',
    source: 'Análisis editorial MENI.',
    mutable: false,
  },
  ANGULO: {
    dimension: 'ANGULO',
    meaning:
      'Diferencial editorial: por qué merece existir en Nicaragua Informate. Ejemplo: "impacto local + horarios para Nicaragua".',
    source: 'Análisis editorial MENI.',
    mutable: false,
  },
};

export interface TaxonomyValidation {
  valid: boolean;
  conflict: string | null;
}

export function isPublicationSectionCategory(category: string): boolean {
  return PUBLICATION_SECTIONS.includes(category as ContentCategory);
}

/**
 * Verifica que CATEGORÍA y PERFIL no se contaminen.
 *
 * Reglas:
 * 1. La CATEGORÍA debe ser una sección de publicación válida.
 * 2. El PERFIL debe ser el perfil MENI detectado en el texto.
 * 3. Si CATEGORÍA coincide con un perfil temático distinto al detectado,
 *    es contaminación (p.ej., Categoría=Espectáculos + Perfil=astronomia).
 */
export function validateCategoryProfile(
  category: string,
  profile: MeniContentProfile,
): TaxonomyValidation {
  if (!isPublicationSectionCategory(category)) {
    return {
      valid: false,
      conflict: `CATEGORIA "${category}" no es una sección de publicación válida.`,
    };
  }

  if (category.toLowerCase() === profile.toLowerCase()) {
    return {
      valid: false,
      conflict: `CATEGORIA "${category}" no puede copiar el PERFIL temático "${profile}". Son dimensiones distintas.`,
    };
  }

  // Caso de contaminación frecuente: espectáculos vs astronomía.
  if (
    category.toLowerCase() === 'espectaculos' ||
    category.toLowerCase() === 'espectáculos'
  ) {
    if (profile === 'astronomia') {
      return {
        valid: false,
        conflict: 'Un fenómeno astronómico NO debe publicarse como Espectáculos.',
      };
    }
  }

  return { valid: true, conflict: null };
}
