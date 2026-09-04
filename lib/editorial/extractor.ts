/**
 * Extractor V4 — REGLA 1
 * ======================
 * Única lectura del artículo. Produce ArticleEvidence.
 * El Editor Jefe nunca vuelve a leer el HTML.
 */

import type { NoticiaInput } from './types';
import type {
  ArticleEvidence,
  TipoContenido,
  SeoEvidence,
  EeatEvidence,
  DiscoverEvidence,
  AdsenseEvidence,
  ValorEditorialEvidence,
  ForenseEvidence,
  ContextEvidence,
  ChronologyEvidence,
  UtilityEvidence,
  OriginalityEvidence,
  EvidenceSignals,
  FollowUpEvidence,
  SourceEvidence,
  RiskEvidence,
  MeniEvidence,
} from './types';
import { detectCategory } from './category-detector';

// Patrones reutilizables
const ADJETIVOS_EMOCIONALES = /\b(?:incre[ií]ble|impresionante|escalofriante|conmocionado|indignado|furibundo|escandaloso|brutal|terrible|horrendo|devastador|espectacular|maravilloso|fant[aá]stico|extraordinario|impactante|alarmante|preocupante|grave|urgente|cr[ií]tico|catastr[oó]fico)\b/gi;

const TRANSICIONES_IA = /\b(?:en resumen|en conclusi[oó]n|cabe destacar|vale la pena mencionar|es importante se[nñ]alar|hay que tener en cuenta|como es de esperarse|no obstante|por otro lado|por lo tanto|en definitiva|en t[eé]rminos generales)\b/gi;

const PALABRAS_SENSIBLES = /\b(?:violaci[oó]n|violada|tortura|genocidio)\b/gi;

const ATRIBUCIONES_FALSAS = /\b(?:seg[uú]n fuentes (?:an[oó]nimas|confidenciales|no identificadas)|se pudo conocer|trascendi[oó]|al parecer|presuntamente|aparentemente|de acuerdo con informaciones)\b/gi;

const NOMBRES_PROPIOS = /\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3}\b/g;

// Lista de instituciones nicaragüenses y multilaterales (sin duplicados genéricos).
const INSTITUCIONES_KNOWN = [
  'Policía Nacional', 'Policía', 'Fiscalía', 'Bomberos', 'Cruz Roja',
  'Medicina Legal', 'Hospital', 'Ministerio de Salud', 'MINSA', 'MINED', 'INETER',
  'SINAPRED', 'COMUPRED', 'Alcaldía', 'Asamblea Nacional', 'Banco Central',
  'ENATREL', 'ENACAL', 'Telecom', 'Tigo', 'Claro', 'UNAN', 'UCA', 'FAO',
  'OMS', 'OPS', 'UNESCO', 'UNICEF', 'ACNUR', 'OEA', 'FMI', 'BID', 'BCN',
  'MAG', 'MARENA', 'MTI', 'INTUR', 'MIFIC', 'MIGE', 'MEFCCA', 'MIFAMILIA',
  'INSS', 'IPSFA', 'INATEC', 'Procuraduría', 'Corte Suprema',
  'Consejo Supremo Electoral', 'Gobierno de Nicaragua', 'Gobierno',
  'Presidencia', 'Copresidencia', 'Poder Judicial', 'Ejército de Nicaragua',
  'Fuerza Naval', 'Distrito Naval', 'INVUR', 'INSS', 'IPSFA',
];
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const INSTITUCIONES = new RegExp('\\b(?:' + INSTITUCIONES_KNOWN.map(escape).join('|') + ')\\b', 'gi');

