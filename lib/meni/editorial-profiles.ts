/**
 * MENI Editorial Profiles v3.0
 * ================================
 * Construido a partir de lib/meni/editorial-contract.ts.
 * El contrato es la fuente de verdad para intenciones, preguntas y servicio.
 */
import {
  getContratoEditorial,
  intencionesToRegexes,
  CONTRATO_GLOBAL,
} from './editorial-contract';

export const PERFIL_MEDIO = {
  nombre: 'Nicaragua Informate',
  tipo: 'Medio digital regional',
  poseeUnidadInvestigativa: false,
  poseeCorresponsalesInternacionales: false,
  poseeFuentesPermanentes: false,
  fuentesPermanentes: [],
  trabajo: 'Transformar información pública en periodismo útil',
  restricciones: [
    'No exigir fuente policial exclusiva',
    'No exigir comunicado oficial',
    'No exigir entrevista directa',
    'No exigir documento exclusivo',
    'No exigir declaración de fuente oficial',
  ],
  expresionesAceptadas: [
    'según versiones preliminares',
    'de acuerdo con medios locales',
    'la Policía investiga',
    'según se conoció',
  ],
} as const;

export interface EditorialCriterios {
  /** Nombre canónico detectado */
  tipo: string;
  /** Descripción del lector ideal y su intención */
  intencionLector: string;
  /** Preguntas que el contenido debe responder para aprobar */
  preguntasObligatorias: string[];
  /** RegExp para detectar contexto en el texto */
  contexto: RegExp[];
  /** RegExp para detectar explicación en el texto */
  explicacion: RegExp[];
  /** RegExp para detectar servicio/valor práctico en el texto */
  servicio: RegExp[];
  /** Palabras prohibidas específicas de la categoría */
  palabrasProhibidas: string[];
  /** Datos que nunca deben inventarse */
  datosNoInventar: string[];
  /** Si la ausencia de respuesta bloquea la nota */
  bloqueaPorServicio: boolean;
  /** Si se exige contexto histórico/antecedentes */
  exigeContexto: boolean;
  /** Si se exige valor diferencial comparado con la competencia */
  exigeDiferencial: boolean;
  /** Longitud mínima recomendada (palabras) */
  minPalabras: number;
  /** Mensaje cuando falla el servicio */
  mensajeServicioFaltante: string;
}

type CategoriaReglas = Pick<
  EditorialCriterios,
  'bloqueaPorServicio' | 'exigeContexto' | 'exigeDiferencial' | 'minPalabras' | 'mensajeServicioFaltante' | 'palabrasProhibidas' | 'datosNoInventar'
>;

