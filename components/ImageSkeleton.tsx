/**
 * MÓDULO 3: ImageSkeleton — Nicaragua Informate
 * Reserva espacio exacto antes de carga de imagen para eliminar CLS
 * y mejorar UX en redes móviles lentas (Claro/Tigo Nicaragua).
 *
 * Uso:
 *   <ImageSkeleton width={580} height={326} className="rounded-lg" />
 */

import React from 'react';

interface ImageSkeletonProps {
  width?: number;
  height?: number;
  aspectRatio?: string;
  className?: string;
  variant?: 'hero' | 'card' | 'sidebar' | 'thumbnail';
}

const VARIANT_RATIOS: Record<string, string> = {
  hero: '1200 / 675',
  card: '580 / 326',
  sidebar: '220 / 124',
  thumbnail: '120 / 68',
};

export default function ImageSkeleton({
  width,
  height,
  aspectRatio,
  className = '',
  variant = 'card',
}: ImageSkeletonProps) {
  const ratio = aspectRatio || (width && height ? `${width} / ${height}` : VARIANT_RATIOS[variant]);

  return (
    <div
      className={`image-skeleton relative overflow-hidden bg-gray-200 dark:bg-gray-800 ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        maxWidth: width ? `${width}px` : '100%',
        aspectRatio: ratio,
      }}
      aria-hidden="true"
    >
      {/* Efecto shimmer animado vía Tailwind */}
      <div className="absolute inset-0 animate-pulse">
        <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
      </div>

      {/* Patrón de cuadrícula sutil para indicar "imagen próxima" */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)',
        }}
      />
    </div>
  );
}
