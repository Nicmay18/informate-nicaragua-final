import type { EvaluacionEditorial, ResultadoAnalisis, FiltroResultado, CheckItem, ModuleScore } from './types';

const veredictoToNivel: Record<string, ResultadoAnalisis['nivel']> = {
  cobertura_especial: 'FORENSE',
  portada: 'ORO',
  publicar_destacado: 'ORO',
  publicar_estandar: 'PLATA',
  publicar_breve: 'BRONCE',
  no_publicar: 'RECHAZADO',
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

function filtrosFromScore(m: ModuleScore, nombre: string): FiltroResultado {
  return evalToFiltro(m.score, m.signals, m.warnings, m.errors, nombre);
}

export function mapV4ToV3(v4: EvaluacionEditorial): ResultadoAnalisis {
  const nivel = veredictoToNivel[v4.veredicto] ?? 'BRONCE';
  const aprobado = v4.veredicto !== 'no_publicar';

  const accionesRequeridas: string[] = [];
  for (const item of v4.explainability) {
    if (item.puntosPerdidos > 0) {
      accionesRequeridas.push(`[${item.regla}] ${item.motivo} → ${item.solucion}`);
    }
  }

  const filtros = {
    oro: filtrosFromScore(v4.forense, 'Forense'),
    adsense: filtrosFromScore(v4.adsense, 'AdSense'),
    discover: filtrosFromScore(v4.discover, 'Discover'),
    news: filtrosFromScore(v4.eeat, 'EEAT'),
    seo: filtrosFromScore(v4.seo, 'SEO'),
    eeat: filtrosFromScore(v4.eeat, 'EEAT'),
    valorEditorial: filtrosFromScore(v4.valorEditorial, 'Valor Editorial'),
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
    puntuacion: v4.scoreFinal,
    filtros,
    accionesRequeridas,
    metadataSugerida,
  };
}
