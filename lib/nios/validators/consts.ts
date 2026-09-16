// lib/nios/validators/consts.ts
// Conjuntos de referencia deterministas. Son extensibles, no cerrados.

export const PREPOSITIONS = new Set([
  'a', 'al', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'del', 'desde', 'durante',
  'en', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'pro', 'segun',
  'según', 'sin', 'sobre', 'tras', 'versus', 'via', 'vía',
]);

export const CONJUNCTIONS = new Set([
  'y', 'e', 'ni', 'o', 'u', 'pero', 'sino', 'aunque', 'porque', 'pues', 'como',
  'que', 'si', 'cuando', 'mientras', 'aun', 'aún', 'mas', 'más', 'luego', 'entonces',
  'ademas', 'además', 'así', 'tan', 'tanto', 'por', 'para', 'segun', 'según',
  'pero', 'sino', 'aunque', 'pues', 'porque', 'como', 'cuando', 'mientras', 'aun', 'aún',
]);

export const FUNCTION_WORDS = new Set([...PREPOSITIONS, ...CONJUNCTIONS, 'el', 'la', 'los', 'las',
  'un', 'una', 'unos', 'unas', 'lo', 'le', 'les', 'se', 'me', 'te', 'nos', 'os',
  'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella', 'aquellos', 'aquellas',
  'mi', 'tu', 'su', 'sus', 'mis', 'tus', 'nuestro', 'nuestra', 'vuestro', 'vuestra',
  'del', 'al', 'lo', 'los', 'las', 'le', 'les', 'y', 'o', 'u', 'e', 'ni',
]);

export const GENERIC_SOURCE_DENYLIST = new Set([
  'redaccion nicaragua informate',
  'redacción nicaragua informate',
  'nicaragua informate',
  'nota de prensa',
  'sin fuente',
  'fuentes propias',
  'fuente propia',
  'comunicado',
  'rrpp',
  'prensa',
  'redes sociales',
]);

export const GENERIC_LEAD_DENYLIST = new Set([
  'redaccion nicaragua informate',
  'redacción nicaragua informate',
  'nota de prensa',
  'comunicado de prensa',
  'informe especial',
  'boletin informativo',
  'boletín informativo',
]);

export const QUÉ_TOKENS = new Set([
  'qué', 'que', 'ocurrió', 'ocurrio', 'sucedió', 'sucedio', 'pasó', 'paso',
  'trata', 'consiste', 'anunció', 'anuncio', 'informó', 'informo', 'explicó', 'explico',
  'detalló', 'detallo', 'confirmó', 'confirmo', 'indicó', 'indico', 'señaló', 'senaló',
  'reportó', 'reporto', 'presentó', 'presento', 'destacó', 'destaco',
]);

export const CUÁNDO_TOKENS = new Set([
  'hoy', 'ayer', 'mañana', 'manana', 'ahora', 'luego', 'pronto', 'tarde', 'temprano',
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre',
  'octubre', 'noviembre', 'diciembre', 'lunes', 'martes', 'miércoles', 'miercoles', 'jueves',
  'viernes', 'sábado', 'sabado', 'domingo', 'semana', 'mes', 'año', 'años', 'día', 'dias',
  'dia', 'hora', 'horas', 'minuto', 'minutos', 'pasado', 'pasada', 'próximo', 'proximo',
  'último', 'ultimo', 'pasados', 'pasadas', 'pasado', 'anteayer',
]);

export const DÓNDE_TOKENS = new Set([
  'managua', 'nicaragua', 'norte', 'sur', 'este', 'oeste', 'centro', 'capital',
  'frontera', 'fronteriza', 'departamento', 'municipio', 'comunidad', 'barrio', 'calle',
  'avenida', 'carretera', 'ciudad', 'pueblo', 'poblado', 'zona', 'sector', 'region',
  'región', 'país', 'pais', 'interior', 'exterior', 'localidad', 'provincia', 'distrito',
  'parque', 'plaza', 'mercado', 'hospital', 'escuela', 'universidad', 'colegio', 'centro',
  'san', 'santa', 'santo', 'benito', 'boaco', 'jinotega', 'estelí', 'esteli', 'granada',
  'masaya', 'matagalpa', 'chontales', 'rivas', 'madriz', 'nueva segovia', 'raccs',
  'raan', 'racs', 'raan', 'costa rica', 'honduras', 'salvador', 'guatemala',
]);

