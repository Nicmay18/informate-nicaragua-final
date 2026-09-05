/**
 * MENI vs Forense Judge (NIOS)
 *
 * Compara la evaluación forense de MENI con la evidencia extraída por el Extractor V4.
 * Objetivo: detectar discrepancias donde MENI declare "FALTANTE" algo que Forense sí ve,
 * o donde MENI declare "OK" algo que Forense no encuentra.
 *
 * Filosofía: evidence-first. No se reescribe el artículo, se investiga la discrepancia.
 */

import { extract } from '@/lib/editorial/extractor';
import { runMeni } from '@/lib/meni';
import type { NoticiaInput, MeniForense } from '@/lib/meni';
import type { ArticleEvidence } from '@/lib/editorial';
import type { NiosConflict } from './conflict-detector';

export interface MeniForenseConflict {
  slug: string;
  tipo: 'falso_negativo' | 'falso_positivo' | 'perfil_discrepancia';
  meniEstado: 'OK' | 'FALTANTE' | 'NO_APLICA';
  forenseEncontrado: boolean;
  detalle: string;
  evidencia: {
    tipoLabel: string;
    forenseSignal: string;
    extractSignal: string;
    sample?: string;
  };
}

export interface MeniForenseComparison {
  slug: string;
  titulo: string;
  perfil: string | null;
  forenseExtraida: {
    instituciones: number;
    cifras: number;
    citas: boolean;
    fuentePropia: boolean;
    aportePropio: boolean;
    adjetivosEmocionales: number;
  };
  meniForense: MeniForense;
  conflictos: MeniForenseConflict[];
  confianza: number; // 0-1
}

const EVIDENCE_CHECKERS: Record<string, (evidence: ArticleEvidence, input: NoticiaInput) => boolean> = {
  'Cita textual de una fuente': (e, input) =>
    e.eeat.tieneCitasEstructuradas ||
    e.valorEditorial.tieneCitaEspecifica ||
    e.forense.estructuraHtml.blockquote > 0 ||
    /<blockquote[^>]*>/i.test(input.contenido || ''),

  'Atribución periodística de fuentes': (e) =>
    e.eeat.tieneAtribuciones ||
    e.sources.numeroFuentes > 0 ||
    e.valorEditorial.tieneAtribucionVaga,

  'Precios o tarifas': (e, input) => {
    const hasNumbers = (e.meni?.datosConcretos.cifras ?? e.evidence.datosConcretos.cifras ?? 0) > 0;
    return hasNumbers && /\b(cordobas?|c\$|\$|usd|precio|costo|tarifa|entrada)\b/i.test(input.contenido || input.resumen || '');
  },

  'Costos o montos': (e, input) => {
    const hasNumbers = (e.meni?.datosConcretos.cifras ?? e.evidence.datosConcretos.cifras ?? 0) > 0;
    return hasNumbers && /\b(costo|gasto|inversion|presupuesto|monto)\b/i.test(input.contenido || input.resumen || '');
  },

  'Horarios de apertura o atención': (_, input) =>
    /\b(horario|de \d{1,2}:?\d{0,2}\s*a\s*\d{1,2}:?\d{0,2}|a las \d{1,2}|de \d{1,2}\s*a\s*\d{1,2})\b/i.test(input.contenido || ''),

  'Recomendaciones orientadas al lector': (e) => e.utility.tieneRecomendaciones,

  'Datos de contacto telefónico': (_, input) =>
    /\b\d{4}[-.\s]?\d{4}\b/.test(input.contenido || '') || /\b\d{7,}\b/.test(input.contenido || ''),

  'Dirección o ubicación física': (e, input) =>
    e.evidence.datosConcretos.lugares > 0 ||
    /\b(direccion|ubicado|ubicada|calle|avenida|carretera|km)\b/i.test(input.contenido || ''),

  'Condiciones o requisitos de visita': (_, input) =>
    /\b(condicion|requisito|reglamento|permiso|reservacion|reserva|cupos|capacidad)\b/i.test(input.contenido || ''),

  'Indicaciones de cómo llegar': (_, input) =>
    /\b(como llegar|llegar a|acceder|acceso|ruta|transporte)\b/i.test(input.contenido || ''),

  'Ubicación del lugar o evento': (e, input) =>
    e.evidence.datosConcretos.lugares > 0 ||
    /\b(ubicado en|ubicada en|situado en|situada en|se encuentra en|esta en|esta ubicad)\b/i.test(input.contenido || ''),
};