const FUENTES_OFICIALES_KNOWN = [
  'Policía Nacional', 'Policía', 'Fiscalía', 'Ministerio de Salud', 'MINSA',
  'Poder Judicial', 'Corte Suprema', 'Bomberos', 'Cruz Roja', 'Medicina Legal',
  'Hospital', 'MINED', 'INETER', 'SINAPRED', 'COMUPRED', 'Alcaldía',
  'Asamblea Nacional', 'Banco Central', 'ENATREL', 'ENACAL', 'FAO', 'OMS',
  'OPS', 'UNESCO', 'UNICEF', 'ACNUR', 'OEA', 'FMI', 'BID', 'BCN', 'MAG',
  'MARENA', 'MTI', 'INTUR', 'MIFIC', 'MIGE', 'MEFCCA', 'MIFAMILIA', 'INSS',
  'IPSFA', 'INATEC', 'Gobierno de Nicaragua', 'Gobierno', 'Presidencia',
  'Copresidencia', 'Ejército de Nicaragua', 'Fuerza Naval', 'Distrito Naval',
  'INVUR', 'Ministerio de Educación', 'Ministerio de Gobernación',
  'Ministerio de Obras Públicas', 'Ministerio de Transporte', 'Ministerio de Agricultura',
];
const FUENTES_OFICIALES = new RegExp('\\b(?:' + FUENTES_OFICIALES_KNOWN.map(escape).join('|') + ')\\b', 'gi');

const FECHAS_REGEX = /\b(?:\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|\d{4}|2025|2024)\b/gi;

const HORAS_REGEX = /\b(?:\d{1,2}:\d{2}(?:\s*(?:am|pm))?)\b/gi;

// Cifras: soporta separadores de miles, decimales y unidades/sustantivos de conteo.
const CIFRAS_UNIDADES = '(?:millones|mil|mill[oó]n|por ciento|%|c[oó]rdobas|d[oó]lares|USD|kg|g|mm|cm|km|metros|hect[aá]reas|manzanas|puntos)';
const CIFRAS_SUSTANTIVOS = '(?:estudiantes?|mochilas?|paquetes?|uniformes?|[uú]tiles?|centros?|escolares?|escuelas?|viviendas?|familias?|beneficiarios?|personas?|habitantes?|comunidades?|trabajadores?|empleos?|niñ[oa]s?|adultos?|mayores?|j[oó]venes?|c[oó]rdobas|d[oó]lares|USD)';
const CIFRAS_REGEX = new RegExp(
  '\\b(?:C?\\$[\\d.,]+|\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?)(?:(?:\\s*' + CIFRAS_UNIDADES + ')|(?:\\s+' + CIFRAS_SUSTANTIVOS + '))?\\b',
  'gi'
);

const LUGARES_REGEX = /\b(?:Managua|Le[oó]n|Granada|Masaya|Estel[ií]|Jinotega|Matagalpa|Chinandega|Tipitapa|Bluefields|Rivas|Carazo|Boaco|Chontales|Nueva Segovia|Madriz|R[ií]o San Juan|Costa Caribe(?:\s+(?:Norte|Sur))?|Barrio\s+\w+|Colonia\s+\w+|km\s+\d+)\b/gi;

const CLICKBAIT_PATTERNS = /\b(?:no creer[aá]s|te sorprender[aá]|incre[ií]ble pero|mira lo que|esto fue lo que|lo que nadie te dijo|secreto revelado|la verdad detr[aá]s|no vas a creer)\b/i;

/**
 * Normaliza un string de keywords separadas por coma.
 * Elimina elementos vacíos y espacios en blanco.
 */
