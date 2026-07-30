/**
 * MENI Quality Gate — Validator
 * =============================
 * Extrae entidades y detecta problemas de contradicción, cronología,
 * coherencia, terminología, precisión, lenguaje y sensacionalismo.
 */

import type { EntityMap, QualityGateIssue } from './types';
import { getPerfilEditorial } from '../editorial-profiles';
import {
  TERMINOLOGY_VARIANTS,
  FILLER_WORDS,
  SENSATIONALIST_PHRASES,
  UNSUPPORTED_CLAIM_PATTERNS,
  CHRONOLOGY_CONTRADICTION_PATTERNS,
} from './rules';

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const INSTITUCIONES_CONOCIDAS = [
  'policía nacional', 'ministerio de salud', 'minsa', 'ejército de nicaragua',
  'cruz roja', 'bomberos', 'alcaldía', 'ineter', 'mined', 'corte suprema',
  'asamblea nacional', 'sinapred', 'meter',
];

export function extractEntities(textoPlano: string): EntityMap {
  const texto = textoPlano;

  const edades = Array.from(texto.matchAll(/\b(\d{1,3})\s*años\b/gi)).map((m) => m[1]);
  const fechas = Array.from(
    texto.matchAll(/\b(\d{1,2}\s+de\s+[a-záéíóú]+(?:\s+del?\s+\d{4})?)\b/gi)
  ).map((m) => m[1]);
  const horas = Array.from(texto.matchAll(/\b(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)\b/g)).map((m) => m[1]);
  const cantidades = Array.from(texto.matchAll(/\b(\d+)\s*(personas|heridos|fallecidos|muertos|vehículos|víctimas)\b/gi)).map(
    (m) => `${m[1]} ${m[2]}`
  );
  const nombres = Array.from(
    texto.matchAll(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})\b/g)
  ).map((m) => m[1]);
  const institucionesEncontradas = INSTITUCIONES_CONOCIDAS.filter((i) =>
    texto.toLowerCase().includes(i)
  );
  const lugares = Array.from(
    texto.matchAll(/\b(?:en|de)\s+(Managua|León|Granada|Masaya|Chinandega|Estelí|Matagalpa|Rivas|Jinotega|Boaco|Carazo|Chontales|Madriz|Nueva Segovia|Río San Juan|Bluefields|RACCS|RACCN)\b/g)
  ).map((m) => m[1]);

  return {
    edades: [...new Set(edades)],
    fechas: [...new Set(fechas)],
    horas: [...new Set(horas)],
    cantidades: [...new Set(cantidades)],
    nombres: [...new Set(nombres)],
    instituciones: [...new Set(institucionesEncontradas)],
    lugares: [...new Set(lugares)],
  };
}

export function detectInternalContradictions(entidades: EntityMap): QualityGateIssue[] {
  const issues: QualityGateIssue[] = [];

  if (entidades.edades.length > 1) {
    issues.push({
      categoria: 'contradiccion',
      severidad: 'blocking',
      mensaje: `Se mencionan edades distintas para la misma persona: ${entidades.edades.join(' / ')}`,
      evidencia: entidades.edades.join(', '),
      corregible: false,
    });
  }

  if (entidades.horas.length > 2) {
    issues.push({
      categoria: 'contradiccion',
      severidad: 'warning',
      mensaje: `Se mencionan varias horas distintas, verificar consistencia: ${entidades.horas.join(' / ')}`,
      evidencia: entidades.horas.join(', '),
      corregible: false,
    });
  }

  return issues;
}

export function detectCrossContradictions(
  entidadesFuente: EntityMap,
  entidadesGeneradas: EntityMap
): QualityGateIssue[] {
  const issues: QualityGateIssue[] = [];

  if (
    entidadesFuente.edades.length === 1 &&
    entidadesGeneradas.edades.length === 1 &&
    entidadesFuente.edades[0] !== entidadesGeneradas.edades[0]
  ) {
    issues.push({
      categoria: 'contradiccion',
      severidad: 'blocking',
      mensaje: `La edad cambió respecto a la fuente: fuente=${entidadesFuente.edades[0]} años, generado=${entidadesGeneradas.edades[0]} años`,
      corregible: false,
    });
  }

  if (
    entidadesFuente.cantidades.length > 0 &&
    entidadesGeneradas.cantidades.length > 0 &&
    entidadesFuente.cantidades.join('|') !== entidadesGeneradas.cantidades.join('|')
  ) {
    const soloEnFuente = entidadesFuente.cantidades.filter((c) => !entidadesGeneradas.cantidades.includes(c));
    if (soloEnFuente.length > 0) {
      issues.push({
        categoria: 'contradiccion',
        severidad: 'warning',
        mensaje: `Cantidades mencionadas en la fuente no coinciden con el artículo generado: ${soloEnFuente.join(', ')}`,
        corregible: false,
      });
    }
  }

  return issues;
}