function extractForenseEvidence(evidence: ArticleEvidence): {
  instituciones: number;
  cifras: number;
  citas: boolean;
  fuentePropia: boolean;
  aportePropio: boolean;
  adjetivosEmocionales: number;
} {
  const datos = evidence.meni?.datosConcretos ?? evidence.evidence.datosConcretos;
  return {
    instituciones: evidence.valorEditorial.institucionesCount ?? 0,
    cifras: datos.cifras ?? 0,
    citas: evidence.eeat.tieneCitasEstructuradas || evidence.valorEditorial.tieneCitaEspecifica,
    fuentePropia: evidence.valorEditorial.tieneFuentePropia,
    aportePropio: evidence.originality.tieneAportePropio,
    adjetivosEmocionales: evidence.forense.adjetivosEmocionales.length,
  };
}

function forenseFound(label: string, evidence: ArticleEvidence, input: NoticiaInput): boolean {
  const checker = EVIDENCE_CHECKERS[label];
  if (checker) return checker(evidence, input);

  // Fallback para etiquetas no mapeadas: búsqueda literal normalizada del tipo.
  const text = `${input.titulo || ''} ${input.resumen || ''} ${input.contenido || ''}`.toLowerCase();
  const key = label.toLowerCase().replace(/\s+/g, ' ').trim();
  const keywords = key.split(' ').filter((w) => w.length > 3);
  return keywords.every((word) => text.includes(word));
}

export function compareMeniAndForense(input: NoticiaInput): MeniForenseComparison {
  const evidence = extract(input);
  const meni = runMeni(input);

  const conflictos: MeniForenseConflict[] = [];
  const totalChecked = meni.forense.evidencias.filter((e) => e.estado !== 'NO_APLICA').length || 1;

  for (const ev of meni.forense.evidencias) {
    if (ev.estado === 'NO_APLICA') continue;

    const found = forenseFound(ev.tipo, evidence, input);

    if (ev.estado === 'FALTANTE' && found) {
      conflictos.push({
        slug: input.slug,
        tipo: 'falso_negativo',
        meniEstado: ev.estado,
        forenseEncontrado: found,
        detalle: `MENI reporta "${ev.tipo}" como FALTANTE, pero Forense (Extractor V4) detecta la evidencia en el texto.`,
        evidencia: {
          tipoLabel: ev.tipo,
          forenseSignal: 'Evidencia detectada por Forense',
          extractSignal: found ? 'presente' : 'ausente',
          sample: (input.contenido || '').slice(0, 120) + '…',
        },
      });
    } else if (ev.estado === 'OK' && !found) {
      conflictos.push({
        slug: input.slug,
        tipo: 'falso_positivo',
        meniEstado: ev.estado,
        forenseEncontrado: found,
        detalle: `MENI reporta "${ev.tipo}" como OK, pero Forense no logró verificar la evidencia.`,
        evidencia: {
          tipoLabel: ev.tipo,
          forenseSignal: 'Evidencia no verificada por Forense',
          extractSignal: 'ausente',
          sample: (input.contenido || '').slice(0, 120) + '…',
        },
      });
    }
  }

  const confianza = Math.max(0, 1 - conflictos.length / totalChecked);

  return {
    slug: input.slug,
    titulo: input.titulo,
    perfil: meni.suggestedProfile || null,
    forenseExtraida: extractForenseEvidence(evidence),
    meniForense: meni.forense,
    conflictos,
    confianza,
  };
}

export function detectMeniForenseConflicts(
  noticias: NoticiaInput[],
  { maxArticles = 3, minConfianza = 1 } = {},
): NiosConflict[] {
  const conflicts: NiosConflict[] = [];
  const sample = noticias.slice(0, maxArticles);

  for (const input of sample) {
    if (!input.contenido) continue;

    try {
      const comparison = compareMeniAndForense(input);

      if (comparison.confianza < minConfianza && comparison.conflictos.length > 0) {
        const conflict = comparison.conflictos[0];
        conflicts.push({
          id: `meni-forense-${input.slug}-${Date.now()}`,
          severity: conflict.tipo === 'falso_negativo' ? 'warning' : 'info',
          category: 'meni-forense',
          status: 'MENI_FORENSE',
          sources: ['MENI', 'Forense'],
          title: `Discrepancia forense en "${input.titulo || input.slug}"`,
          description: `${conflict.detalle}. Confianza: ${(comparison.confianza * 100).toFixed(0)}%.`,
          evidence: {
            slug: input.slug,
            perfil: comparison.perfil,
            tipo: conflict.tipo,
            meniEstado: conflict.meniEstado,
            forenseEncontrado: conflict.forenseEncontrado,
            detalle: conflict.evidencia,
            confianza: comparison.confianza,
          },
          detectedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      conflicts.push({
        id: `meni-forense-error-${input.slug}-${Date.now()}`,
        severity: 'info',
        category: 'meni-forense',
        status: 'MENI_FORENSE',
        sources: ['MENI', 'Forense'],
        title: `No se pudo comparar MENI vs Forense para "${input.titulo || input.slug}"`,
        description: err instanceof Error ? err.message : String(err),
        evidence: { slug: input.slug, error: err instanceof Error ? err.message : String(err) },
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return conflicts;
}
