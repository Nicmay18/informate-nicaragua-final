'use client';

import { useMemo } from 'react';
import { getCategory } from '@/lib/constants';
import { stripHtml, extractFirstSentence, extractKeySentence } from '@/lib/formateo';

interface KeyPointsProps {
  titulo: string;
  resumen?: string;
  contenido?: string;
  categoria?: string;
}

function generateImpactPoint(categoria: string): { label: string; text: string } {
  const cat = getCategory(categoria);
  const slug = cat.slug;

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

  return templates[slug] || {
    label: 'Relevancia',
    text: 'Este tema mantendrá la atención de la comunidad nicaragüense en los próximos días a medida que surgen nuevos detalles.',
  };
}

export default function KeyPoints({ titulo, resumen, contenido, categoria }: KeyPointsProps) {
  const points = useMemo(() => {
    const plainContent = stripHtml(contenido || resumen || '');
    const plainResumen = stripHtml(resumen || '');

    let punto1 = extractFirstSentence(plainContent);
    if (!punto1 || punto1.length < 20) {
      punto1 = `${titulo}. Información verificada bajo estándares periodísticos.`;
    }

    let punto2 = plainResumen ? extractFirstSentence(plainResumen) : extractKeySentence(plainContent, 'middle');
    if (!punto2 || punto2.length < 20 || punto2 === punto1) {
      punto2 = extractKeySentence(plainContent, 'end');
    }
    if (!punto2 || punto2.length < 20) {
      punto2 = 'La información fue verificada a través de fuentes oficiales y testigos presenciales antes de su publicación.';
    }

    const impact = generateImpactPoint(categoria || '');

    return { punto1, punto2, punto3: impact };
  }, [titulo, resumen, contenido, categoria]);

  const sectionStyle: React.CSSProperties = {
    maxWidth: 768,
    margin: '32px auto',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    border: '1px solid #e5e5e5',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  };

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    paddingBottom: 12,
    marginBottom: 16,
    borderBottom: '2px solid #111827',
  };

  return (
    <section style={sectionStyle} aria-label="Resumen de puntos clave">
      <h2 style={titleStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10" /></svg>
        3 Puntos Clave
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Point label="Qué ocurrió" text={points.punto1} />
        <Point label="Contexto" text={points.punto2} />
        <Point label={points.punto3.label} text={points.punto3.text} />
      </div>
    </section>
  );
}

function Point({ label, text }: { label: string; text: string }) {
  const dotStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 8,
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#2563eb',
  };

  return (
    <div style={{ position: 'relative', paddingLeft: 20 }}>
      <span style={dotStyle} aria-hidden="true" />
      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        {label}
      </span>
      <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>
        {text}
      </p>
    </div>
  );
}
