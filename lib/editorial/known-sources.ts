/**
 * CATÁLOGO CANÓNICO DE FUENTES Y LUGARES — única fuente de verdad.
 * ================================================================
 * La auditoría forense encontró tres taxonomías divergentes: el extractor
 * reconocía SINAPRED/COMUPRED/MINED/Ejército/Cruz Roja, pero las capas
 * decisorias (factuality-signals + trust) mantenían listas propias más
 * pobres. Eso convertía fuentes institucionales reales en "fuentes vagas".
 *
 * Toda capa que necesite reconocer instituciones oficiales o lugares de
 * Nicaragua debe importar de aquí — nunca duplicar la lista.
 */

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Instituciones y medios reconocidos como fuente oficial identificable. */
export const OFFICIAL_SOURCES: readonly string[] = [
  // Instituciones nicaragüenses
  'Policía Nacional', 'Policía', 'Ministerio Público', 'Fiscalía',
  'Bomberos', 'Benemérito Cuerpo de Bomberos', 'Cruz Roja', 'Medicina Legal',
  'Hospital', 'Ministerio de Salud', 'MINSA', 'MINED', 'Ministerio de Educación',
  'Ministerio de Gobernación', 'Ministerio de Obras Públicas',
  'Ministerio de Transporte', 'Ministerio de Agricultura', 'INETER', 'INIFOM',
  'INSS', 'INTA', 'MTI', 'CNU', 'CSE', 'Consejo Supremo Electoral', 'SERENE',
  'Conapred', 'SINAPRED', 'COMUPRED', 'Alcaldía', 'Asamblea Nacional',
  'Asamblea', 'Gobierno de Nicaragua', 'Gobierno', 'Presidencia',
  'Copresidencia', 'Poder Judicial', 'Corte Suprema', 'Ejército de Nicaragua',
  'Ejército', 'Fuerza Naval', 'Distrito Naval', 'Banco Central', 'BCN',
  'ENATREL', 'ENACAL', 'Telecom', 'Tigo', 'Claro', 'UNAN', 'UCA', 'MAG',
  'MARENA', 'INTUR', 'MIFIC', 'MIGE', 'MEFCCA', 'MIFAMILIA', 'IPSFA',
  'INATEC', 'Procuraduría', 'INVUR',
  // Nombres legales completos de las instituciones anteriores — en prensa
  // nacional se citan con frecuencia por nombre, no por sigla ("El Instituto
  // Nicaragüense de Estudios Territoriales" = INETER).
  'Instituto Nicaragüense de Estudios Territoriales',
  'Instituto Nicaragüense de Seguridad Social',
  'Instituto Nicaragüense de Tecnología Agropecuaria',
  'Instituto Nicaragüense de Turismo',
  'Instituto Nicaragüense de Fomento Municipal',
  'Instituto Nacional Tecnológico',
  'Instituto de Medicina Legal',
  'Instituto de la Vivienda Urbana y Rural',
  'Instituto de Previsión Social de las Fuerzas Armadas',
  'Sistema Nacional para la Prevención, Mitigación y Atención de Desastres',
  'Comités Municipales para la Prevención, Mitigación y Atención de Desastres',
  'Comité Municipal para la Prevención',
  'Ministerio del Ambiente y los Recursos Naturales',
  'Ministerio Agropecuario y Forestal',
  'Ministerio de Transporte e Infraestructura',
  'Ministerio de Fomento, Industria y Comercio',
  'Ministerio de Economía Familiar',
  'Ministerio de la Familia',
  'Empresa Nicaragüense de Acueductos y Alcantarillados',
  'Empresa Nacional de Transmisión Eléctrica',
  'Procuraduría General de la República',
  'Consejo Nacional de Universidades',
  'Universidad Nacional Autónoma de Nicaragua',
  'Universidad Centroamericana',
  'Banco Central de Nicaragua',
  'Presidencia de la República',
  // Instituciones y organismos internacionales
  'ONU', 'OMS', 'OPS', 'OEA', 'OIM', 'UNICEF', 'UNESCO', 'ACNUR', 'FAO',
  'FMI', 'BID',
  // Nombres completos de organismos internacionales
  'Organización Mundial de la Salud',
  'Organización Panamericana de la Salud',
  'Organización de los Estados Americanos',
  'Organización de Estados Americanos',
  'Naciones Unidas',
  'Fondo Monetario Internacional',
  'Banco Interamericano de Desarrollo',
  // Fuentes oficiales extranjeras frecuentes en el corpus
  'Organismo de Investigación Judicial', 'OIJ',
  'Ministerio Público de Costa Rica', 'Fiscalía General de la República de Costa Rica',
  'Poder Judicial de Costa Rica', 'Fuerza Pública de Costa Rica',
  'Ministerio de Seguridad Pública de Costa Rica', 'Migración y Extranjería de Costa Rica',
  'Policía de Fronteras de Costa Rica',
  'Fiscalía General', 'Interpol', 'Europol', 'FBI',
  'Department of Homeland Security',
  'Departamento de Estado de Estados Unidos', 'Gobierno de Costa Rica',
  // Organismos deportivos — fuentes institucionales verificables en
  // crónicas deportivas: rankings, sanciones, calendarios y resultados
  // oficiales (p.ej. "la AMB lo colocó séptimo en su clasificación").
  'Asociación Mundial de Boxeo', 'Consejo Mundial de Boxeo',
  'Organización Mundial de Boxeo', 'Federación Internacional de Boxeo',
  'Federación Nicaragüense de Boxeo',
  'AMB', 'WBA', 'CMB', 'WBC', 'OMB', 'WBO', 'FIB', 'IBF',
  'FIFA', 'CONCACAF', 'FIBA', 'FIVB',
  'Comité Olímpico Internacional', 'Comité Olímpico Nicaragüense', 'COI',
  // Agencias y medios
  'EFE', 'AFP', 'AP', 'Reuters', 'BBC', 'CNN',
  // Medios nacionales identificables ("según La Prensa" es fuente
  // concreta; "según medios" sigue siendo vago).
  'La Prensa', 'Confidencial', 'La Primerísima', '100% Noticias',
  'El 19 Digital', 'Divergentes', 'Artículo 66', 'Despacho 505',
  'Bolsa de Noticias', 'Radio Corporación', 'Radio Ya',
  'Canal 10', 'Canal 8', 'VOS TV', 'TN8', 'El Nuevo Diario',
  // Órganos judiciales: "el Juzgado Noveno de Distrito Penal" es una
  // fuente institucional identificable aunque no sea ministerio.
  'Juzgado', 'Tribunal', 'Corte de Apelaciones', 'Magistrados',
];

