import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniForense, MeniRecomendacion, MeniForenseEvidencia } from './types';
import type { NoticiaInput } from './types';
import type { ContentProfileResult, MeniContentProfile } from './profile-detector';

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
  return /["«»“”‘’].{3,200}?["«»“”‘’]/.test(texto);
}

function detectarAtribucion(texto: string): boolean {
  const frases = [
    'segun', 'segun la', 'segun el', 'segun las', 'segun los',
    'de acuerdo con', 'de acuerdo a',
    'informo que', 'informaron que', 'confirmo que', 'confirmaron que',
    'indico que', 'indicaron que', 'declaro que', 'declararon que',
    'dijo que', 'dijeron que', 'afirmo que', 'afirmaron que',
    'explico que', 'explicaron que', 'anuncio que', 'anunciaron que',
  ];
  return contieneFrases(texto, frases);
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
type ForensicMode = 'actualidad' | 'politica_nacional' | 'economia' | 'salud' | 'turismo_guia' | 'turismo_cobertura' | 'general';

function getForensicMode(profile: MeniContentProfile, input: NoticiaInput): ForensicMode {
  if (profile === 'turismo' || profile === 'gastronomia') {
    if (esGuiaTuristica(input)) return 'turismo_guia';
    if (esCoberturaEventoPasado(input)) return 'turismo_cobertura';
    const texto = fullText(input);
    const evento = contienePalabras(texto, ['festival', 'concierto', 'desfile', 'evento', 'celebracion', 'carnaval', 'tope de toros']);
    return evento ? 'turismo_cobertura' : 'turismo_guia';
  }
  if (profile === 'economia') return 'economia';
  if (profile === 'salud') return 'salud';
  if (profile === 'politica' || profile === 'nacionales') return 'politica_nacional';
  return 'actualidad';
}

function behaviorFor(
  tipo: EvidenciaTipo,
  mode: ForensicMode,
  input: NoticiaInput,
): ForensicBehavior {
  switch (tipo) {
    case 'atribucionPeriodistica':
      return mode === 'general' ? 'OPCIONAL' : 'REQUERIDO';
    case 'citaDirecta':
      if (mode === 'politica_nacional') return 'REQUERIDO';
      if (mode === 'turismo_guia' || mode === 'turismo_cobertura' || mode === 'economia' || mode === 'salud') return 'OPCIONAL';
      return 'NO_APLICA';
    case 'precios':
      if (mode === 'economia' || mode === 'turismo_guia') return 'REQUERIDO';
      return 'NO_APLICA';
    case 'costos':
      if (mode === 'economia') return 'REQUERIDO';
      if (mode === 'turismo_guia') return 'OPCIONAL';
      return 'NO_APLICA';
    case 'horarios':
      return mode === 'turismo_guia' ? 'REQUERIDO' : 'NO_APLICA';
    case 'ubicacion':
      if (mode === 'turismo_guia' || mode === 'turismo_cobertura') return 'REQUERIDO';
      return 'NO_APLICA';
    case 'comoLlegar':
      return mode === 'turismo_guia' ? 'REQUERIDO' : 'NO_APLICA';
    case 'condicionesVisita':
      return mode === 'turismo_guia' ? 'REQUERIDO' : 'NO_APLICA';
    case 'recomendaciones':
      if (mode === 'turismo_guia') return 'REQUERIDO';
      if (mode === 'salud' && contienePalabras(fullText(input), ['prevenir', 'evitar', 'cuidar', 'sintoma', 'prevencion'])) return 'OPCIONAL';
      return 'NO_APLICA';
    case 'telefonos':
      return mode === 'turismo_guia' ? 'REQUERIDO' : 'NO_APLICA';
    case 'direcciones':
      return mode === 'turismo_guia' ? 'REQUERIDO' : 'NO_APLICA';
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
  contentProfile: ContentProfileResult,
): MeniForense {
  const forense = result.evidence.forense;
  const score = result.forense.score ?? 0;

  let nivel: MeniForense['nivel'] = 'VERDE';
  if (forense.nivelRiesgo === 'Crítico' || forense.nivelRiesgo === 'Alto') nivel = 'ROJO';
  else if (forense.nivelRiesgo === 'Medio') nivel = 'AMARILLO';

  const mode = getForensicMode(contentProfile.profile_detected, input);
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
