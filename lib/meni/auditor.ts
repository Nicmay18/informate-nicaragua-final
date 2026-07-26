import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniAuditoria, MeniRecomendacion } from './types';

export function audit(result: EvaluacionEditorial): MeniAuditoria {
  return {
    originalidad: Math.round(result.valorEditorial.score ?? 0),
    redaccion: Math.round((result.seo.score + result.eeat.score + result.forense.score) / 3),
    utilidad: Math.round(result.valorEditorial.score ?? 0),
    experienciaLector: Math.round((result.discover.score + result.valorEditorial.score) / 2),
  };
}

export function buildRecomendaciones(result: EvaluacionEditorial): MeniRecomendacion[] {
  const out: MeniRecomendacion[] = [];
  const add = (area: string, msg: string, severidad: MeniRecomendacion['severidad']) => {
    if (msg) out.push({ area, mensaje: msg, severidad });
  };

  const { fechas = 0, cifras = 0, lugares = 0, nombres = 0 } = result.evidence.evidence.datosConcretos ?? {};
  if (fechas + cifras + lugares + nombres < 3) {
    add('Evidencia', 'Incluya más datos concretos (fechas, cifras, lugares, nombres propios).', 'alta');
  }
  if (!result.evidence.originality.tieneAportePropio) {
    add('Originalidad', 'Añada contexto o análisis propio que diferencie la nota.', 'media');
  }
  if (result.seo.score < 75) add('SEO', 'Optimice el título, slug y meta descripción.', 'media');
  if (result.forense.score < 80) add('Forense', 'Revise adjetivos emocionales o riesgos legales.', 'media');
  if (result.eeat.score < 80) add('EEAT', 'Mejore atribuciones y citas de fuentes.', 'media');
  if (result.adsense.score < 80) add('AdSense', 'Reduzca lenguaje sensible o sensacionalista.', 'alta');
  if (result.discover.score < 75) add('Discover', 'Use imagen destacada y evite títulos clickbait.', 'baja');

  result.explainability.slice(0, 6).forEach(item => {
    const sev: MeniRecomendacion['severidad'] = item.puntosPerdidos > 5 ? 'alta' : item.puntosPerdidos > 2 ? 'media' : 'baja';
    add(item.regla, item.solucion || item.motivo, sev);
  });

  return out.slice(0, 12);
}
