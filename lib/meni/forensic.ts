import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniForense, MeniRecomendacion, MeniForenseEvidencia } from './types';
import type { NoticiaInput } from './types';
import type { MeniContentProfile } from './profile-detector';

type EvidenciaTipo =
  | 'citaDirecta'
  | 'atribucionPeriodistica'
  | 'precios'
  | 'horarios'
  | 'costos'
  | 'recomendaciones'
  | 'telefonos'
  | 'direcciones'
  | 'condicionesVisita'
  | 'comoLlegar'
  | 'ubicacion';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function fullText(input: NoticiaInput): string {
  return `${input.titulo || ''} ${input.resumen || ''} ${input.contenido || ''}`;
}

function contieneFrases(texto: string, frases: string[]): boolean {
  const n = normalize(texto);
  return frases.some((f) => n.includes(f));
}

function contienePalabras(texto: string, palabras: string[]): boolean {
  const n = normalize(texto);
  return palabras.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(n));
}

function detectarCitaDirecta(texto: string): boolean {
  // Comillas en una o varias líneas (hasta 600 caracteres) o contenido en blockquote.
  return /["«»“”‘’].{3,600}?["«»“”‘’]/s.test(texto) || /<blockquote[^>]*>/i.test(texto);
}

function detectarAtribucion(texto: string): boolean {
  const frases = [
    'segun', 'segun la', 'segun el', 'segun las', 'segun los',
    'de acuerdo con', 'de acuerdo a',
    'informo que', 'informaron que', 'confirmo que', 'confirmaron que',
    'indico que', 'indicaron que', 'declaro que', 'declararon que',
    'dijo que', 'dijeron que', 'afirmo que', 'afirmaron que',
    'explico que', 'explicaron que', 'anuncio que', 'anunciaron que',
    'manifesto', 'manifesto que', 'manifestaron que',
    'senalo', 'senalo que', 'senalando', 'senalaron que',
    'preciso', 'preciso que', 'precisaron que',
    'destaco', 'destaco que', 'destacaron que',
    'subrayo', 'subrayo que', 'subrayaron que',
    'agrego', 'agrego que', 'agregaron que',
    'expreso', 'expreso que', 'expresaron que',
    'reitero', 'reitero que', 'reiteraron que',
    'aseguro', 'aseguro que', 'aseguraron que',
    'puntualizo', 'puntualizo que', 'puntualizaron que',
    'sostuvo', 'sostuvieron que',
  ];
  const verbos = [
    'dijo', 'afirmo', 'manifesto', 'senalo', 'indico', 'informo',
    'confirmo', 'declaro', 'explico', 'anuncio', 'preciso', 'destaco',
    'subrayo', 'agrego', 'expreso', 'reitero', 'aseguro', 'puntualizo',
    'sostuvo', 'advirtio',
  ];
  return contieneFrases(texto, frases) || contienePalabras(texto, verbos);
}

function detectarPrecios(texto: string): boolean {
  return /\b(cordobas?|c\\$|\\$|dolares?|usd|precio|costo|tarifa|entrada)\b/i.test(texto) && /\d/.test(texto);
}

function detectarHorarios(texto: string): boolean {
  return /\b(horario|de \d{1,2}:?\d{0,2}\s*a\s*\d{1,2}:?\d{0,2}|a las \d{1,2}|de \d{1,2}\s*a\s*\d{1,2})\b/i.test(texto);
}

function detectarCostos(texto: string): boolean {
  return /\b(costo|gasto|inversion|presupuesto|monto)\b/i.test(texto) && /\d/.test(texto);
}

function detectarTelefonos(texto: string): boolean {
  return /\b\d{4}[-.\s]?\d{4}\b/.test(texto) || /\b\d{7,}\b/.test(texto);
}

function detectarDirecciones(texto: string): boolean {
  return contienePalabras(texto, ['direccion', 'ubicado', 'ubicada', 'calle', 'avenida', 'carretera', 'km']);
}

function detectarRecomendaciones(texto: string): boolean {
  return contienePalabras(texto, ['recomend', 'suger', 'consejo', 'tip', 'evitar', 'visitar', 'probar', 'disfrutar', 'mejor']);
}