/**
 * Fragmentos regex (no literales): patrones genéricos que también cuentan
 * como fuente institucional — p.ej. cualquier "Ministerio de X".
 */
const OFFICIAL_SOURCE_PATTERNS: readonly string[] = [
  'Ministerio de [A-ZÁÉÍÓÚa-záéíóúñ]+',
  // Cualquier "Instituto Nicaragüense de X" es una institución identificable
  // (INETER, INIFOM, INTUR, INTA… siguen esta forma legal).
  'Instituto Nicaragüense de [A-ZÁÉÍÓÚa-záéíóúñ]+',
];

/**
 * Regex case-INSENSITIVE. Uso: factuality-signals — una mención de la
 * institución en cualquier capitalización cuenta como fuente concreta.
 * ("según sinapred" y "según SINAPRED" son la misma fuente.)
 */
export const OFFICIAL_SOURCE_CI_RE = new RegExp(
  '\\b(?:' + OFFICIAL_SOURCES.map(escapeRe).join('|') + '|' + OFFICIAL_SOURCE_PATTERNS.join('|') + ')\\b',
  'i',
);

/**
 * Regex case-SENSITIVE. Uso: trust.ts — solo la forma capitalizada cuenta
 * como fuente nombrada; el sustantivo común ("policía", "hospital",
 * "gobierno") no debe inflar el set de fuentes detectadas.
 */
export const OFFICIAL_SOURCE_CS_RE = new RegExp(
  '\\b(?:' + OFFICIAL_SOURCES.map(escapeRe).join('|') + '|' + OFFICIAL_SOURCE_PATTERNS.join('|') + ')\\b',
);

/** Versión global de OFFICIAL_SOURCE_CS_RE para matchAll. */
export const OFFICIAL_SOURCE_CS_GLOBAL_RE = new RegExp(OFFICIAL_SOURCE_CS_RE.source, 'g');

/** Lugares nicaragüenses reconocidos como ubicación concreta. */
export const NICARAGUA_PLACES: readonly string[] = [
  'Managua', 'León', 'Granada', 'Masaya', 'Chinandega', 'Matagalpa',
  'Estelí', 'Jinotega', 'Nueva Segovia', 'Rivas', 'Chontales', 'Boaco',
  'Carazo', 'Río San Juan', 'Siuna', 'Rosita', 'Bonanza', 'Bilwi',
  'Puerto Cabezas', 'Waspán', 'Bluefields', 'Corn Island',
  'Caribe Norte', 'Caribe Sur', 'RAAN', 'RAAS', 'Tipitapa', 'Jinotepe',
  'Diriamba', 'Ocotal', 'Somoto', 'Juigalpa', 'San Carlos', 'Nindirí',
  'Niquinohomo', 'Catarina', 'Ticuantepe', 'Ciudad Sandino', 'Madriz',
  'Costa Caribe',
];

export const NICARAGUA_PLACE_RE = new RegExp(
  '\\b(?:' + NICARAGUA_PLACES.map(escapeRe).join('|') + ')\\b',
  'i',
);

/**
 * Versión global case-SENSITIVE (uso: trust.ts) — preserva la semántica
 * original de solo contar la forma capitalizada como ubicación.
 */
export const NICARAGUA_PLACE_CS_GLOBAL_RE = new RegExp(
  '\\b(?:' + NICARAGUA_PLACES.map(escapeRe).join('|') + ')\\b',
  'g',
);

/**
 * Ubicación concreta: lugar del catálogo o patrón "comunidad/municipio/
 * aldea/barrio/departamento de <Nombre Propio>" (p.ej. "comunidad de
 * El Inocente N.º 2").
 */
const NAMED_LOCALITY_RE =
  /\b(?:comunidad|municipio|aldea|barrio|departamento|comarca|zona)\s+(?:de|del|de la|de las)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/;

export function hasConcretePlace(text: string): boolean {
  return NICARAGUA_PLACE_RE.test(text) || NAMED_LOCALITY_RE.test(text);
}
