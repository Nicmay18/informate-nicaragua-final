/**
 * Entity Extractor — Extrae y normaliza entidades del texto de una noticia.
 * Reutiliza y extiende los patrones de context-engine.ts y entities.ts.
 */

import type { EntityType, KnowledgeEntity } from './types';

const DEPARTAMENTOS_NI = [
  'Managua', 'León', 'Granada', 'Masaya', 'Chinandega', 'Estelí',
  'Matagalpa', 'Jinotega', 'Rivas', 'Carazo', 'Chontales',
  'Boaco', 'Nueva Segovia', 'Madriz', 'Río San Juan',
  'Bluefields', 'Corn Island', 'San Carlos', 'Juigalpa',
  'Tipitapa', 'Ciudad Sandino', 'Masachapa', ' Nagarote',
  'Diriamba', 'Jinotepe', 'Estelí', 'Ocotal', 'Somoto',
];

const MUNICIPIOS_NI = [
  'Tipitapa', 'Ciudad Sandino', 'El Crucero', 'Mateare', 'San Rafael del Sur',
  'Nagarote', 'La Paz Centro', 'El Jicaral', 'Achuapa', 'Telica',
  'Quezalguaque', 'La Recolectora', 'El Sauce', 'Moyogalpa', 'Altagracia',
  'Tola', 'Cárdenas', 'San Juan del Sur', 'Belén', 'Potosí',
  'Bocana de Paiwas', 'El Ayote', 'Santo Tomás', 'Santo Domingo',
  'Villa El Carmen', 'San Francisco Libre', 'Ticuantepe', 'El Cua',
];

const VOLCANES_NI: Record<string, { depto: string; info: string }> = {
  'Telica': { depto: 'León', info: 'Volcán activo en la cordillera de Los Maribios, León' },
  'San Cristóbal': { depto: 'Chinandega', info: 'Volcán más alto de Nicaragua, Chinandega' },
  'Concepción': { depto: 'Granada', info: 'Volcán en la Isla de Ometepe, Granada' },
  'Maderas': { depto: 'Granada', info: 'Volcán inactivo en la Isla de Ometepe, Granada' },
  'Masaya': { depto: 'Masaya', info: 'Volcán activo en el Parque Nacional Volcán Masaya' },
  'Momotombo': { depto: 'León', info: 'Volcán junto al Lago Xolotlán, León' },
  'Cerro Negro': { depto: 'León', info: 'Volcán joven y activo en la cordillera de Los Maribios, León' },
  'Mombacho': { depto: 'Granada', info: 'Volcán inactivo junto a Granada, reserva natural' },
};

const INSTITUCIONES_NI: Record<string, string> = {
  'Policía Nacional': 'Cuerpo policial de Nicaragua',
  'Ejército de Nicaragua': 'Fuerza militar de Nicaragua',
  'MINED': 'Ministerio de Educación',
  'MINSA': 'Ministerio de Salud',
  'INETER': 'Instituto Nicaragüense de Estudios Territoriales',
  'MIFIC': 'Ministerio de Fomento, Industria y Comercio',
  'INSS': 'Instituto Nicaragüense de Seguridad Social',
  'CSE': 'Consejo Supremo Electoral',
  'BCN': 'Banco Central de Nicaragua',
  'ENATREL': 'Empresa Nacional de Transmisión Eléctrica',
  'ENACAL': 'Empresa Nicaragüense de Acueductos y Alcantarillados',
  'INTUR': 'Instituto Nicaragüense de Turismo',
  'INIDE': 'Instituto Nacional de Información de Desarrollo',
  'SINAPRED': 'Sistema Nacional para la Prevención, Mitigación y Atención de Desastres',
  'Procuraduría': 'Procuraduría General de la República',
  'Contraloría': 'Contraloría General de la República',
  'Asamblea Nacional': 'Órgano legislativo de Nicaragua',
  'Corte Suprema de Justicia': 'Órgano judicial de Nicaragua',
  'Ministerio Público': 'Fiscalía General de la República',
  'MRE': 'Ministerio de Relaciones Exteriores',
  'MINJ': 'Ministerio de la Juventud',
  'MINTUR': 'Ministerio de Turismo',
  'IND': 'Instituto Nicaragüense de Deportes',
  'INIFOM': 'Instituto Nicaragüense de Fomento Municipal',
  'URACCAN': 'Universidad de las Regiones Autónomas de la Costa Caribe Nicaragüense',
  'UNAN': 'Universidad Nacional Autónoma de Nicaragua',
  'UNI': 'Universidad Nacional de Ingeniería',
  'UCA': 'Universidad Centroamericana',
};

