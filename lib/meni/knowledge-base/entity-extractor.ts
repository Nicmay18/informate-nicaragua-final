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
  'INATER': 'Instituto Nicaragüense de Estudios Territoriales',
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

const HOSPITALES_NI: Record<string, string> = {
  'Hospital Bertha Calderón': 'Hospital materno infantil más grande de Nicaragua, Managua',
  'Hospital Vivian Pellas': 'Hospital privado de trauma y especialidades, Managua',
  'Hospital Carlos Roberto Huembés': 'Hospital público de Managua',
  'Hospital Antonio Lenín Fonseca': 'Hospital público de Managua',
  'Hospital Manuel Antonio Cuadra': 'Hospital psiquiátrico nacional, Managua',
  'Hospital Alemán Nicaragüense': 'Hospital público de Managua',
  'Hospital Fernando Vélez Paiz': 'Hospital público de Managua',
  'Hospital San Juan de Dios': 'Hospital público de Granada',
  'Hospital Santiago': 'Hospital público de Jinotepe',
  'Hospital San Felipe': 'Hospital público de Chinandega',
  'Hospital La Trinidad': 'Hospital público de Estelí',
  'Hospital San Juan Bautista': 'Hospital público de León',
  'Hospital Humberto Alvarado': 'Hospital público de Masaya',
  'Hospital Vásquez Sáenz': 'Hospital público de Matagalpa',
};

const EMPRESAS_NI: Record<string, string> = {
  'Banpro': 'Banco de la Producción, Grupo Promerica',
  'Lafise': 'Grupo financiero Lafise',
  'BAC': 'Banco de América Central',
  'Claro': 'Empresa de telecomunicaciones en Nicaragua',
  'Tigo': 'Empresa de telecomunicaciones en Nicaragua',
  'Cargill': 'Empresa multinacional de alimentos en Nicaragua',
  'Nestlé': 'Empresa de alimentos en Nicaragua',
  'Coca-Cola': 'Embotelladora Coca-Cola en Nicaragua',
  'Pellas': 'Grupo Pellas, conglomerado nicaragüense',
  'Albanisa': 'Alba de Nicaragua, empresa petrolera',
  'Petronic': 'Empresa Nicaragüense de Petróleo',
  'Disnorte': 'Distribuidora Nacional de Electricidad',
  'Disur': 'Distribuidora de Electricidad del Sur',
};

const EQUIPOS_NI: Record<string, string> = {
  'Indios del Bóer': 'Equipo de béisbol de Managua',
  'Dantos de Managua': 'Equipo de béisbol de Managua',
  'Tigres de Chinandega': 'Equipo de béisbol de Chinandega',
  'Leones de León': 'Equipo de béisbol de León',
  'Fieras del San Fernando': 'Equipo de béisbol de Masaya',
  'Gigantes de Rivas': 'Equipo de béisbol de Rivas',
  'Real Estelí': 'Equipo de fútbol de Estelí',
  'Walter Ferretti': 'Equipo de fútbol de Managua',
  'Managua FC': 'Equipo de fútbol de Managua',
  'Diriangén': 'Equipo de fútbol de Diriamba',
};

const RIOS_NI: Record<string, string> = {
  'Río San Juan': 'Río que conecta el Lago de Nicaragua con el Mar Caribe',
  'Río Coco': 'Río más largo de Centroamérica, frontera con Honduras',
  'Río Tipitapa': 'Río que conecta el Lago de Managua con el Lago de Nicaragua',
  'Río Grande': 'Río de la Costa Caribe de Nicaragua',
  'Río Escondido': 'Río de la Costa Caribe Sur de Nicaragua',
  'Río Tuma': 'Río del norte de Nicaragua',
  'Río Viejo': 'Río del norte de Nicaragua',
  'Río Prinzapolka': 'Río de la Costa Caribe Norte',
  'Río Bocay': 'Río fronterizo con Honduras',
};

const CARRETERAS_NI: Record<string, string> = {
  'Carretera Norte': 'Vía que conecta Managua con Estelí y Nueva Segovia',
  'Carretera Sur': 'Vía que conecta Managua con Masaya, Granada y Rivas',
  'Carretera a León': 'Vía que conecta Managua con León y Chinandega',
  'Carretera del Pacífico': 'Ruta costera del Pacífico de Nicaragua',
  'Carretera a Jinotepe': 'Vía que conecta Managua con Carazo',
  'Carretera a Matagalpa': 'Vía que conecta Managua con Matagalpa y Jinotega',
  'Carretera Tipitapa-Masaya': 'Vía interdepartamental',
  'NIC-12': 'Carretera Jinotepe-La Trinidad',
};

