'use client';

import React from 'react';

interface ArticleDataCardProps {
  categoria: string;
  autor: string;
  fecha: string;
  fechaActualizacion?: string;
  lecturaMin: number;
  vistas: string;
  tags: string[];
  slug: string;
}

export default function ArticleDataCard({
  categoria,
  autor,
  fecha,
  fechaActualizacion,
  lecturaMin,
  vistas,
  tags,
  slug,
}: ArticleDataCardProps) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-NI', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div className="data-card" style={{ margin: '2em 0' }}>
      <div
        className="data-card-header"
        style={{
          background: 'var(--primary, #1e3a5f)',
          color: '#fff',
          padding: '12px 20px',
          fontFamily: 'var(--font-sans, Inter)',
          fontSize: '0.8rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        Ficha técnica del artículo
      </div>
      <table
        className="data-table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-sans, Inter)',
          fontSize: '0.9rem',
        }}
      >
        <caption
          style={{
            captionSide: 'top',
            padding: '10px 20px',
            fontSize: '0.75rem',
            color: 'var(--text-muted, #6b7280)',
            textAlign: 'left',
            fontWeight: 600,
          }}
        >
          Datos de publicación y clasificación del contenido
        </caption>
        <tbody>
          <tr>
            <th scope="row">Categoría</th>
            <td>{categoria}</td>
          </tr>
          <tr>
            <th scope="row">Autor</th>
            <td>{autor}</td>
          </tr>
          <tr>
            <th scope="row">Fecha de publicación</th>
            <td>
              <time dateTime={fecha}>{formatDate(fecha)}</time>
            </td>
          </tr>
          {fechaActualizacion && (
            <tr>
              <th scope="row">Última actualización</th>
              <td>
                <time dateTime={fechaActualizacion}>{formatDate(fechaActualizacion)}</time>
              </td>
            </tr>
          )}
          <tr>
            <th scope="row">Tiempo de lectura</th>
            <td>{lecturaMin} minutos</td>
          </tr>
          <tr>
            <th scope="row">Visualizaciones</th>
            <td>{vistas}</td>
          </tr>
          <tr>
            <th scope="row">Etiquetas</th>
            <td>{tags.join(', ') || 'Sin etiquetas'}</td>
          </tr>
          <tr>
            <th scope="row">URL permanente</th>
            <td>
              <code
                style={{
                  fontSize: '0.8rem',
                  background: 'var(--surface-2, #f3f4f6)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  wordBreak: 'break-all',
                }}
              >
                nicaraguainformate.com/noticias/{slug}
              </code>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