export function normalizeKeywords(value?: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(k => String(k).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map(k => k.trim()).filter(Boolean);
  return [];
}

export function extract(noticia: NoticiaInput): ArticleEvidence {
  const contenidoStr = typeof noticia.contenido === 'string' ? noticia.contenido : String(noticia.contenido || '');
  const textoPlano = contenidoStr
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();

  const parrafos = textoPlano.split(/\n+/).map(p => p.trim()).filter(p => p.length > 20);
  const palabraCount = textoPlano.split(/\s+/).filter(Boolean).length;

  // ── SEO ──────────────────────────────────────
  const seo: SeoEvidence = {
    tituloLength: noticia.titulo.length,
    resumenLength: noticia.resumen?.length ?? 0,
    slug: noticia.slug,
    h2Count: (noticia.contenido.match(/<h2[^>]*>/gi) || []).length,
    strongCount: (noticia.contenido.match(/<strong[^>]*>/gi) || []).length,
    keywords: noticia.palabrasClave?.length
      ? noticia.palabrasClave
      : normalizeKeywords(noticia.keywords),
    tituloOptimizado: noticia.titulo.length >= 40 && noticia.titulo.length <= 70,
  };

  // ── EEAT ─────────────────────────────────────
  const fuentesDetectadas = Array.from(textoPlano.matchAll(FUENTES_OFICIALES)).map(m => m[0]);
  const uniqueFuentes = [...new Set(fuentesDetectadas.map(f => f.trim()))];
  const tieneAtribucionesFalsas = ATRIBUCIONES_FALSAS.test(textoPlano) && uniqueFuentes.length === 0;

  const eeat: EeatEvidence = {
    autor: noticia.autor,
    autorVisible: !!(noticia.autor && noticia.autor.length > 2 && noticia.autor !== 'Redacción'),
    fuentesDetectadas: uniqueFuentes,
    tieneAtribuciones: uniqueFuentes.length > 0,
    tieneAtribucionesFalsas,
    tieneCitasEstructuradas: /<blockquote[^>]*>/i.test(noticia.contenido),
  };

  // ── DISCOVER ─────────────────────────────────
  const discover: DiscoverEvidence = {
    tieneImagen: !!(noticia.imagen || noticia.imagenDestacada),
    tituloClickbait: CLICKBAIT_PATTERNS.test(noticia.titulo),
    tieneFechaActualizacion: !!noticia.fechaActualizacion,
    tieneFechaPublicacion: !!noticia.fecha,
  };

  // ── ADSENSE ──────────────────────────────────
  const palabrasSensiblesEncontradas = Array.from(textoPlano.matchAll(PALABRAS_SENSIBLES)).map(m => m[0]);
  const adsense: AdsenseEvidence = {
    palabraCount,
    tieneDatosConcretos:
      CIFRAS_REGEX.test(textoPlano) ||
      FECHAS_REGEX.test(textoPlano) ||
      NOMBRES_PROPIOS.test(textoPlano) ||
      LUGARES_REGEX.test(textoPlano),
    tieneClickbait: CLICKBAIT_PATTERNS.test(noticia.titulo) || CLICKBAIT_PATTERNS.test(textoPlano),
    ratioUnicidad: palabraCount > 0 ? Math.min(1, palabraCount / 300) : 0,
    palabrasSensibles: [...new Set(palabrasSensiblesEncontradas)],
  };

  // ── VALOR EDITORIAL ──────────────────────────
  const nombresPropios = Array.from(textoPlano.matchAll(NOMBRES_PROPIOS)).map(m => m[0]);
  const instituciones = Array.from(textoPlano.matchAll(INSTITUCIONES)).map(m => m[0]);
  const parrafosSinDato = parrafos.filter(p =>
    !CIFRAS_REGEX.test(p) &&
    !NOMBRES_PROPIOS.test(p) &&
    !INSTITUCIONES.test(p) &&
    !LUGARES_REGEX.test(p) &&
    !/\d/.test(p)
  );

  const tieneMarcaPropia = /Nicaragua\s+Informate|este\s+medio|nuestra\s+redacci[oó]n|este\s+portal|seg[uú]n\s+pudo\s+constatar/i.test(textoPlano);
  const tieneVerificacionPropia = /informaci[oó]n\s+verificada(?:\s+por\s+Nicaragua\s+Informate)?|confirmado\s+por\s+este\s+medio|en\s+el\s+lugar\s+del\s+hecho|equipo\s+de\s+Nicaragua\s+Informate|report[oó]\s+desde|verificaci[oó]n\s+propia|cobertura\s+propia|testigos\s+identificados|fotograf[íi]as\s+propias|datos\s+obtenidos\s+por\s+este\s+medio|verific[oó]|constat[oó]|consult[oó]/i.test(textoPlano);

  const valorEditorial: ValorEditorialEvidence = {
    tieneFuentePropia: tieneMarcaPropia || tieneVerificacionPropia || /Nicaragua\s+Informate|este\s+medio|nuestra\s+redacci[oó]n|este\s+portal|seg[uú]n\s+pudo\s+constatar/i.test(textoPlano) || ((textoPlano.match(LUGARES_REGEX) || []).length >= 3 && palabraCount >= 400 && uniqueFuentes.length >= 3) || (/\b(?:contexto|antecedentes|marco|m[aá]s\s+amplio|relaci[oó]n\s+entre|hilo\s+conductor|en\s+conjunto|panorama|perspectiva)\b/i.test(textoPlano) && /\b(?:recopilaci[oó]n|cobertura|resumen|s[ií]ntesis|recuento|d[ií]a\s+de|durante\s+el\s+d[ií]a|en\s+lo\s+que\s+va)\b/i.test(textoPlano)),
    tieneCitaEspecifica: /\b(?:seg[uú]n|indic[oó]|manifest[oó]|se[nñ]al[oó]|inform[oó]|dijo|afirm[oó]|anunció|confirm[oó]|explic[oó]|precis[oó]|destac[oó]|subray[oó]|agreg[oó]|expres[oó]|reiter[oó]|puntualiz[oó]|sostuvo|asegur[oó])\b/i.test(textoPlano),
    tieneAtribucionVaga: tieneAtribucionesFalsas,
    nombresPropiosCount: nombresPropios.length,
    institucionesCount: instituciones.length,
    parrafosSinDato: parrafosSinDato.length,
    parrafosTotal: parrafos.length,
    tieneDatosInventados: ATRIBUCIONES_FALSAS.test(textoPlano) && uniqueFuentes.length === 0,
    tieneFuentesAnonimas: /fuentes?\s+an[oó]nimas?|fuente\s+confidencial/i.test(textoPlano),
  };

  // ── FORENSE ──────────────────────────────────
  const adjetivosEmocionales = Array.from(textoPlano.matchAll(ADJETIVOS_EMOCIONALES)).map(m => m[0]);
  const transicionesIA = Array.from(textoPlano.matchAll(TRANSICIONES_IA)).map(m => m[0]);
  const riesgosLegales = Array.from(textoPlano.matchAll(PALABRAS_SENSIBLES)).map(m => m[0]);
  const tiposContaminacion: string[] = [];
  if (adjetivosEmocionales.length > 3) tiposContaminacion.push('exceso_adjetivos_emocionales');
  if (transicionesIA.length > 2) tiposContaminacion.push('transiciones_ia');
  if (contenidoStr.match(/<p[^>]*>\s*<\/p>/gi)) tiposContaminacion.push('parrafos_vacios');

  const nivelRiesgo = riesgosLegales.length > 5 ? 'Crítico' : riesgosLegales.length > 3 ? 'Alto' : riesgosLegales.length > 0 ? 'Medio' : 'Bajo';

  const forense: ForenseEvidence = {
    nivelRiesgo: nivelRiesgo as 'Bajo' | 'Medio' | 'Alto' | 'Crítico',
    adjetivosEmocionales: [...new Set(adjetivosEmocionales)],
    transicionesIA: [...new Set(transicionesIA)],
    tieneRedundancia: parrafos.length > 2 && parrafos.some((p, i) => i > 0 && p.slice(0, 30) === parrafos[i - 1].slice(0, 30)),
    estructuraHtml: {
      h2: (contenidoStr.match(/<h2[^>]*>/gi) || []).length,
      strong: (contenidoStr.match(/<strong[^>]*>/gi) || []).length,
      blockquote: (contenidoStr.match(/<blockquote[^>]*>/gi) || []).length,
    },
    riesgosLegales: [...new Set(riesgosLegales)],
    tiposContaminacion,
  };

  // ── CONTEXTO ─────────────────────────────────
  const context: ContextEvidence = {
    tipo: noticia.categoria,
    patronesEncontrados: [],
    contextoLegal: /\b(?:ley|decreto|tr[aá]mite|marco\s+jur[ií]dico|reglamento|legislaci[oó]n|normativa)\b/i.test(textoPlano),
    contextoHistorico: /\b(?:hist[oó]rico|anteriormente|en\s+el\s+paso|desde\s+hace|por\s+primera\s+vez|r[eé]cord)\b/i.test(textoPlano),
    contextoInstitucional: INSTITUCIONES.test(textoPlano),
  };

  // ── CRONOLOGIA ───────────────────────────────
  const fechasMencionadas = Array.from(textoPlano.matchAll(FECHAS_REGEX)).map(m => m[0]);
  const horasMencionadas = Array.from(textoPlano.matchAll(HORAS_REGEX)).map(m => m[0]);

  const chronology: ChronologyEvidence = {
    fechasMencionadas: [...new Set(fechasMencionadas)],
    horasMencionadas: [...new Set(horasMencionadas)],
    tieneCronologia: fechasMencionadas.length > 0 || horasMencionadas.length > 0,
  };

  // ── UTILIDAD ─────────────────────────────────
  const UTILITY_PATTERNS: Record<string, RegExp> = {
    'qué ocurrió':     /\b(?:ocurri[oó]|sucedi[oó]|incidente|ataque|disparo|bala|robo|hurto|accidente|incautaci[oó]n|decomis[oa]|incendio|colisi[oó]n|explosi[oó]n|pelea|altercado)\b/i,
    'dónde':           /\b(?:barrio|colonia|carretera|ruta|km\s+\d+|municipio|departamento|comunidad|zona|sector|calle|avenida|Managua|Le[oó]n|Granada|Estel[ií])\b/i,
    'cuándo':          /\b(?:\d{1,2}\s+de\s+\w+|\d{1,2}:\d{2}|madrugada|mañana|tarde|noche|horas?\s+de\s+la|s[aá]bado|domingo|lunes|martes|mi[eé]rcoles|jueves|viernes)\b/i,
    'estado actual':   /\b(?:investigaci[oó]n|pesquisas|b[uú]squeda|operativo|detenid[oa]|capturad[oa]|trasladad[oa]|hospital|recuperaci[oó]n|estable|grave|cr[ií]tico)\b/i,
    'seguimiento':     /\b(?:actualizaci[oó]n|pr[oó]ximas?\s+horas|se\s+espera|en\s+desarrollo|m[aá]s\s+informaci[oó]n|vigilancia|monitoreo|seguimiento)\b/i,
    'impacto':         /\b(?:herid[oa]s?|fallecid[oa]s?|afectad[oa]s?|damnificad[oa]s?|evacuad[oa]s?|v[ií]ctimas?|p[eé]rdidas?|da[nñ]os?)\b/i,
    'qué hacer':       /\b(?:recomienda|qu[eé]\s+hacer|c[oó]mo\s+actuar|pasos?\s+a\s+seguir|emergencia|128|118|primeros?\s+auxilios?)\b/i,
    'qué significa':   /\b(?:qu[eé]\s+significa|implica|consecuencia|impacto\s+en|afecta\s+a|importancia)\b/i,
    'qué cambia':      /\b(?:qu[eé]\s+cambia|nuevo|mejora|diferencia|anterior|versi[oó]n|upgrade)\b/i,
    'prevención':      /\b(?:prevenci[oó]n|recomendaciones?|medidas|consejos?|evitar|precauci[oó]n)\b/i,
    'especificaciones': /\b(?:\d+\s*(?:GB|MB|GHz|RAM|pulgadas|MP|nm)|procesador|c[aá]mara|pantalla|bater[ií]a)\b/i,
    'precio':          /\b(?:C?\$[\d.,]+|precio|costo|d[oó]lares)\b/i,
    'requisitos':      /\b(?:requisitos?|documentos?\s+necesarios?|se\s+requiere|debe\s+presentar)\b/i,
    'horario':         /\b(?:horario|hora\s+de\s+atenci[oó]n|de\s+\d+\s+a\s+\d+|lunes\s+a\s+viernes)\b/i,
    'contacto':        /\b(?:tel[eé]fono|contacto|whatsapp|correo|email|redes?\s+sociales?)\b/i,
    'costo':           /\b(?:C?\$[\d.,]+|gratuito|gratis|costo|tarifa|pago)\b/i,
    'fuente':          /\b(?:MINSa|ministerio\s+de\s+salud|hospital|OMS|OPS|m[eé]dic[oa]|epidemi[oó]log[oa])\b/i,
    'cifras':          /\b(?:\d+\s+(?:casos?|personas?|muertes?|dosis)|por\s+ciento|%)\b/i,
    'quién':           /\b(?:presidente|vicepresidente|ministro|diputad[oa]|gobierno|ministerio|autoridad|funcionario)\b/i,
    'posición':        /\b(?:a\s+favor|en\s+contra|apoyo|rechazo|alianza|oposici[oó]n)\b/i,
    'cronograma':      /\b(?:cronograma|calendario|fecha\s+de\s+inicio|etapa|fase|duraci[oó]n)\b/i,
    'compatibilidad':  /\b(?:compatible|soporta|incluye|conectividad|sistema\s+operativo)\b/i,
    'disponibilidad':  /\b(?:disponible|venta|preventa|stock|inventario|env[ií]o)\b/i,
  };
  const preguntasRespondidas = Object.entries(UTILITY_PATTERNS)
    .filter(([, regex]) => regex.test(textoPlano))
    .map(([key]) => key);

  const utility: UtilityEvidence = {
    preguntasRespondidas,
    tieneServicio: /\b(?:recomendaciones?|medidas|prevenci[oó]n|consejos?|gu[ií]a|pasos?\s+a\s+seguir)\b/i.test(textoPlano),
    tieneRecomendaciones: /\b(?:se\s+recomienda|recomendaciones?|deben?\s+(?:evitar|mantener|asegurar|buscar|acudir))\b/i.test(textoPlano),
    oportunidades: [],
  };

  // ── ORIGINALIDAD ─────────────────────────────
  // Calibración V4.1: originalidad no es solo exclusiva.
  // Seleccionar, organizar, contextualizar y relacionar hechos también es aporte editorial.

  // consolidado en tieneVerificacionPropia
  const tieneCoberturaEditorial = (textoPlano.match(LUGARES_REGEX) || []).length >= 2 && palabraCount >= 250 && uniqueFuentes.length >= 2;
  const tieneContextualizacion = /\b(?:contexto|antecedentes|marco|m[aá]s\s+amplio|relaci[oó]n\s+entre|hilo\s+conductor|en\s+conjunto|panorama|perspectiva)\b/i.test(textoPlano);
  const tieneOrganizacion = /\b(?:recopilaci[oó]n|cobertura|resumen|s[ií]ntesis|recuento|d[ií]a\s+de|durante\s+el\s+d[ií]a|en\s+lo\s+que\s+va)\b/i.test(textoPlano);

  const originality: OriginalityEvidence = {
    tieneAportePropio: tieneMarcaPropia || tieneVerificacionPropia || tieneCoberturaEditorial || (tieneContextualizacion && tieneOrganizacion),
    aportePropioItems: [
      ...(tieneMarcaPropia ? ['marca propia'] : []),
      ...(tieneVerificacionPropia ? ['verificación periodística propia'] : []),
      ...(tieneCoberturaEditorial ? ['cobertura editorial múltiple'] : []),
      ...(tieneContextualizacion ? ['contextualización'] : []),
      ...(tieneOrganizacion ? ['organización editorial'] : []),
    ],
    tieneReporteoPropio: tieneVerificacionPropia,
    esReformulacion: palabraCount < 100 && !uniqueFuentes.length,
  };

  // ── EVIDENCE SIGNALS ─────────────────────────
  const fechasCount = fechasMencionadas.length;
  const cifrasCount = (textoPlano.match(CIFRAS_REGEX) || []).length;
  const lugaresCount = (textoPlano.match(LUGARES_REGEX) || []).length;
  const nombresCount = nombresPropios.length;
  const densidadVerificable = palabraCount > 0 ? (fechasCount + cifrasCount + lugaresCount + nombresCount) / palabraCount * 100 : 0;

  const evidence: EvidenceSignals = {
    datosConcretos: { fechas: fechasCount, cifras: cifrasCount, lugares: lugaresCount, nombres: nombresCount },
    densidadVerificable: Math.round(densidadVerificable * 100) / 100,
    esNotaVerificable: fechasCount + cifrasCount + lugaresCount + nombresCount >= 3,
  };

  // ── MENI EVIDENCE ─────────────────────────────
  const meni: MeniEvidence = {
    forense,
    datosConcretos: { ...evidence.datosConcretos, instituciones: instituciones.length },
  };

  // ── FOLLOW UP ────────────────────────────────
  const followUp: FollowUpEvidence = {
    tieneSeguimiento: /\b(?:actualizaci[oó]n|pr[oó]ximas?\s+horas|se\s+espera|en\s+desarrollo|m[aá]s\s+informaci[oó]n|contin[uú]an|investigaciones?\s+(?:contin[uú]an|en\s+curso)|se\s+actualizar[aá]|actualizar[aá]\s+esta)\b/i.test(textoPlano),
    actualizable: /\b(?:pr[oó]ximo|pr[oó]xima|semana\s+que\s+viene|ma[nñ]ana|agosto|septiembre|octubre|cuando\s+las?\s+autoridades|nuevos?\s+datos)\b/i.test(textoPlano),
    pendienteConfirmacion: /\b(?:se\s+espera|pendiente|por\s+confirmar|resultados?\s+(?:preliminares|finales)|confirmen|establecer\s+las?\s+causas|responsabilidades?\s+adicionales?)\b/i.test(textoPlano),
  };

  // ── SOURCES ──────────────────────────────────
  const sourceEvidence: SourceEvidence = {
    fuentesIdentificadas: uniqueFuentes,
    numeroFuentes: uniqueFuentes.length,
    dosFuentesIndependientes: uniqueFuentes.length >= 2,
    documentoOficial: /\b(?:comunicado|parte\s+oficial|bolet[ií]n|informe\s+oficial|resoluci[oó]n|decreto)\b/i.test(textoPlano),
    trabajoCampo: /seg[uú]n\s+pudo\s+(?:constatar|verificar|confirmar)|testigos?|familiares?|vecinos?/i.test(textoPlano),
  };

  // ── RISK ─────────────────────────────────────
  const risk: RiskEvidence = {
    nivel: forense.nivelRiesgo,
    cierreGenerico: /\b(?:m[aá]s\s+informaci[oó]n\s+pr[oó]ximamente|continuar[aá]\s+informando)\b/i.test(textoPlano),
    atribucionesFalsas: tieneAtribucionesFalsas,
  };

  // ── CATEGORIA ────────────────────────────────
  const category = detectCategory(noticia, textoPlano);

  // ── TIPO DE CONTENIDO ────────────────────────
  // FLASH / NOTICIA / REPORTAJE / INVESTIGACION
  const tipoContenido: TipoContenido = (() => {
    if (palabraCount < 300) return 'FLASH';
    if (
      sourceEvidence.documentoOficial &&
      sourceEvidence.numeroFuentes >= 2 &&
      (sourceEvidence.trabajoCampo || originality.tieneReporteoPropio || originality.tieneAportePropio) &&
      palabraCount >= 700
    ) {
      return 'INVESTIGACION';
    }
    if (
      palabraCount >= 700 &&
      sourceEvidence.numeroFuentes >= 2 &&
      (sourceEvidence.trabajoCampo || originality.tieneAportePropio || sourceEvidence.documentoOficial)
    ) {
      return 'REPORTAJE';
    }
    return 'NOTICIA';
  })();

  return {
    seo,
    eeat,
    discover,
    adsense,
    valorEditorial,
    forense,
    context,
    chronology,
    utility,
    originality,
    evidence,
    followUp,
    sources: sourceEvidence,
    risk,
    category,
    tipoContenido,
    meni,
    noticia,
    textoPlano,
    parrafos,
  };
}