function detectarCondicionesVisita(texto: string): boolean {
  return contienePalabras(texto, ['condicion', 'requisito', 'reglamento', 'permiso', 'reservacion', 'reserva', 'cupos', 'capacidad']);
}

function detectarComoLlegar(texto: string): boolean {
  return contieneFrases(texto, ['como llegar', 'llegar a', 'acceder', 'acceso', 'ruta', 'transporte']);
}

function detectarUbicacion(texto: string): boolean {
  return contieneFrases(texto, ['ubicado en', 'ubicada en', 'situado en', 'situada en', 'se encuentra en', 'esta en', 'esta ubicad']);
}

function esGuiaTuristica(input: NoticiaInput): boolean {
  const frases = [
    'guia', 'como visitar', 'que hacer', 'donde ir', 'donde comer',
    'recomendaciones', 'mejores', 'consejos', 'tips', 'disfrutar', 'visitar',
  ];
  return contieneFrases(fullText(input), frases);
}

function esCoberturaEventoPasado(input: NoticiaInput): boolean {
  const texto = fullText(input);
  const pasado = contieneFrases(texto, ['ocurrio', 'se realizo', 'celebro', 'reunio', 'finalizo', 'pasado', 'este domingo', 'este sabado', 'ayer']);
  const evento = contienePalabras(texto, ['tope de toros', 'fiesta', 'desfile', 'evento', 'celebracion', 'concierto', 'festival', 'carnaval']);
  return pasado && evento;
}

type ForensicBehavior = 'REQUERIDO' | 'OPCIONAL' | 'NO_APLICA';
type ForensicMode = 'actualidad' | 'politica_nacional' | 'economia' | 'salud' | 'turismo_guia' | 'turismo_cobertura' | 'gastronomia' | 'general';

function getForensicMode(profile: MeniContentProfile, input: NoticiaInput): ForensicMode {
  if (profile === 'gastronomia') return 'gastronomia';
  if (profile === 'turismo') {
    if (esGuiaTuristica(input)) return 'turismo_guia';
    if (esCoberturaEventoPasado(input)) return 'turismo_cobertura';
    const texto = fullText(input);
    const evento = contienePalabras(texto, ['festival', 'concierto', 'desfile', 'evento', 'celebracion', 'carnaval', 'tope de toros']);
    return evento ? 'turismo_cobertura' : 'turismo_guia';
  }
  if (profile === 'economia') return 'economia';
  if (profile === 'salud') return 'salud';
  // cultura, educacion, ambiente y astronomia se publican como Nacionales;
  // por tanto el análisis forense sigue las reglas de nacionales/política.
  if (
    profile === 'politica' || profile === 'nacionales' ||
    profile === 'cultura' || profile === 'educacion' ||
    profile === 'ambiente' || profile === 'astronomia'
  ) return 'politica_nacional';
  return 'actualidad';
}

