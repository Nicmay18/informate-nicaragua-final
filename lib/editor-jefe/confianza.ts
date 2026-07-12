/**
 * Matriz de Confianza Editorial y Benchmark de Medios
 * ===================================================
 * Capa de presentación que convierte las señales del motor V2 en una
 * lectura inmediata para el periodista: qué está sólido y qué está flojo.
 *
 * No modifica reglas del motor. Solo interpreta resultados.
 */

import type { NoticiaInput, ResultadoAnalisis, ReporteEditorJefe } from '../analizador-noticias';

export interface DimensionConfianza {
  nombre: string;
  score: number; // 0-100
  barra: string;
  justificacion: string;
}

export interface MatrizConfianza {
  confianzaEditorial: number;
  confianzaEditorialBarra: string;
  dimensiones: DimensionConfianza[];
}

export interface AccionBenchmark {
  medio: string;
  perfil: string;
  acciones: { accion: string; realizado: boolean }[];
}

export interface BenchmarkEditorial {
  tn8: AccionBenchmark;
  laPrensa: AccionBenchmark;
  nicaraguaInformate: AccionBenchmark;
}

const BARRA_ANCHO = 20;

export function barraConfianza(score: number, ancho = BARRA_ANCHO): string {
  const llenos = Math.max(0, Math.min(ancho, Math.round((score / 100) * ancho)));
  const vacios = ancho - llenos;
  return '█'.repeat(llenos) + '░'.repeat(vacios);
}

export function puntuacionAEstrellas(puntuacion: number, maximo = 100): string {
  const estrellas = Math.max(1, Math.min(5, Math.round((puntuacion / maximo) * 5)));
  return '★'.repeat(estrellas) + '☆'.repeat(5 - estrellas);
}

function scoreCriterio(vpr: ReporteEditorJefe, nombre: string): number {
  const c = vpr.criterios.find(x => x.nombre === nombre);
  if (!c) return 0;
  return Math.round((c.puntuacion / c.maximo) * 100);
}

function scoreEvidencia(vpr: ReporteEditorJefe, criterio: string): number {
  const e = vpr.nivelEvidencia.find(x => x.criterio === criterio);
  if (!e) return 0;
  return Math.round((e.puntaje / e.maximo) * 100);
}

export function calcularMatrizConfianza(_n: NoticiaInput, r: ResultadoAnalisis): MatrizConfianza {
  const vpr = r.reporteVPR;
  if (!vpr) {
    return {
      confianzaEditorial: 0,
      confianzaEditorialBarra: barraConfianza(0),
      dimensiones: [],
    };
  }

  // Fuentes: fuente identificada + dos fuentes independientes
  const fuente = scoreEvidencia(vpr, 'Fuente oficial identificada');
  const dosFuentes = scoreEvidencia(vpr, 'Dos o más fuentes independientes');
  const fuentesScore = Math.round((fuente * 0.6) + (dosFuentes * 0.4));

  // Verificación: documento oficial + trabajo de campo verificable
  const documento = scoreEvidencia(vpr, 'Documento oficial identificado');
  const campo = scoreEvidencia(vpr, 'Trabajo de campo verificable');
  const verificacionScore = Math.round((documento * 0.5) + (campo * 0.5));

  // Originalidad: criterio editorial propio
  const originalidadScore = scoreCriterio(vpr, 'Originalidad');

  // Utilidad: criterio de utilidad para el lector
  const utilidadScore = scoreCriterio(vpr, 'Utilidad');

  // Riesgo legal: inverso al riesgo detectado
  const riesgoNivel = vpr.riesgoLegal?.nivel?.toLowerCase() || 'bajo';
  const riesgoScore = riesgoNivel.includes('alto') ? 40 : riesgoNivel.includes('medio') ? 75 : 100;

  const dimensiones: DimensionConfianza[] = [
    {
      nombre: 'Fuentes',
      score: fuentesScore,
      barra: barraConfianza(fuentesScore),
      justificacion: fuentesScore >= 80
        ? 'Fuente oficial o medio identificado y contrastada.'
        : fuentesScore >= 50
          ? 'Se identifica al menos una fuente, pero falta contraste.'
          : 'No se identifica fuente oficial ni contraste claro.',
    },
    {
      nombre: 'Verificación',
      score: verificacionScore,
      barra: barraConfianza(verificacionScore),
      justificacion: verificacionScore >= 80
        ? 'Documento o evidencia verificable presente.'
        : verificacionScore >= 50
          ? 'Hay señales de verificación, pero no sólidas.'
          : 'Sin documento ni evidencia de trabajo de campo verificable.',
    },
    {
      nombre: 'Originalidad',
      score: originalidadScore,
      barra: barraConfianza(originalidadScore),
      justificacion: originalidadScore >= 80
        ? 'Aporte editorial propio o verificación del medio detectada.'
        : 'La nota se basa en información pública sin aporte exclusivo.',
    },
    {
      nombre: 'Utilidad',
      score: utilidadScore,
      barra: barraConfianza(utilidadScore),
      justificacion: utilidadScore >= 80
        ? 'La nota entrega utilidad práctica al lector.'
        : 'La utilidad para el lector es limitada; conviene agregar contexto o recomendación.',
    },
    {
      nombre: 'Riesgo legal',
      score: riesgoScore,
      barra: barraConfianza(riesgoScore),
      justificacion: riesgoScore >= 90
        ? 'Sin riesgos legales evidentes.'
        : 'Riesgo legal detectado; revisar contenido sensible.',
    },
  ];

  const confianzaEditorial = Math.round(dimensiones.reduce((s, d) => s + d.score, 0) / dimensiones.length);

  return {
    confianzaEditorial,
    confianzaEditorialBarra: barraConfianza(confianzaEditorial),
    dimensiones,
  };
}

