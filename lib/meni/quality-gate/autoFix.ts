/**
 * MENI Quality Gate — Auto Fix
 * ============================
 * Intenta corregir automáticamente antes de bloquear.
 */

import type { QualityGateCorrection, QualityGateIssue } from './types';
import { TERMINOLOGY_VARIANTS, FILLER_WORDS, SENSATIONALIST_PHRASES } from './rules';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unifyTerminology(html: string): { texto: string; corrections: QualityGateCorrection[] } {
  let texto = html;
  const corrections: QualityGateCorrection[] = [];

  for (const [canonico, variantes] of Object.entries(TERMINOLOGY_VARIANTS)) {
    const ordenadas = [...variantes].sort((a, b) => b.length - a.length);
    for (const variante of ordenadas) {
      const regex = new RegExp(escapeRegex(variante), 'gi');
      if (regex.test(texto)) {
        texto = texto.replace(regex, canonico);
        corrections.push({
          categoria: 'terminologia',
          descripcion: `Unificado "${variante}" → "${canonico}"`,
          antes: variante,
          despues: canonico,
        });
      }
    }
  }

  return { texto, corrections };
}

function removeFillerWords(html: string): { texto: string; corrections: QualityGateCorrection[] } {
  let texto = html;
  const corrections: QualityGateCorrection[] = [];

  for (const palabra of FILLER_WORDS) {
    const regex = new RegExp(`\\s?\\b${escapeRegex(palabra)}\\b`, 'gi');
    if (regex.test(texto)) {
      texto = texto.replace(regex, '');
      corrections.push({
        categoria: 'lenguaje',
        descripcion: `Palabra de relleno eliminada: "${palabra}"`,
      });
    }
  }

  return { texto, corrections };
}

function removeSensationalism(html: string): { texto: string; corrections: QualityGateCorrection[] } {
  let texto = html;
  const corrections: QualityGateCorrection[] = [];

  for (const frase of SENSATIONALIST_PHRASES) {
    const regex = new RegExp(escapeRegex(frase), 'gi');
    if (regex.test(texto)) {
      texto = texto.replace(regex, 'incidente reportado');
      corrections.push({
        categoria: 'sensacionalismo',
        descripcion: `Frase sensacionalista neutralizada: "${frase}"`,
      });
    }
  }

  return { texto, corrections };
}

function dedupeParagraphs(html: string): { texto: string; corrections: QualityGateCorrection[] } {
  const corrections: QualityGateCorrection[] = [];
  const partes = html.split(/(<\/p>)/i);
  const vistos = new Set<string>();
  const resultado: string[] = [];
  let buffer = '';

  for (const parte of partes) {
    buffer += parte;
    if (/<\/p>/i.test(parte)) {
      const key = buffer.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 80);
      if (key.length > 20 && vistos.has(key)) {
        corrections.push({
          categoria: 'coherencia',
          descripcion: 'Párrafo duplicado eliminado.',
        });
      } else {
        if (key.length > 20) vistos.add(key);
        resultado.push(buffer);
      }
      buffer = '';
    }
  }
  resultado.push(buffer);

  return { texto: resultado.join(''), corrections };
}

function cleanWhitespaceAndCasing(html: string): { texto: string; corrections: QualityGateCorrection[] } {
  const corrections: QualityGateCorrection[] = [];
  let texto = html;

  const sinDobleEspacio = texto.replace(/[ \t]{2,}/g, ' ');
  if (sinDobleEspacio !== texto) {
    corrections.push({ categoria: 'lenguaje', descripcion: 'Espacios dobles normalizados.' });
    texto = sinDobleEspacio;
  }

  const sinEspacioAntesPuntuacion = texto.replace(/\s+([.,;:!?])/g, '$1');
  if (sinEspacioAntesPuntuacion !== texto) {
    corrections.push({ categoria: 'lenguaje', descripcion: 'Espacios antes de puntuación corregidos.' });
    texto = sinEspacioAntesPuntuacion;
  }

  return { texto, corrections };
}

export function applyAutoFix(
  html: string,
  issues: QualityGateIssue[]
): { textoCorregido: string; corregidos: QualityGateCorrection[] } {
  let texto = html;
  const corregidos: QualityGateCorrection[] = [];

  const categoriasCorregibles = new Set(issues.filter((i) => i.corregible).map((i) => i.categoria));

  if (categoriasCorregibles.has('terminologia')) {
    const r = unifyTerminology(texto);
    texto = r.texto;
    corregidos.push(...r.corrections);
  }

  if (categoriasCorregibles.has('sensacionalismo')) {
    const r = removeSensationalism(texto);
    texto = r.texto;
    corregidos.push(...r.corrections);
  }

  if (categoriasCorregibles.has('lenguaje')) {
    const r = removeFillerWords(texto);
    texto = r.texto;
    corregidos.push(...r.corrections);
  }

  if (categoriasCorregibles.has('coherencia')) {
    const r = dedupeParagraphs(texto);
    texto = r.texto;
    corregidos.push(...r.corrections);
  }

  const limpieza = cleanWhitespaceAndCasing(texto);
  texto = limpieza.texto;
  corregidos.push(...limpieza.corrections);

  return { textoCorregido: texto, corregidos };
}
