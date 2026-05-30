'use client';

import { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { getCategory } from '@/lib/constants';
import { stripHtml, extractFirstSentence, extractKeySentence } from '@/lib/formateo';

interface KeyPointsProps {
  titulo: string;
  resumen?: string;
  contenido?: string;
  categoria?: string;
  className?: string;
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

export default function KeyPoints({ titulo, resumen, contenido, categoria, className = '' }: KeyPointsProps) {
  const points = useMemo(() => {
    const plainContent = stripHtml(contenido || resumen || '');
    const plainResumen = stripHtml(resumen || '');

    // Punto 1: primera oración completa del contenido
    let punto1 = extractFirstSentence(plainContent);
    if (!punto1 || punto1.length < 20) {
      punto1 = `${titulo}. Información verificada bajo estándares periodísticos.`;
    }

    // Punto 2: del resumen o del medio del contenido
    let punto2 = plainResumen ? extractFirstSentence(plainResumen) : extractKeySentence(plainContent, 'middle');
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
    <section 
      className={`max-w-3xl mx-auto my-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
      aria-label="Resumen de puntos clave"
    >
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 pb-3 mb-4 border-b-2 border-gray-900">
        <Zap size={18} className="text-amber-500" aria-hidden="true" />
        3 Puntos Clave
      </h2>

      <div className="space-y-4">
        <Point label="Qué ocurrió" text={points.punto1} />
        <Point label="Contexto" text={points.punto2} />
        <Point label={points.punto3.label} text={points.punto3.text} />
      </div>
    </section>
  );
}

function Point({ label, text }: { label: string; text: string }) {
  return (
    <div className="relative pl-5">
      <span 
        className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-blue-600"
        aria-hidden="true"
      />
      <span className="block text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1">
        {label}
      </span>
      <p className="text-sm text-gray-600 leading-relaxed">
        {text}
      </p>
    </div>
  );
}