const REGLES_POR_CATEGORIA: Record<string, CategoriaReglas> = {
  sucesos: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 200,
    palabrasProhibidas: ['consternada', 'conmoción', 'último adiós', 'fatal desenlace', 'cristiana sepultura', 'ambiente de dolor', 'profundo dolor', 'vida truncada', 'joven promesa', 'perdió la vida', 'incomprensible', 'indignante', 'irresponsable'],
    datosNoInventar: ['nombres de funcionarios', 'comunicados oficiales', 'declaraciones de fuentes anónimas sin explicar de dónde salió el dato', 'historial de accidentes en la zona a menos que sea específico y verificable'],
    mensajeServicioFaltante: 'La nota de sucesos no responde qué ocurrió, dónde, quiénes estuvieron involucrados, el estado de las víctimas, qué investigan las autoridades ni qué sigue en el proceso.',
  },
  politica: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: true,
    minPalabras: 250,
    palabrasProhibidas: ['increíble', 'inimaginable', 'escandaloso', 'vergonzoso'],
    datosNoInventar: ['nombres de funcionarios', 'comunicados oficiales', 'declaraciones de fuentes anónimas sin explicar de dónde salió el dato'],
    mensajeServicioFaltante: 'La nota política no explica qué decidieron, a quién afecta ni qué cambia para el lector.',
  },
  economia: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 200,
    palabrasProhibidas: ['increíble', 'inimaginable', 'escandaloso', 'vergonzoso'],
    datosNoInventar: ['cifras económicas sin fuente', 'declaraciones de funcionarios no atribuidas'],
    mensajeServicioFaltante: 'La nota económica no explica cuál es el dato, cómo impacta el bolsillo ni qué cambia prácticamente.',
  },
  nacionales: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 200,
    palabrasProhibidas: ['increíble', 'inimaginable', 'escandaloso', 'vergonzoso'],
    datosNoInventar: ['nombres de funcionarios', 'comunicados oficiales', 'declaraciones de fuentes anónimas sin explicar de dónde salió el dato'],
    mensajeServicioFaltante: 'La nota nacional no explica qué cambia, a quién afecta ni qué debe saber el ciudadano.',
  },
  internacionales: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 200,
    palabrasProhibidas: ['increíble', 'inimaginable', 'escandaloso', 'vergonzoso'],
    datosNoInventar: ['cifras sin fuente', 'declaraciones de funcionarios extranjeros no atribuidas'],
    mensajeServicioFaltante: 'La nota internacional no explica por qué importa para Nicaragua ni qué implica para el lector.',
  },
  deportesindividuales: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 150,
    palabrasProhibidas: ['increíble', 'inimaginable', 'escandaloso', 'vergonzoso', 'aterrador', 'mortífero', 'sangriento', 'brutal', 'salvaje'],
    datosNoInventar: ['resultados no verificados', 'marcas o récords no confirmados', 'declaraciones de atletas no atribuidas'],
    mensajeServicioFaltante: 'La nota del atleta individual no incluye datos prácticos como próximo evento, lugar, fecha o trayectoria.',
  },
  deportes: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 150,
    palabrasProhibidas: ['increíble', 'inimaginable', 'escandaloso', 'brutal', 'salvaje'],
    datosNoInventar: ['resultados no verificados', 'alineaciones no confirmadas', 'declaraciones de atletas no atribuidas'],
    mensajeServicioFaltante: 'La nota deportiva no incluye datos prácticos como cuándo, dónde o cómo ver el evento.',
  },
  cultura: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 150,
    palabrasProhibidas: ['increíble', 'inimaginable', 'escandaloso', 'vergonzoso', 'aterrador', 'mortífero', 'sangriento', 'brutal', 'salvaje'],
    datosNoInventar: ['fechas no confirmadas', 'precios no verificados', 'declaraciones de artistas no atribuidas'],
    mensajeServicioFaltante: 'La nota cultural no incluye datos prácticos: dónde, cuándo, precio o cómo asistir.',
  },
  espectaculos: {
    bloqueaPorServicio: false,
    exigeContexto: false,
    exigeDiferencial: false,
    minPalabras: 120,
    palabrasProhibidas: ['increíble', 'inimaginable', 'escandaloso', 'vergonzoso', 'aterrador', 'mortífero', 'sangriento', 'brutal', 'salvaje'],
    datosNoInventar: ['fechas no confirmadas', 'precios no verificados', 'declaraciones de artistas no atribuidas'],
    mensajeServicioFaltante: 'La nota de entretenimiento no incluye datos prácticos del evento: qué es, dónde, cuándo, precio o cómo asistir.',
  },
  tecnologia: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 150,
    palabrasProhibidas: ['increíble', 'inimaginable', 'escandaloso', 'vergonzoso', 'aterrador', 'mortífero', 'sangriento', 'brutal', 'salvaje'],
    datosNoInventar: ['especificaciones técnicas no verificadas', 'precios no confirmados', 'disponibilidad sin fuente'],
    mensajeServicioFaltante: 'La nota tecnológica no explica para quién es, dónde conseguirlo ni el precio/disponibilidad.',
  },
  salud: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 180,
    palabrasProhibidas: ['trágico', 'terrible', 'impactante', 'devastador', 'horrible', 'alarmante', 'desgarrador', 'lamentable', 'dramático', 'crítico', 'increíble', 'inimaginable', 'escandaloso', 'vergonzoso'],
    datosNoInventar: ['cifras de casos sin Minsa u OMS', 'tratamientos no respaldados por autoridades de salud', 'declaraciones de médicos no atribuidas'],
    mensajeServicioFaltante: 'La nota de salud no explica qué hacer, cómo prevenir o dónde acudir.',
  },
  educacion: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 180,
    palabrasProhibidas: ['trágico', 'terrible', 'impactante', 'devastador', 'horrible', 'alarmante', 'desgarrador', 'lamentable', 'dramático', 'crítico', 'increíble', 'inimaginable', 'escandaloso', 'vergonzoso'],
    datosNoInventar: ['fechas de matrícula no confirmadas', 'requisitos no verificados', 'declaraciones de funcionarios del MINED no atribuidas'],
    mensajeServicioFaltante: 'La nota educativa no explica qué debe hacer el estudiante o la familia, dónde acudir ni los plazos.',
  },
  medioambiente: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 180,
    palabrasProhibidas: ['trágico', 'terrible', 'impactante', 'devastador', 'horrible', 'alarmante', 'desgarrador', 'lamentable', 'dramático', 'crítico', 'increíble', 'inimaginable', 'escandaloso', 'vergonzoso'],
    datosNoInventar: ['cifras de daños sin fuente', 'declaraciones de expertos no atribuidas', 'pronósticos sin Ineter o Marena'],
    mensajeServicioFaltante: 'La nota ambiental no explica qué hacer, qué autoridades informaron ni qué precauciones tomar.',
  },
  general: {
    bloqueaPorServicio: false,
    exigeContexto: false,
    exigeDiferencial: false,
    minPalabras: 120,
    palabrasProhibidas: ['consternada', 'conmoción', 'último adiós', 'fatal desenlace', 'ambiente de dolor', 'profundo dolor', 'vida truncada', 'joven promesa', 'perdió la vida', 'incomprensible', 'indignante', 'irresponsable'],
    datosNoInventar: ['nombres de funcionarios', 'comunicados oficiales', 'declaraciones de fuentes anónimas sin explicar de dónde salió el dato'],
    mensajeServicioFaltante: 'La nota no responde qué hacer ni qué cambia para el lector.',
  },
};