const FESTIVALES_NI: Record<string, string> = {
  'Festival de Santo Domingo': 'Festival patronal de Managua, agosto',
  'Festival de la Purísima': 'Celebración religiosa nacional, diciembre',
  'Festival Gueguense': 'Festival cultural de Masaya',
  'Festival Internacional de Poesía': 'Festival de poesía en Granada',
  'Festival de Música': 'Festival musical en Nicaragua',
  'Carnaval de Bluefields': 'Carnaval de la Costa Caribe',
  'Fiestas Patronales de Masaya': 'Fiestas en honor a San Jerónimo',
  'Festival del Maíz': 'Festival cultural de Jinotepe',
};

const INFRAESTRUCTURA_NI: Record<string, string> = {
  'Aeropuerto Internacional Augusto C. Sandino': 'Aeropuerto internacional de Managua',
  'Puerto Corinto': 'Puerto marítimo del Pacífico en Chinandega',
  'Puerto El Bluff': 'Puerto de la Costa Caribe Sur',
  'Puerto Cabezas': 'Puerto de la Costa Caribe Norte',
  'Estadio Nacional Denis Martínez': 'Estadio nacional de béisbol, Managua',
  'Estadio Fernando Vélez Paiz': 'Estadio de béisbol de Managua',
  'Estadio Olímpico': 'Estadio de fútbol de Managua',
  'Multiestadio Stanley Cayasso': 'Estadio cubierto de Managua',
  'Lago de Nicaragua': 'Lago Cocibolca, el más grande de Centroamérica',
  'Lago de Managua': 'Lago Xolotlán',
};

const PROYECTOS_NI: Record<string, string> = {
  'Multiestadio Stanley Cayasso': 'Proyecto de remodelación del multiestadio',
  'Canal Interoceánico': 'Proyecto de canal interoceánico',
  'Tren de Carga': 'Proyecto ferroviario de carga',
  'Ampliación Carretera Norte': 'Proyecto de ampliación vial',
  'Plan Nacional de Desarrollo': 'Plan gubernamental de desarrollo',
};

