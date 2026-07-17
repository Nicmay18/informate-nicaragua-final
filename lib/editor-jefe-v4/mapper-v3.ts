/**
 * Mapper V4 → V3 — Convierte ResultadoEditorial a ResultadoAnalisis
 * Permite que el frontend existente consuma V4 sin reescribir el UI.
 */

import type { ResultadoEditorial } from './types';
import type { ResultadoAnalisis, FiltroResultado, CheckItem } from '../analizador-noticias';

const veredictoToNivel: Record<string, ResultadoAnalisis['nivel']> = {
  cobertura_especial: 'FORENSE',
  portada: 'ORO',
  publicar_destacado: 'ORO',
  publicar_estandar: 'PLATA',
  publicar_breve: 'BRONCE',
  no_publicar: 'RECHAZADO',
  EDITOR_INCONSISTENT: 'RECHAZADO',
};

function evalToFiltro(score: number, signals: string[], warnings: string[], errors: string[], nombreModulo: string): FiltroResultado {
  const checks: CheckItem[] = [];

  for (const signal of signals.slice(0, 3)) {
    checks.push({ nombre: nombreModulo, estado: 'PASS', mensaje: signal });
  }
  for (const warning of warnings.slice(0, 3)) {
    checks.push({ nombre: nombreModulo, estado: 'WARN', mensaje: warning });
  }
  for (const error of errors.slice(0, 3)) {
    checks.push({ nombre: nombreModulo, estado: 'FAIL', mensaje: error });
  }

  if (checks.length === 0) {
    checks.push({ nombre: nombreModulo, estado: score >= 60 ? 'PASS' : 'WARN', mensaje: `Score: ${score}/100` });
  }

  return {
    aprobado: score >= 60,
    puntuacion: score,
    checks,
  };
}

export function mapV4ToV3(v4: ResultadoEditorial): ResultadoAnalisis {
  const s = v4.scores;
  const r = v4.results;

  const nivel = veredictoToNivel[v4.veredicto] ?? 'BRONCE';
  const aprobado = !['no_publicar', 'RECHAZADO', 'EDITOR_INCONSISTENT'].includes(v4.veredicto);

  const accionesRequeridas: string[] = [];
  for (const item of v4.explainability) {
    if (item.puntosPerdidos > 0) {
      accionesRequeridas.push(`[${item.regla}] ${item.motivo} → ${item.solucion}`);
    }
  }
  for (const v of v4.consistencia.violaciones) {
    accionesRequeridas.push(`[CONSISTENCIA] ${v.descripcion}`);
  }

  const filtros = {
    oro: evalToFiltro(s.forense, r.forense.signals, r.forense.warnings, r.forense.errors, 'Forense'),
    adsense: evalToFiltro(s.adsense, r.adsense.signals, r.adsense.warnings, r.adsense.errors, 'AdSense'),
    discover: evalToFiltro(s.discover, r.discover.signals, r.discover.warnings, r.discover.errors, 'Discover'),
    news: evalToFiltro(s.eeat, r.eeat.signals, r.eeat.warnings, r.eeat.errors, 'EEAT'),
    seo: evalToFiltro(s.seo, r.seo.signals, r.seo.warnings, r.seo.errors, 'SEO'),
    eeat: evalToFiltro(s.eeat, r.eeat.signals, r.eeat.warnings, r.eeat.errors, 'EEAT'),
    valorEditorial: evalToFiltro(s.valorEditorial, r.valorEditorial.signals, r.valorEditorial.warnings, r.valorEditorial.errors, 'Valor Editorial'),
  };

  const metadataSugerida: ResultadoAnalisis['metadataSugerida'] = {};
  if (v4.evidence.seo.keywords.length > 0) {
    metadataSugerida.keywordsLSI = v4.evidence.seo.keywords.slice(0, 8);
  }
  if (v4.evidence.seo.tituloLength > 0 && v4.evidence.seo.tituloLength <= 60) {
    metadataSugerida.tituloOptimizado = v4.evidence.noticia.titulo;
  }
  if (v4.evidence.noticia.resumen) {
    metadataSugerida.metaDescription = v4.evidence.noticia.resumen.slice(0, 155);
  }

  return {
    aprobado,
    nivel,
    puntuacion: s.final,
    filtros,
    accionesRequeridas,
    metadataSugerida,
  };
}
