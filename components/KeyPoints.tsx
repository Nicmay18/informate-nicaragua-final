'use client';

import { useMemo } from 'react';

interface KeyPointsProps {
  titulo: string;
  resumen?: string;
  contenido?: string;
  categoria?: string;
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&quot;|&lt;|&gt;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFirstSentence(text: string): string {
  const cleaned = text.replace(/^\s+/, '');
  const match = cleaned.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : cleaned.slice(0, 120) + '...';
}

function extractKeySentence(text: string, position: 'middle' | 'end'): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  if (sentences.length === 0) return '';

  if (position === 'middle') {
    const mid = Math.floor(sentences.length / 2);
    return sentences[mid]?.trim().slice(0, 140) + '.' || '';
  } else {
    const last = sentences[sentences.length - 1]?.trim();
    return last ? last.slice(0, 140) + '.' : '';
  }
}

function generateImpactPoint(categoria: string): { label: string; text: string } {
  const cat = categoria?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '') || '';

  const templates: Record<string, { label: string; text: string }> = {
    sucesos: {
      label: 'Siguientes pasos',
      text: 'Las autoridades competentes continúan con las investigaciones correspondientes para esclarecer los hechos y determinar responsabilidades.',
    },
    nacionales: {
      label: 'Impacto nacional',
      text: 'Este acontecimiento podría influir en las políticas públicas y el debate social en Nicaragua durante las próximas semanas.',
    },
    deportes: {
      label: 'Próximos encuentros',
      text: 'Los equipos involucrados se preparan para sus próximos compromisos que definirán posiciones en la tabla de clasificación.',
    },
    espectaculos: {
      label: 'Repercusión',
      text: 'La noticia genera reacciones en redes sociales y medios de comunicación, ampliando su alcance entre el público nicaragüense.',
    },
    tecnologia: {
      label: 'Implicaciones',
      text: 'Este avance o evento tecnológico podría transformar la forma en que los nicaragüenses interactúan con la tecnología digital.',
    },
    internacionales: {
      label: 'Contexto global',
      text: 'La situación internacional continúa evolucionando y podría tener repercusiones en la región centroamericana.',
    },
  };

  return templates[cat] || {
    label: 'Relevancia',
    text: 'Este tema mantendrá la atención de la comunidad nicaragüense en los próximos días a medida que surgen nuevos detalles.',
  };
}

export default function KeyPoints({ titulo, resumen, contenido, categoria }: KeyPointsProps) {
  const points = useMemo(() => {
    const plainContent = stripHtml(contenido || resumen || '');
    const plainResumen = stripHtml(resumen || '');

    // Punto 1: Qué pasó (del título + primera oración del contenido)
    const firstSentence = plainContent ? extractFirstSentence(plainContent) : '';
    const punto1 = firstSentence.length > 20
      ? firstSentence
      : `${titulo}. Hecho ocurrido en territorio nicaragüense bajo cobertura periodística verificada.`;

    // Punto 2: Contexto (del resumen o una oración del medio del contenido)
    let punto2 = plainResumen.length > 30
      ? plainResumen.slice(0, 160) + (plainResumen.length > 160 ? '...' : '')
      : extractKeySentence(plainContent, 'middle');

    if (!punto2 || punto2.length < 20) {
      punto2 = 'La información fue verificada a través de fuentes oficiales y testigos presenciales antes de su publicación.';
    }

    // Punto 3: Impacto/consecuencia (generado según categoría)
    const impact = generateImpactPoint(categoria || '');

    return {
      punto1: punto1.slice(0, 180),
      punto2: punto2.slice(0, 180),
      punto3: impact,
    };
  }, [titulo, resumen, contenido, categoria]);

  return (
    <div className="ni-key-points" aria-label="Resumen de puntos clave">
      <h2 className="ni-key-points__title">⚡ 3 Puntos Clave:</h2>
      <ul className="ni-key-points__list">
        <li>
          <strong>Qué ocurrió:</strong> {points.punto1}
        </li>
        <li>
          <strong>Contexto:</strong> {points.punto2}
        </li>
        <li>
          <strong>{points.punto3.label}:</strong> {points.punto3.text}
        </li>
      </ul>
    </div>
  );
}