function behaviorFor(
  tipo: EvidenciaTipo,
  mode: ForensicMode,
  input: NoticiaInput,
): ForensicBehavior {
  switch (tipo) {
    case 'atribucionPeriodistica':
      // Notas gastronómicas pueden construirse a partir de documentación
      // institucional, recetas, testimonios y curaduría; la atribución de
      // fuente directa es valiosa pero no obligatoria en cada párrafo.
      if (mode === 'gastronomia' || mode === 'general') return 'OPCIONAL';
      return 'REQUERIDO';
    case 'citaDirecta':
      if (mode === 'politica_nacional') return 'REQUERIDO';
      if (mode === 'gastronomia' || mode === 'turismo_guia' || mode === 'turismo_cobertura' || mode === 'economia' || mode === 'salud') return 'OPCIONAL';
      return 'NO_APLICA';
    case 'precios':
      if (mode === 'economia') return 'REQUERIDO';
      if (mode === 'gastronomia' || mode === 'turismo_guia') return 'OPCIONAL';
      return 'NO_APLICA';
    case 'costos':
      if (mode === 'economia') return 'REQUERIDO';
      if (mode === 'gastronomia' || mode === 'turismo_guia') return 'OPCIONAL';
      return 'NO_APLICA';
    case 'horarios':
      if (mode === 'turismo_guia') return 'REQUERIDO';
      if (mode === 'gastronomia') return 'OPCIONAL';
      return 'NO_APLICA';
    case 'ubicacion':
      if (mode === 'turismo_guia' || mode === 'turismo_cobertura') return 'REQUERIDO';
      if (mode === 'gastronomia') return 'OPCIONAL';
      return 'NO_APLICA';
    case 'comoLlegar':
      if (mode === 'turismo_guia') return 'REQUERIDO';
      if (mode === 'gastronomia') return 'OPCIONAL';
      return 'NO_APLICA';
    case 'condicionesVisita':
      if (mode === 'turismo_guia') return 'REQUERIDO';
      if (mode === 'gastronomia') return 'OPCIONAL';
      return 'NO_APLICA';
    case 'recomendaciones':
      if (mode === 'turismo_guia') return 'REQUERIDO';
      if (mode === 'gastronomia') return 'OPCIONAL';
      if (mode === 'salud' && contienePalabras(fullText(input), ['prevenir', 'evitar', 'cuidar', 'sintoma', 'prevencion'])) return 'OPCIONAL';
      return 'NO_APLICA';
    case 'telefonos':
      if (mode === 'turismo_guia') return 'REQUERIDO';
      if (mode === 'gastronomia') return 'OPCIONAL';
      return 'NO_APLICA';
    case 'direcciones':
      if (mode === 'turismo_guia') return 'REQUERIDO';
      if (mode === 'gastronomia') return 'OPCIONAL';
      return 'NO_APLICA';
    default:
      return 'NO_APLICA';
  }
}

function checkEvidencia(tipo: EvidenciaTipo, texto: string): boolean {
  switch (tipo) {
    case 'citaDirecta': return detectarCitaDirecta(texto);
    case 'atribucionPeriodistica': return detectarAtribucion(texto);
    case 'precios': return detectarPrecios(texto);
    case 'horarios': return detectarHorarios(texto);
    case 'costos': return detectarCostos(texto);
    case 'recomendaciones': return detectarRecomendaciones(texto);
    case 'telefonos': return detectarTelefonos(texto);
    case 'direcciones': return detectarDirecciones(texto);
    case 'condicionesVisita': return detectarCondicionesVisita(texto);
    case 'comoLlegar': return detectarComoLlegar(texto);
    case 'ubicacion': return detectarUbicacion(texto);
  }
}

const EVIDENCIA_LABELS: Record<EvidenciaTipo, string> = {
  citaDirecta: 'Cita textual de una fuente',
  atribucionPeriodistica: 'Atribución periodística de fuentes',
  precios: 'Precios o tarifas',
  horarios: 'Horarios de apertura o atención',
  costos: 'Costos o montos',
  recomendaciones: 'Recomendaciones orientadas al lector',
  telefonos: 'Datos de contacto telefónico',
  direcciones: 'Dirección o ubicación física',
  condicionesVisita: 'Condiciones o requisitos de visita',
  comoLlegar: 'Indicaciones de cómo llegar',
  ubicacion: 'Ubicación del lugar o evento',
};

