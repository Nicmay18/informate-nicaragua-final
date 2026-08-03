/**
 * Objetivos editoriales y comerciales de Nicaragua Informate.
 * Fuente única para todos los módulos del Command Center.
 */

/** Mezcla editorial ideal (% del volumen publicado). */
export const TARGET_MIX: Record<string, { target: number; max?: number }> = {
  Nacionales: { target: 30 },
  Sucesos: { target: 20, max: 20 },
  Deportes: { target: 20 },
  Internacionales: { target: 15 },
  Tecnología: { target: 10 },
};

/** Todo lo que no está en TARGET_MIX compite por este espacio. */
export const OTHERS_TARGET = 5;

/**
 * Orden de marca en portada: las primeras posiciones deben representar
 * la identidad del medio, no el tráfico fácil.
 */
export const BRAND_PRIORITY: readonly string[] = [
  'Nacionales',
  'Economía',
  'Ciencia',
  'Tecnología',
  'Deportes',
  'Cultura',
];

/** Ninguna categoría puede superar este porcentaje de la portada. */
export const HOME_CATEGORY_CAP = 30;

/** Cuántas posiciones iniciales se consideran "vitrina de marca". */
export const BRAND_SLOTS = 6;

/** Categorías con demanda publicitaria real en el mercado nicaragüense. */
export const COMMERCIAL_CATEGORIES: Record<string, { advertisers: string[]; potential: 'alto' | 'medio' }> = {
  Economía: { advertisers: ['Banca', 'Remesadoras', 'Aseguradoras', 'Cooperativas'], potential: 'alto' },
  Turismo: { advertisers: ['Hoteles', 'Tour operadores', 'Aerolíneas', 'Restaurantes'], potential: 'alto' },
  Tecnología: { advertisers: ['Telecomunicaciones', 'Retail tech', 'Academias digitales'], potential: 'alto' },
  Deportes: { advertisers: ['Marcas deportivas', 'Bebidas', 'Casas de apuestas reguladas'], potential: 'medio' },
  Educación: { advertisers: ['Universidades', 'Institutos técnicos', 'Plataformas de cursos'], potential: 'medio' },
  Salud: { advertisers: ['Clínicas privadas', 'Laboratorios', 'Seguros médicos'], potential: 'medio' },
  Trámites: { advertisers: ['Bufetes migratorios', 'Gestorías', 'Notarías'], potential: 'alto' },
};

/**
 * Demanda de búsqueda estructural de la audiencia nicaragüense.
 * Base del Content Opportunity Hunter.
 */
export const AUDIENCE_DEMAND: ReadonlyArray<{
  topic: string;
  keywords: string[];
  intent: 'informacional' | 'transaccional' | 'navegacional';
  demand: 'permanente' | 'estacional' | 'coyuntural';
  format: 'guía' | 'explicador' | 'nota' | 'actualización';
  commercialValue: 'alto' | 'medio' | 'bajo';
}> = [
  { topic: 'Costo de vida en Nicaragua', keywords: ['costo de vida', 'canasta básica', 'precios'], intent: 'informacional', demand: 'permanente', format: 'guía', commercialValue: 'medio' },
  { topic: 'Salario mínimo en Nicaragua', keywords: ['salario mínimo', 'salario', 'sueldo'], intent: 'informacional', demand: 'permanente', format: 'actualización', commercialValue: 'medio' },
  { topic: 'Precio del combustible', keywords: ['combustible', 'gasolina', 'diésel', 'precio del galón'], intent: 'informacional', demand: 'permanente', format: 'actualización', commercialValue: 'medio' },
  { topic: 'Trámites y documentos', keywords: ['trámite', 'pasaporte', 'apostilla', 'récord policial', 'cédula'], intent: 'transaccional', demand: 'permanente', format: 'guía', commercialValue: 'alto' },
  { topic: 'Turismo y destinos', keywords: ['turismo', 'destinos', 'playa', 'volcán', 'qué hacer en'], intent: 'informacional', demand: 'estacional', format: 'guía', commercialValue: 'alto' },
  { topic: 'Educación y becas', keywords: ['beca', 'universidad', 'matrícula', 'carrera'], intent: 'transaccional', demand: 'estacional', format: 'guía', commercialValue: 'medio' },
  { topic: 'Tipo de cambio y remesas', keywords: ['dólar', 'tipo de cambio', 'córdoba', 'remesa'], intent: 'informacional', demand: 'permanente', format: 'actualización', commercialValue: 'alto' },
  { topic: 'Migración y visas', keywords: ['migración', 'visa', 'consulado', 'residencia'], intent: 'transaccional', demand: 'permanente', format: 'guía', commercialValue: 'alto' },
  { topic: 'Salud pública y servicios', keywords: ['hospital', 'salud', 'vacuna', 'clínica'], intent: 'informacional', demand: 'permanente', format: 'explicador', commercialValue: 'medio' },
  { topic: 'Energía y servicios básicos', keywords: ['energía', 'agua potable', 'apagón', 'tarifa'], intent: 'informacional', demand: 'coyuntural', format: 'explicador', commercialValue: 'bajo' },
];

/** Ventanas horarias óptimas por canal (hora local Nicaragua). */
export const CHANNEL_WINDOWS: Record<string, string> = {
  Facebook: '12:00 y 19:00',
  Telegram: 'inmediato',
  WhatsApp: '07:00 y 18:00',
  Newsletter: '06:30',
  'Google Discover': 'inmediato tras publicar',
};