const TEMAS_NI: Record<string, string[]> = {
  'accidentes de tránsito': ['accidente', 'choque', 'colisión', 'volcadura', 'atropello', 'vehicular'],
  'volcanes': ['volcán', 'erupción', 'explosión', 'ceniza', 'gases', 'cráter', 'lava'],
  'delincuencia': ['robo', 'asalto', 'hurto', 'delito', 'delincuente', 'pandilla'],
  'homicidios': ['homicidio', 'asesinato', 'fallecido', 'muerto', 'víctima', 'balacera'],
  'salud pública': ['dengue', 'malaria', 'covid', 'gripe', 'epidemia', 'contagio', 'virus'],
  'economía': ['inflación', 'precio', 'córdoba', 'dólar', 'exportación', 'importación', 'PIB'],
  'educación': ['escuela', 'colegio', 'universidad', 'maestro', 'profesor', 'estudiante', 'clases'],
  'clima': ['lluvia', 'tormenta', 'inundación', 'deslave', 'sequía', 'huracán', 'temporal'],
  'política': ['gobierno', 'presidente', 'asamblea', 'diputado', 'ley', 'decreto', 'reforma'],
  'deportes': ['fútbol', 'béisbol', 'boxeo', 'selección', 'liga', 'campeonato', 'torneo'],
  'energía': ['energía', 'eléctrica', 'apagón', 'transformador', 'red eléctrica', 'ENATREL'],
  'agua': ['agua', 'acueducto', 'sequía', 'racionamiento', 'ENACAL', 'pozo'],
  'migración': ['migrante', 'deportado', 'frontera', 'emigración', ' éxodo'],
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function entityId(type: EntityType, name: string): string {
  return `${type}:${normalizeName(name)}`;
}

function detectPersonas(text: string): string[] {
  const personas = new Set<string>();
  const patterns = [
    /\b(?:presidente|directora?|alcaldesa?|ministra|ministro|gobernadora?|comandante|coronel|capitán|general|doctora?|ingeniera?|licenciada?|portavoz|vocera?)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/g,
    /\bsegún\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/g,
    /\b(?:informó|confirmó|dijo|declaró|anunció|señaló|explicó|advirtió)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/g,
  ];
  for (const p of patterns) {
    let m: RegExpExecArray | null;
    while ((m = p.exec(text)) !== null) {
      const nombre = m[1].trim();
      if (nombre.length > 5 && !['Nicaragua', 'Managua', 'Informate'].includes(nombre)) {
        personas.add(nombre);
      }
    }
  }
  return [...personas].slice(0, 15);
}

function detectLugares(text: string): string[] {
  const lugares = new Set<string>();
  for (const dep of [...DEPARTAMENTOS_NI, ...MUNICIPIOS_NI]) {
    const regex = new RegExp(`\\b${dep}\\b`, 'gi');
    if (regex.test(text)) lugares.add(dep);
  }
  const barrioPattern = /\b(barrio|colonia|residencial|sector|comunidad)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/g;
  let m: RegExpExecArray | null;
  while ((m = barrioPattern.exec(text)) !== null) {
    lugares.add(`${m[1]} ${m[2]}`.trim());
  }
  const carreteraPattern = /\b(carretera|autopista|km\.?)\s+([0-9]+|[A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){0,2})/g;
  while ((m = carreteraPattern.exec(text)) !== null) {
    lugares.add(`${m[1]} ${m[2]}`.trim());
  }
  return [...lugares].slice(0, 15);
}

function detectInstituciones(text: string): string[] {
  const instituciones = new Set<string>();
  for (const nombre of Object.keys(INSTITUCIONES_NI)) {
    const regex = new RegExp(nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (regex.test(text)) instituciones.add(nombre);
  }
  const siglaPattern = /\b([A-Z]{3,6})\b/g;
  let m: RegExpExecArray | null;
  while ((m = siglaPattern.exec(text)) !== null) {
    const sigla = m[1];
    if (INSTITUCIONES_NI[sigla]) instituciones.add(sigla);
  }
  return [...instituciones].slice(0, 15);
}

function detectVolcanes(text: string): string[] {
  const volcanes = new Set<string>();
  for (const nombre of Object.keys(VOLCANES_NI)) {
    const regex = new RegExp(`\\bvolc[aá]n\\s+${nombre}\\b|\\b${nombre}\\b`, 'gi');
    if (regex.test(text)) volcanes.add(`Volcán ${nombre}`);
  }
  return [...volcanes];
}

function detectTemas(text: string): string[] {
  const temas = new Set<string>();
  const t = text.toLowerCase();
  for (const [tema, keywords] of Object.entries(TEMAS_NI)) {
    for (const kw of keywords) {
      if (t.includes(kw)) {
        temas.add(tema);
        break;
      }
    }
  }
  return [...temas];
}

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  normalizedName: string;
  id: string;
  description?: string;
  metadata: Record<string, unknown>;
}

export function extractEntities(
  title: string,
  content: string,
  category: string,
): ExtractedEntity[] {
  const text = stripHtml(content) + ' ' + title;
  const entities: ExtractedEntity[] = [];

  const personas = detectPersonas(text);
  const lugares = detectLugares(text);
  const instituciones = detectInstituciones(text);
  const volcanes = detectVolcanes(text);
  const temas = detectTemas(text);

  for (const p of personas) {
    entities.push({
      name: p,
      type: 'persona',
      normalizedName: normalizeName(p),
      id: entityId('persona', p),
      metadata: {},
    });
  }

  for (const l of lugares) {
    entities.push({
      name: l,
      type: 'lugar',
      normalizedName: normalizeName(l),
      id: entityId('lugar', l),
      metadata: {},
    });
  }

  for (const inst of instituciones) {
    entities.push({
      name: inst,
      type: 'institucion',
      normalizedName: normalizeName(inst),
      id: entityId('institucion', inst),
      description: INSTITUCIONES_NI[inst],
      metadata: { descripcion: INSTITUCIONES_NI[inst] },
    });
  }

  for (const v of volcanes) {
    const baseName = v.replace('Volcán ', '');
    const info = VOLCANES_NI[baseName];
    entities.push({
      name: v,
      type: 'lugar',
      normalizedName: normalizeName(v),
      id: entityId('lugar', v),
      description: info?.info,
      metadata: {
        esVolcan: true,
        departamento: info?.depto,
        info: info?.info,
      },
    });
  }

  for (const tema of temas) {
    entities.push({
      name: tema,
      type: 'tema',
      normalizedName: normalizeName(tema),
      id: entityId('tema', tema),
      metadata: {},
    });
  }

  if (category && category !== 'General') {
    entities.push({
      name: category,
      type: 'categoria',
      normalizedName: normalizeName(category),
      id: entityId('categoria', category),
      metadata: {},
    });
  }

  return entities;
}

export function buildKnowledgeEntities(
  extracted: ExtractedEntity[],
  articleDate: string,
): KnowledgeEntity[] {
  return extracted.map((e) => ({
    id: e.id,
    name: e.name,
    type: e.type,
    normalizedName: e.normalizedName,
    description: e.description,
    articleCount: 1,
    firstSeen: articleDate,
    lastSeen: articleDate,
    metadata: e.metadata,
  }));
}