export function detectChronologyIssues(textoPlano: string): QualityGateIssue[] {
  const issues: QualityGateIssue[] = [];

  for (const pattern of CHRONOLOGY_CONTRADICTION_PATTERNS) {
    const match = pattern.exec(textoPlano);
    if (!match) continue;

    // El patrón de fechas captura días y meses.
    const dayDeath = match[1] ? parseInt(match[1], 10) : undefined;
    const monthDeath = match[2]?.toLowerCase();
    const dayTransfer = match[3] ? parseInt(match[3], 10) : undefined;
    const monthTransfer = match[4]?.toLowerCase();

    if (
      dayDeath !== undefined &&
      dayTransfer !== undefined &&
      monthDeath &&
      monthTransfer &&
      monthDeath === monthTransfer
    ) {
      if (dayTransfer > dayDeath) {
        issues.push({
          categoria: 'cronologia',
          severidad: 'blocking',
          mensaje: `Cronología imposible: se reporta el fallecimiento el ${dayDeath} de ${monthDeath} y la atención médica el ${dayTransfer} de ${monthTransfer}.`,
          corregible: false,
        });
        break;
      }
      // Si las fechas son compatibles o el traslado es anterior, no hay contradicción.
      continue;
    }

    // Contradicción con conector temporal pero sin fechas explícitas.
    issues.push({
      categoria: 'cronologia',
      severidad: 'blocking',
      mensaje: 'Cronología incoherente: se describe un desenlace mortal y luego una acción posterior con vida.',
      corregible: false,
    });
    break;
  }

  return issues;
}

export function detectDuplicateParagraphs(contenidoHtml: string): QualityGateIssue[] {
  const issues: QualityGateIssue[] = [];
  const parrafos = contenidoHtml
    .split(/<\/p>|\n{2,}/i)
    .map((p) => stripHtml(p).trim())
    .filter((p) => p.length > 30);

  const vistos = new Map<string, number>();
  for (const p of parrafos) {
    const key = p.toLowerCase().slice(0, 80);
    vistos.set(key, (vistos.get(key) || 0) + 1);
  }

  const duplicados = [...vistos.entries()].filter(([, count]) => count > 1);
  if (duplicados.length > 0) {
    issues.push({
      categoria: 'coherencia',
      severidad: 'warning',
      mensaje: `Se detectaron ${duplicados.length} párrafo(s) repetidos o muy similares.`,
      corregible: true,
    });
  }

  return issues;
}

export function detectTerminologyVariants(textoPlano: string): QualityGateIssue[] {
  const issues: QualityGateIssue[] = [];
  const lower = textoPlano.toLowerCase();

  for (const [canonico, variantes] of Object.entries(TERMINOLOGY_VARIANTS)) {
    const encontradas = variantes.filter((v) => lower.includes(v));
    const unicas = new Set(encontradas);
    if (unicas.size > 1) {
      issues.push({
        categoria: 'terminologia',
        severidad: 'warning',
        mensaje: `Se usan varias formas del mismo término (debería ser "${canonico}"): ${[...unicas].join(', ')}`,
        corregible: true,
      });
    }
  }

  return issues;
}

export function detectUnsupportedClaims(textoPlano: string): QualityGateIssue[] {
  const issues: QualityGateIssue[] = [];
  for (const pattern of UNSUPPORTED_CLAIM_PATTERNS) {
    const match = pattern.exec(textoPlano);
    if (match) {
      issues.push({
        categoria: 'precision',
        severidad: 'warning',
        mensaje: `Afirmación absoluta sin respaldo detectada: "${match[0]}"`,
        evidencia: match[0],
        corregible: true,
      });
    }
  }
  return issues;
}

export function detectFillerLanguage(textoPlano: string): QualityGateIssue[] {
  const issues: QualityGateIssue[] = [];
  const lower = textoPlano.toLowerCase();
  const encontradas = FILLER_WORDS.filter((w) => new RegExp(`\\b${w}\\b`, 'i').test(lower));
  if (encontradas.length > 0) {
    issues.push({
      categoria: 'lenguaje',
      severidad: 'info',
      mensaje: `Palabras de relleno detectadas: ${encontradas.join(', ')}`,
      corregible: true,
    });
  }
  return issues;
}

export function detectSensationalism(textoPlano: string): QualityGateIssue[] {
  const issues: QualityGateIssue[] = [];
  const lower = textoPlano.toLowerCase();
  const encontradas = SENSATIONALIST_PHRASES.filter((p) => lower.includes(p));
  if (encontradas.length > 0) {
    issues.push({
      categoria: 'sensacionalismo',
      severidad: 'blocking',
      mensaje: `Lenguaje sensacionalista detectado: ${encontradas.join(', ')}`,
      corregible: true,
    });
  }
  return issues;
}

export function detectServiceValue(categoria: string, textoPlano: string): QualityGateIssue[] {
  const issues: QualityGateIssue[] = [];
  const lower = textoPlano.toLowerCase();
  const perfil = getPerfilEditorial(categoria);

  // El servicio se evalúa con los patrones de la categoría detectada, nunca con plantilla universal
  const cumple = perfil.servicio.length > 0 && perfil.servicio.some((r) => r.test(lower));
  if (!cumple) {
    issues.push({
      categoria: 'servicio',
      severidad: perfil.bloqueaPorServicio ? 'blocking' : 'warning',
      mensaje: perfil.mensajeServicioFaltante,
      corregible: false,
    });
  }
  return issues;
}

export function detectDifferentialValue(porQueLeerAqui?: string): QualityGateIssue[] {
  const issues: QualityGateIssue[] = [];
  if (!porQueLeerAqui || porQueLeerAqui.trim().length < 10) {
    issues.push({
      categoria: 'valor_diferencial',
      severidad: 'blocking',
      mensaje: '¿Por qué alguien leería esta nota en Nicaragua Informate y no en TN8? — sin respuesta.',
      corregible: false,
    });
  }
  return issues;
}
