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
  'bloqueaPorServicio' | 'exigeContexto' | 'exigeDiferencial' | 'minPalabras' | 'mensajeServicioFaltante'
>;

const REGLES_POR_CATEGORIA: Record<string, CategoriaReglas> = {
  sucesos: {
    bloqueaPorServicio: true,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 200,
    mensajeServicioFaltante: 'La nota de sucesos no responde qué ocurrió, qué se sabe, qué investiga la Policía ni qué sigue.',
  },
  politica: {
    bloqueaPorServicio: true,
    exigeContexto: true,
    exigeDiferencial: true,
    minPalabras: 250,
    mensajeServicioFaltante: 'La nota política no explica qué decidieron, a quién afecta ni qué cambia para el lector.',
  },
  economia: {
    bloqueaPorServicio: true,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 200,
    mensajeServicioFaltante: 'La nota económica no explica cuál es el dato, cómo impacta el bolsillo ni qué cambia prácticamente.',
  },
  nacionales: {
    bloqueaPorServicio: true,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 200,
    mensajeServicioFaltante: 'La nota nacional no explica qué cambia, a quién afecta ni qué debe saber el ciudadano.',
  },
  internacionales: {
    bloqueaPorServicio: true,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 200,
    mensajeServicioFaltante: 'La nota internacional no explica por qué importa para Nicaragua ni qué implica para el lector.',
  },
  deportesindividuales: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 150,
    mensajeServicioFaltante: 'La nota del atleta individual no incluye datos prácticos como próximo evento, lugar, fecha o trayectoria.',
  },
  deportes: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 150,
    mensajeServicioFaltante: 'La nota deportiva no incluye datos prácticos como cuándo, dónde o cómo ver el evento.',
  },
  cultura: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 150,
    mensajeServicioFaltante: 'La nota cultural no incluye datos prácticos: dónde, cuándo, precio o cómo asistir.',
  },
  espectaculos: {
    bloqueaPorServicio: false,
    exigeContexto: false,
    exigeDiferencial: false,
    minPalabras: 120,
    mensajeServicioFaltante: 'La nota de entretenimiento no incluye datos prácticos del evento: qué es, dónde, cuándo, precio o cómo asistir.',
  },
  tecnologia: {
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 150,
    mensajeServicioFaltante: 'La nota tecnológica no explica para quién es, dónde conseguirlo ni el precio/disponibilidad.',
  },
  salud: {
    bloqueaPorServicio: true,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 180,
    mensajeServicioFaltante: 'La nota de salud no explica qué hacer, cómo prevenir o dónde acudir.',
  },
  educacion: {
    bloqueaPorServicio: true,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 180,
    mensajeServicioFaltante: 'La nota educativa no explica qué debe hacer el estudiante o la familia, dónde acudir ni los plazos.',
  },
  general: {
    bloqueaPorServicio: false,
    exigeContexto: false,
    exigeDiferencial: false,
    minPalabras: 120,
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
    else if (/nacional|comunidad|local/i.test(cat)) key = 'nacionales';
    else key = 'general';
  }

  if (key === 'deportes' && textoPlano && INDIVIDUAL_SPORTS_KEYWORDS.test(textoPlano)) {
    return CATEGORIAS_EDITORIALES['deportesindividuales'];
  }
  return CATEGORIAS_EDITORIALES[key] || CATEGORIAS_EDITORIALES['general'];
}