export function generarBenchmark(_n: NoticiaInput, r: ResultadoAnalisis): BenchmarkEditorial {
  const vpr = r.reporteVPR;
  const tieneServicio = !!vpr?.nivel10_oportunidades?.length || vpr?.categoriaFacebook === 'Utilidad' || vpr?.compartibleSiNo === 'Sí';
  const tieneContexto = (vpr?.nivelEvidencia?.find(e => e.criterio === 'Contexto legal / institucional')?.puntaje || 0) >= 2;
  const contrastaFuentes = (vpr?.nivelEvidencia?.find(e => e.criterio === 'Dos o más fuentes independientes')?.puntaje || 0) >= 2;
  const datosConcretos = (vpr?.nivelEvidencia?.find(e => e.criterio === 'Datos concretos')?.puntaje || 0) >= 2;

  return {
    tn8: {
      medio: 'TN8',
      perfil: 'Televisión: cobertura inmediata, titular en vivo, actualización rápida.',
      acciones: [
        { accion: 'Cobertura inmediata', realizado: true },
        { accion: 'Titular en vivo / breaking', realizado: datosConcretos },
        { accion: 'Actualización rápida', realizado: true },
      ],
    },
    laPrensa: {
      medio: 'La Prensa',
      perfil: 'Prensa escrita: profundidad, contexto, antecedentes y documentos oficiales.',
      acciones: [
        { accion: 'Buscar antecedentes', realizado: tieneContexto },
        { accion: 'Contrastar fuentes', realizado: contrastaFuentes },
        { accion: 'Solicitar documento oficial', realizado: (vpr?.nivelEvidencia?.find(e => e.criterio === 'Documento oficial identificado')?.puntaje || 0) >= 2 },
      ],
    },
    nicaraguaInformate: {
      medio: 'Nicaragua Informate',
      perfil: 'Medio digital: servicio, contexto, verificación y utilidad para el lector.',
      acciones: [
        { accion: 'Agregó servicio', realizado: tieneServicio },
        { accion: 'Agregó contexto', realizado: tieneContexto },
        { accion: 'Contrastó fuentes', realizado: contrastaFuentes },
        { accion: 'Agregó utilidad', realizado: tieneServicio || (vpr?.categoriaFacebook === 'Utilidad') },
      ],
    },
  };
}

export interface ConfianzaEstructurada {
  global: number;
  fuentes: number;
  verificacion: number;
  originalidad: number;
  utilidad: number;
  riesgoLegal: number;
  documentoOficial: boolean;
  tituloGenerico: boolean;
}