export const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]/gu;

export const URL_REGEX = /^https?:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z0-9-]+(?::\d+)?(?:[/?#][^\s]*)?$/;

// Tokens que tienen forma de verbo pero son nombres comunes.
// El morphological finite-verb detector evita falsos positivos consultando esta lista.
export const NON_VERB_TOKENS = new Set([
  'casa', 'mesa', 'silla', 'perro', 'gato', 'coche', 'carro', 'moto', 'libro', 'mano',
  'pie', 'cabeza', 'ojo', 'boca', 'noche', 'dia', 'día', 'tarde', 'mañana', 'año', 'mes',
  'semana', 'hora', 'minuto', 'segundo', 'ciudad', 'pais', 'país', 'calle', 'avenida', 'plaza',
  'parque', 'escuela', 'colegio', 'universidad', 'trabajo', 'oficina', 'empresa', 'negocio',
  'mercado', 'tienda', 'restaurante', 'comida', 'agua', 'pan', 'leche', 'cafe', 'café',
  'jugo', 'fruta', 'carne', 'pollo', 'pescado', 'arroz', 'frijol', 'papa', 'tomate', 'cebolla',
  'manzana', 'naranja', 'plátano', 'platano', 'mango', 'uva', 'mujer', 'hombre', 'niño', 'nina',
  'niña', 'persona', 'gente', 'familia', 'amigo', 'amiga', 'vecino', 'vecina', 'doctor', 'doctora',
  'maestro', 'maestra', 'policia', 'policía', 'bombero', 'bombera', 'juez', 'jueza', 'abogado',
  'abogada', 'periodista', 'escritor', 'escritora', 'cantante', 'actor', 'actriz', 'deportista',
  'futbolista', 'beisbolista', 'boxeador', 'nadador', 'corredor', 'presidente', 'presidenta',
  'ministro', 'ministra', 'diputado', 'diputada', 'gobernador', 'gobernadora', 'alcalde', 'alcaldesa',
  'senador', 'senadora', 'vicepresidente', 'vicepresidenta', 'intendente', 'comisionado',
]);

// Verbos copulativos / auxiliares comunes. Fallback cuando el detector morfológico no es concluyente.
// No es el mecanismo principal (no depende exclusivamente de una lista pequeña).
export const AUXILIARY_VERBS = new Set([
  'es', 'soy', 'eres', 'somos', 'sois', 'son', 'fue', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron',
  'era', 'eras', 'era', 'éramos', 'erais', 'eran', 'será', 'serás', 'será', 'seremos', 'seréis', 'serán',
  'sería', 'serías', 'sería', 'seríamos', 'seríais', 'serían', 'sea', 'seas', 'sea', 'seamos', 'seáis',
  'sean', 'sido', 'siendo',
  'está', 'estoy', 'estás', 'estamos', 'estáis', 'están', 'estuve', 'estuviste', 'estuvo', 'estuvimos',
  'estuvisteis', 'estuvieron', 'estaba', 'estabas', 'estaba', 'estábamos', 'estabais', 'estaban',
  'estará', 'estarás', 'estará', 'estaremos', 'estaréis', 'estarán', 'estaría', 'estarías', 'estaría',
  'estaríamos', 'estaríais', 'estarían', 'esté', 'estés', 'esté', 'estemos', 'estéis', 'estén',
  'estado', 'estando',
  'hay', 'hubo', 'había', 'habían', 'habrá', 'habría', 'haya', 'hayan', 'habido', 'habiendo',
  'ha', 'has', 'han', 'hemos', 'habéis', 'hube', 'hubiste', 'hubo', 'hubimos', 'hubisteis', 'hubieron',
  'hace', 'hago', 'haces', 'hacemos', 'hacéis', 'hacen', 'hizo', 'hiciste', 'hicimos', 'hicieron',
  'hacía', 'hacían', 'hará', 'harán', 'haga', 'hagan', 'hecho', 'haciendo',
  'tiene', 'tengo', 'tienes', 'tenemos', 'tenéis', 'tienen', 'tuve', 'tuviste', 'tuvo', 'tuvimos',
  'tuvisteis', 'tuvieron', 'tenía', 'tenías', 'tenía', 'teníamos', 'teníais', 'tenían', 'tendrá',
  'tendrán', 'tenga', 'tengan', 'tenido', 'teniendo',
]);
