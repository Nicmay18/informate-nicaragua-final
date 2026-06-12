'use client';

import { stripHtml } from '@/lib/formateo';

interface PullQuoteProps {
  contenido: string;
}

/**
 * Extrae una frase representativa del artículo y la muestra como cita destacada.
 * Se carga vía lazy/Suspense para no penalizar el LCP inicial.
 */
export default function PullQuote({ contenido }: PullQuoteProps) {
  const plain = stripHtml(contenido);
  const sentences = plain.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 80 && s.length < 210);
  const quote = sentences[Math.floor(sentences.length / 2)] || sentences[1] || '';
  if (!quote) return null;

  return (
    <aside style={{ margin: '32px 0', paddingLeft: 24, borderLeft: '4px solid #991b1b', paddingTop: 8, paddingBottom: 8 }}>
      <p style={{ fontSize: 20, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#1f2937', lineHeight: 1.6, margin: 0 }}>
        &ldquo;{quote}.&rdquo;
      </p>
    </aside>
  );
}