function buildCategoriasEditoriales(): Record<string, EditorialCriterios> {
  const map: Record<string, EditorialCriterios> = {};
  for (const key of Object.keys(CONTRATO_GLOBAL.categorias)) {
    const contrato = getContratoEditorial(key);
    const reglas = REGLES_POR_CATEGORIA[key] || REGLES_POR_CATEGORIA['general'];
    map[key] = {
      tipo: contrato.categoria.toLowerCase(),
      intencionLector: contrato.descripcion,
      preguntasObligatorias: contrato.obligatorio,
      contexto: intencionesToRegexes(contrato.contexto),
      explicacion: intencionesToRegexes(contrato.explicacion),
      servicio: intencionesToRegexes(contrato.servicio),
      ...reglas,
    };
  }
  return map;
}

export const CATEGORIAS_EDITORIALES: Record<string, EditorialCriterios> = buildCategoriasEditoriales();

export const INDIVIDUAL_SPORTS_KEYWORDS =
  /\b(?:artes\s+marciales|sanda|wushu|lucha|luchador|mma|muay\s+thai|kickboxing|cinturon|cintur[oó]n|boxeo|boxeador|atletismo|atleta|nadador|nataci[oó]n|ciclismo|ciclista|gimnasia|gimnasta|halterofilia|halter[oó]filo|esgrima|esgrimista|judo|judoka|karate|karateca|taekwondo|taekwondista|surf|skate|patinaje|patinador|patinadora|tenis|tenista|golf|golfista|yudo|yudoka|taekwondin)\b/i;

export function getPerfilEditorial(categoria: string, textoPlano?: string): EditorialCriterios {
  const cat = (categoria || 'General')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  let key = cat;
  if (!CATEGORIAS_EDITORIALES[key]) {
    if (/suceso|polic|judicial|accidente|delito|crimen/i.test(cat)) key = 'sucesos';
    else if (/deporte|f[uú]tbol|b[eé]isbol/i.test(cat)) key = 'deportes';
    else if (/tecno|gadget|app|software/i.test(cat)) key = 'tecnologia';
    else if (/espect|entreten|evento|cine|m[uú]sica|show/i.test(cat)) key = 'espectaculos';
    else if (/cultur|art|patrimonio|galeria/i.test(cat)) key = 'cultura';
    else if (/internac|mundial|global/i.test(cat)) key = 'internacionales';
    else if (/econom|finanza|precio|salario/i.test(cat)) key = 'economia';
    else if (/pol[ií]t|gobierno|asamblea/i.test(cat)) key = 'politica';
    else if (/salud|minsa|vacuna|sintoma|pandemia/i.test(cat)) key = 'salud';
    else if (/educ|mined|universidad|colegio/i.test(cat)) key = 'educacion';
    else if (/medio\s*ambiente|ambiental|clima|inundaci|sequ|deslizamiento|erupci/i.test(cat)) key = 'medioambiente';
    else if (/nacional|comunidad|local/i.test(cat)) key = 'nacionales';
    else key = 'general';
  }

  if (key === 'deportes' && textoPlano && INDIVIDUAL_SPORTS_KEYWORDS.test(textoPlano)) {
    return CATEGORIAS_EDITORIALES['deportesindividuales'];
  }
  return CATEGORIAS_EDITORIALES[key] || CATEGORIAS_EDITORIALES['general'];
}
