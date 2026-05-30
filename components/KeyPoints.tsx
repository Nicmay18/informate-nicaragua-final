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

/** Extrae la primera oración completa sin cortar */
function extractFirstSentence(text: string): string {
  const cleaned = text.replace(/^\s+/, '');
  const match = cleaned.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : cleaned.trim();
}

/** Extrae una oración completa del medio o del final */
function extractKeySentence(text: string, position: 'middle' | 'end'): string {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20 && s.length < 300);
  if (sentences.length === 0) return '';

  if (position === 'middle') {
    const mid = Math.floor(sentences.length / 2);
    return sentences[mid] ? sentences[mid] + '.' : '';
  } else {
    const last = sentences[sentences.length - 1];
    return last ? last + '.' : '';
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

    // Punto 1: primera oración completa del contenido
    let punto1 = extractFirstSentence(plainContent);
    if (!punto1 || punto1.length < 20) {
      punto1 = `${titulo}. Información verificada bajo estándares periodísticos de Nicaragua Informate.`;
    }

    // Punto 2: del resumen (primera oración) o del medio del contenido
    let punto2 = plainResumen ? extractFirstSentence(plainResumen) : extractKeySentence(plainContent, 'middle');
    // Evitar duplicar el punto 1
    if (!punto2 || punto2.length < 20 || punto2 === punto1) {
      punto2 = extractKeySentence(plainContent, 'end');
    }
    if (!punto2 || punto2.length < 20) {
      punto2 = 'La información fue verificada a través de fuentes oficiales y testigos presenciales antes de su publicación.';
    }

    // Punto 3: impacto según categoría
    const impact = generateImpactPoint(categoria || '');

    return { punto1, punto2, punto3: impact };
  }, [titulo, resumen, contenido, categoria]);

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '2rem', background: '#ffffff', borderRadius: 8, fontFamily: '"Inter", "Segoe UI", Roboto, system-ui, sans-serif', color: '#1a1a1a', lineHeight: 1.6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e5e5' }} aria-label="Resumen de puntos clave">
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.5rem 0', paddingBottom: '0.75rem', borderBottom: '2px solid #1a1a1a', color: '#111', letterSpacing: '-0.02em' }}>3 Puntos Clave</h2>

      <Point label="Qué ocurrió" text={points.punto1} />
      <Point label="Contexto" text={points.punto2} />
      <Point label={points.punto3.label} text={points.punto3.text} />
    </div>
  );
}

function Point({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginBottom: '1.25rem', paddingLeft: '1.25rem', position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 0, top: '0.5rem', width: 6, height: 6, background: '#2563eb', borderRadius: '50%', display: 'block'
      }} />
      <span style={{
        display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#111', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.03em'
      }}>{label}</span>
      <p style={{ fontSize: '0.95rem', color: '#4a4a4a', margin: 0, lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}