export function calcularConfianzaEstructurada(_n: NoticiaInput, r: ResultadoAnalisis): ConfianzaEstructurada {
  const m = calcularMatrizConfianza(_n, r);
  const vpr = r.reporteVPR;
  const doc = vpr?.nivelEvidencia?.find(e => e.criterio === 'Documento oficial identificado');
  const documentoOficial = (doc?.puntaje || 0) >= 2;
  const tituloGenerico = detectarTituloGenerico(_n.titulo);

  const porNombre = (nombre: string) => m.dimensiones.find(d => d.nombre === nombre)?.score ?? 0;

  return {
    global: m.confianzaEditorial,
    fuentes: porNombre('Fuentes'),
    verificacion: porNombre('Verificación'),
    originalidad: porNombre('Originalidad'),
    utilidad: porNombre('Utilidad'),
    riesgoLegal: porNombre('Riesgo legal'),
    documentoOficial,
    tituloGenerico,
  };
}

function detectarTituloGenerico(titulo: string): boolean {
  const t = titulo.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const palabras = t.split(/\s+/).filter(p => p.length > 0);
  // Titular genérico: corto, sin datos concretos (números, fechas, nombres propios, lugares)
  const tieneDatoConcreto = /\b\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b|\b\d{4}\b|\b\d+\s+(?:fallecidos|heridos|afectados|personas|victimas|años|meses|km|kilometros?)\b|C?\$\s*\d+|managua|leon|granada|esteli|chinandega|masaya|carazo|rivas|jinotega|matagalpa|boaco|nueva segovia|madriz|rio san juan|norte|sur|caribe|pacífico/i.test(t);
  return palabras.length <= 8 && !tieneDatoConcreto;
}

export interface BenchmarkEstructurado {
  tn8: { coberturaInmediata: boolean; titularEnVivo: boolean; actualizacionRapida: boolean };
  laPrensa: { antecedentes: boolean; contrastarFuentes: boolean; documentoOficial: boolean };
  nicaraguaInformate: { servicio: boolean; contexto: boolean; contrastarFuentes: boolean; utilidad: boolean };
}

export function generarBenchmarkEstructurado(n: NoticiaInput, r: ResultadoAnalisis): BenchmarkEstructurado {
  const b = generarBenchmark(n, r);
  const bool = (medio: keyof BenchmarkEditorial, accion: string) =>
    b[medio].acciones.find(a => a.accion.toLowerCase().includes(accion.toLowerCase()))?.realizado ?? false;

  return {
    tn8: {
      coberturaInmediata: bool('tn8', 'Cobertura inmediata'),
      titularEnVivo: bool('tn8', 'Titular en vivo'),
      actualizacionRapida: bool('tn8', 'Actualización rápida'),
    },
    laPrensa: {
      antecedentes: bool('laPrensa', 'antecedentes'),
      contrastarFuentes: bool('laPrensa', 'Contrastar fuentes'),
      documentoOficial: bool('laPrensa', 'documento oficial'),
    },
    nicaraguaInformate: {
      servicio: bool('nicaraguaInformate', 'Agregó servicio'),
      contexto: bool('nicaraguaInformate', 'Agregó contexto'),
      contrastarFuentes: bool('nicaraguaInformate', 'Contrastó fuentes'),
      utilidad: bool('nicaraguaInformate', 'Agregó utilidad'),
    },
  };
}

export function formatearMatrizConfianza(m: MatrizConfianza, titulo: string): string {
  const lineas: string[] = [];
  lineas.push(`## Matriz de Confianza: ${titulo}`);
  lineas.push('');
  lineas.push(`${m.confianzaEditorialBarra} ${m.confianzaEditorial}%`);
  lineas.push('**Confianza Editorial**');
  lineas.push('');
  for (const d of m.dimensiones) {
    lineas.push(`${d.barra} ${d.score}%`);
    lineas.push(`**${d.nombre}**`);
    lineas.push(`${d.justificacion}`);
    lineas.push('');
  }
  return lineas.join('\n');
}

export function formatearBenchmark(b: BenchmarkEditorial): string {
  const lineas: string[] = [];
  lineas.push('## Benchmark Editorial');
  lineas.push('');
  for (const [, medio] of Object.entries(b)) {
    lineas.push(`### ¿Qué haría ${medio.medio}?`);
    lineas.push(`_${medio.perfil}_`);
    for (const a of medio.acciones) {
      lineas.push(`- ${a.realizado ? '✔' : '✘'} ${a.accion}`);
    }
    lineas.push('');
  }
  return lineas.join('\n');
}