export function detectAportePropioGastronomia(input: NoticiaInput): { tiene: boolean; items: string[] } {
  const texto = fullText(input);
  const items: string[] = [];

  const fuentesPrimarias = /\b(?:asale|real academia|academia real|academia nicarag[uü]ense|mined|iber\s*cocinas|unan-managua|unan managua|testimonio|entrevista|receta\s+original|tradición\s+familiar|voz\s+de\s+nicaragua)\b/i;
  if (fuentesPrimarias.test(texto)) items.push('fuentes primarias o curaduría documental');

  const comparacionVariantes = /\b(?:variante|version|ver[ií]sion|diferente\s+forma|diferente\s+manera|cada\s+familia|cada\s+region|en\s+managua|en\s+le[oó]n|en\s+granada|de\s+una\s+forma|de\s+otra\s+forma|una\s+prepara|otra\s+prepara|se\s+prepara)\b/i;
  if (comparacionVariantes.test(texto)) items.push('comparación o variación de recetas');

  const contextoHistorico = /\b(?:origen|historia|desde\s+hace|a[nñ]os?\s+de\s+tradici[oó]n|tradicional|herencia\s+cultural|patrimonio\s+gastron[oó]mico|cultura\s+alimentaria|identidad\s+nacional)\b/i;
  if (contextoHistorico.test(texto)) items.push('contexto histórico o cultural');

  const diferenciasRecetas = /\b(?:mientras\s+que|aunque|sin\s+embargo|pero|algunas?\s+agrega|otras?\s+agrega|diferencia\s+principal|lo\s+diferencia|lo\s+caracteriza|ingredientes?\s+distinto)\b/i;
  if (diferenciasRecetas.test(texto)) items.push('identificación de diferencias entre recetas');

  const explicacionSignificado = /\b(?:significa|representa|es\s+una?|se\s+convierte|más\s+que|significado\s+gastron[oó]mico|sentido\s+cultural|simbolo\s+de)\b/i;
  if (explicacionSignificado.test(texto)) items.push('explicación del significado gastronómico');

  // Si hay al menos 2 señales, se considera que la nota aporta algo propio
  // como curaduría cultural: no requiere reporteo de campo ni marca propia.
  const tiene = items.length >= 2 && /\b(?:receta|plato|comida|sabor|ingrediente|gastronom[ií]a|cocina|repocheta|gallo\s+pinto|nacatamal|quesillo|vigor[oó]n)\b/i.test(texto);

  return { tiene, items };
}

function buildForensicChecks(input: NoticiaInput, mode: ForensicMode): MeniForenseEvidencia[] {
  const texto = fullText(input);
  const tipos: EvidenciaTipo[] = [
    'citaDirecta', 'atribucionPeriodistica', 'precios', 'horarios', 'costos',
    'recomendaciones', 'telefonos', 'direcciones', 'condicionesVisita', 'comoLlegar', 'ubicacion',
  ];

  return tipos.map((tipo) => {
    const behavior = behaviorFor(tipo, mode, input);
    if (behavior === 'NO_APLICA') {
      return { tipo: EVIDENCIA_LABELS[tipo], estado: 'NO_APLICA', mensaje: `No aplica al perfil forense de esta noticia.` };
    }
    const presente = checkEvidencia(tipo, texto);
    if (presente) {
      return { tipo: EVIDENCIA_LABELS[tipo], estado: 'OK', mensaje: 'Evidencia presente en el texto.' };
    }
    if (behavior === 'OPCIONAL') {
      return { tipo: EVIDENCIA_LABELS[tipo], estado: 'NO_APLICA', mensaje: 'Elemento opcional para este perfil.' };
    }
    return { tipo: EVIDENCIA_LABELS[tipo], estado: 'FALTANTE', mensaje: `Se esperaba esta evidencia para el perfil "${mode}".` };
  });
}

function checksToRecomendaciones(checks: MeniForenseEvidencia[]): MeniRecomendacion[] {
  const out: MeniRecomendacion[] = [];
  for (const c of checks) {
    if (c.estado === 'FALTANTE') {
      out.push({
        area: 'forense',
        severidad: c.tipo.includes('Atribución') ? 'alta' : 'media',
        mensaje: `Evidencia faltante: ${c.tipo}. ${c.mensaje}`,
      });
    }
  }
  return out;
}

export function analyzeForensic(
  result: EvaluacionEditorial,
  input: NoticiaInput,
  resolvedProfile: MeniContentProfile,
): MeniForense {
  const forense = result.evidence.meni?.forense ?? result.evidence.forense;
  const score = result.forense.score ?? 0;

  let nivel: MeniForense['nivel'] = 'VERDE';
  if (forense.nivelRiesgo === 'Crítico' || forense.nivelRiesgo === 'Alto') nivel = 'ROJO';
  else if (forense.nivelRiesgo === 'Medio') nivel = 'AMARILLO';

  const mode = getForensicMode(resolvedProfile, input);
  const evidencias = buildForensicChecks(input, mode);
  const recomendaciones = checksToRecomendaciones(evidencias);

  return {
    score: Math.round(score),
    nivel,
    adjetivosEmocionales: forense.adjetivosEmocionales?.slice(0, 10) ?? [],
    riesgosLegales: forense.riesgosLegales?.slice(0, 6) ?? [],
    recomendaciones,
    evidencias,
  };
}