const LEYES_NI: Record<string, string> = {
  'Ley de Participación Ciudadana': 'Legislación sobre participación ciudadana',
  'Ley de Municipalidades': 'Legislación sobre gobiernos locales',
  'Ley Electoral': 'Legislación sobre procesos electorales',
  'Ley de Autonomía': 'Ley de autonomía de la Costa Caribe',
  'Código Penal': 'Legislación penal de Nicaragua',
  'Código del Trabajo': 'Legislación laboral de Nicaragua',
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

function detectFromDict(text: string, dict: Record<string, string>): Array<{ name: string; description: string }> {
  const results: Array<{ name: string; description: string }> = [];
  for (const [nombre, desc] of Object.entries(dict)) {
    const regex = new RegExp(nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (regex.test(text)) results.push({ name: nombre, description: desc });
  }
  return results;
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
  slug: string;
  description?: string;
  keywords: string[];
  metadata: Record<string, unknown>;
}

function entitySlug(name: string): string {
  return normalizeName(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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
  const hospitales = detectFromDict(text, HOSPITALES_NI);
  const empresas = detectFromDict(text, EMPRESAS_NI);
  const equipos = detectFromDict(text, EQUIPOS_NI);
  const rios = detectFromDict(text, RIOS_NI);
  const carreteras = detectFromDict(text, CARRETERAS_NI);
  const festivales = detectFromDict(text, FESTIVALES_NI);
  const infraestructura = detectFromDict(text, INFRAESTRUCTURA_NI);
  const proyectos = detectFromDict(text, PROYECTOS_NI);
  const leyes = detectFromDict(text, LEYES_NI);

  for (const p of personas) {
    entities.push({
      name: p,
      type: 'persona',
      normalizedName: normalizeName(p),
      id: entityId('persona', p),
      slug: entitySlug(p),
      keywords: [p.toLowerCase()],
      metadata: {},
    });
  }

  for (const l of lugares) {
    entities.push({
      name: l,
      type: 'lugar',
      normalizedName: normalizeName(l),
      id: entityId('lugar', l),
      slug: entitySlug(l),
      keywords: [l.toLowerCase()],
      metadata: {},
    });
  }

  for (const inst of instituciones) {
    entities.push({
      name: inst,
      type: 'institucion',
      normalizedName: normalizeName(inst),
      id: entityId('institucion', inst),
      slug: entitySlug(inst),
      description: INSTITUCIONES_NI[inst],
      keywords: [inst.toLowerCase()],
      metadata: { descripcion: INSTITUCIONES_NI[inst] },
    });
  }

  for (const v of volcanes) {
    const baseName = v.replace('Volcán ', '');
    const info = VOLCANES_NI[baseName];
    entities.push({
      name: v,
      type: 'volcan',
      normalizedName: normalizeName(v),
      id: entityId('volcan', v),
      slug: entitySlug(v),
      description: info?.info,
      keywords: [v.toLowerCase(), baseName.toLowerCase()],
      metadata: {
        departamento: info?.depto,
        info: info?.info,
      },
    });
  }

  for (const h of hospitales) {
    entities.push({
      name: h.name,
      type: 'hospital',
      normalizedName: normalizeName(h.name),
      id: entityId('hospital', h.name),
      slug: entitySlug(h.name),
      description: h.description,
      keywords: [h.name.toLowerCase()],
      metadata: { descripcion: h.description },
    });
  }

  for (const emp of empresas) {
    entities.push({
      name: emp.name,
      type: 'empresa',
      normalizedName: normalizeName(emp.name),
      id: entityId('empresa', emp.name),
      slug: entitySlug(emp.name),
      description: emp.description,
      keywords: [emp.name.toLowerCase()],
      metadata: { descripcion: emp.description },
    });
  }

  for (const eq of equipos) {
    entities.push({
      name: eq.name,
      type: 'equipo',
      normalizedName: normalizeName(eq.name),
      id: entityId('equipo', eq.name),
      slug: entitySlug(eq.name),
      description: eq.description,
      keywords: [eq.name.toLowerCase()],
      metadata: { descripcion: eq.description },
    });
  }

  for (const r of rios) {
    entities.push({
      name: r.name,
      type: 'rio',
      normalizedName: normalizeName(r.name),
      id: entityId('rio', r.name),
      slug: entitySlug(r.name),
      description: r.description,
      keywords: [r.name.toLowerCase()],
      metadata: { descripcion: r.description },
    });
  }

  for (const c of carreteras) {
    entities.push({
      name: c.name,
      type: 'carretera',
      normalizedName: normalizeName(c.name),
      id: entityId('carretera', c.name),
      slug: entitySlug(c.name),
      description: c.description,
      keywords: [c.name.toLowerCase()],
      metadata: { descripcion: c.description },
    });
  }

  for (const f of festivales) {
    entities.push({
      name: f.name,
      type: 'festival',
      normalizedName: normalizeName(f.name),
      id: entityId('festival', f.name),
      slug: entitySlug(f.name),
      description: f.description,
      keywords: [f.name.toLowerCase()],
      metadata: { descripcion: f.description },
    });
  }

  for (const inf of infraestructura) {
    entities.push({
      name: inf.name,
      type: 'infraestructura',
      normalizedName: normalizeName(inf.name),
      id: entityId('infraestructura', inf.name),
      slug: entitySlug(inf.name),
      description: inf.description,
      keywords: [inf.name.toLowerCase()],
      metadata: { descripcion: inf.description },
    });
  }

  for (const pr of proyectos) {
    entities.push({
      name: pr.name,
      type: 'proyecto',
      normalizedName: normalizeName(pr.name),
      id: entityId('proyecto', pr.name),
      slug: entitySlug(pr.name),
      description: pr.description,
      keywords: [pr.name.toLowerCase()],
      metadata: { descripcion: pr.description },
    });
  }

  for (const ley of leyes) {
    entities.push({
      name: ley.name,
      type: 'ley',
      normalizedName: normalizeName(ley.name),
      id: entityId('ley', ley.name),
      slug: entitySlug(ley.name),
      description: ley.description,
      keywords: [ley.name.toLowerCase()],
      metadata: { descripcion: ley.description },
    });
  }

  for (const tema of temas) {
    entities.push({
      name: tema,
      type: 'tema',
      normalizedName: normalizeName(tema),
      id: entityId('tema', tema),
      slug: entitySlug(tema),
      keywords: [tema.toLowerCase()],
      metadata: {},
    });
  }

  if (category && category !== 'General') {
    entities.push({
      name: category,
      type: 'categoria',
      normalizedName: normalizeName(category),
      id: entityId('categoria', category),
      slug: entitySlug(category),
      keywords: [category.toLowerCase()],
      metadata: {},
    });
  }

  return entities;
}

export function buildKnowledgeEntities(
  extracted: ExtractedEntity[],
  articleDate: string,
  category?: string,
): KnowledgeEntity[] {
  return extracted.map((e) => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    type: e.type,
    normalizedName: e.normalizedName,
    description: e.description,
    articleCount: 1,
    firstSeen: articleDate,
    lastSeen: articleDate,
    keywords: e.keywords,
    categoriasRelacionadas: category && category !== 'General' ? [category] : [],
    metadata: e.metadata,
  }));
}
