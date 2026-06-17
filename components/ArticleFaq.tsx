'use client';

import { useMemo } from 'react';

interface Props {
  contenidoHtml: string;
  resumen: string;
}

export default function ArticleFaq({ contenidoHtml, resumen }: Props) {
  const faqs = useMemo(() => {
    if (!contenidoHtml) return [];
    const textoPlano = contenidoHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    // Buscar preguntas en el contenido
    const preguntasEncontradas = textoPlano.match(/¿[^?]+\?/g);
    if (!preguntasEncontradas || preguntasEncontradas.length === 0) return [];
    return preguntasEncontradas.slice(0, 3).map((pregunta, i) => ({
      pregunta: pregunta.trim(),
      respuesta: resumen?.trim() || 'Consulta el artículo completo en Nicaragua Informate para más detalles.',
      id: `faq-${i}`,
    }));
  }, [contenidoHtml, resumen]);

  if (faqs.length === 0) return null;

  return (
    <section style={{ margin: '40px 0', padding: '24px 20px', backgroundColor: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }} aria-label="Preguntas frecuentes">
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#166534', margin: '0 0 16px' }}>
        Preguntas frecuentes
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {faqs.map((faq) => (
          <details
            key={faq.id}
            style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #bbf7d0' }}
          >
            <summary
              style={{
                padding: '14px 16px',
                fontSize: 15,
                fontWeight: 600,
                color: '#166534',
                cursor: 'pointer',
                listStyle: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {faq.pregunta}
              <span style={{ fontSize: 18, color: '#166534', marginLeft: 8 }}>+</span>
            </summary>
            <div style={{ padding: '0 16px 14px', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              {faq.respuesta}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
