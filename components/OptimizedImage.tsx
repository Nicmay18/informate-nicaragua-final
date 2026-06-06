'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  variant?: 'hero' | 'card' | 'sidebar' | 'thumbnail' | 'og';
  className?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  unoptimized?: boolean;
  style?: React.CSSProperties;
  onError?: () => void;
}

const VARIANT_SIZES = {
  hero:     { width: 768,  height: 432, sizes: '(max-width: 640px) 100vw, (max-width: 1200px) 80vw, 768px' },
  card:     { width: 580,  height: 326, sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' },
  sidebar:  { width: 220,  height: 124, sizes: '220px' },
  thumbnail:{ width: 120,  height: 68,  sizes: '120px' },
  og:       { width: 1200, height: 630, sizes: '1200px' },
} as const;

function buildWeservUrl(src: string, w: number, q = 75): string {
  if (src.includes('images.weserv.nl') || src.includes('cloudinary') || src.includes('imgix')) {
    return src;
  }
  const params = new URLSearchParams();
  params.set('url', src);
  params.set('w', w.toString());
  params.set('q', q.toString());
  params.set('output', 'webp');
  params.set('fit', 'cover');
  params.set('n', '-1');
  return `https://images.weserv.nl/?${params.toString()}`;
}

export default function OptimizedImage({
  src,
  alt,
  variant = 'card',
  className = '',
  priority = false,
  fill = false,
  width,
  height,
  unoptimized = false,
  style,
  onError,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const config = VARIANT_SIZES[variant];

  const finalWidth = width ?? config.width;
  const finalHeight = height ?? config.height;
  const sizes = config.sizes;

  const isLocal = src.startsWith('/');
  const isExternalOptimized = src.includes('images.weserv.nl') || src.includes('cloudinary');
  const needsProxy = !isLocal && !isExternalOptimized && !unoptimized;
  const imageSrc = needsProxy ? buildWeservUrl(src, finalWidth) : src;

  const containerStyle: React.CSSProperties = fill
    ? { position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }
    : { position: 'relative', width: finalWidth, height: finalHeight, overflow: 'hidden' };

  return (
    <div
      className={`optimized-image-wrapper ${className}`}
      style={{ ...containerStyle, ...style }}
      data-variant={variant}
    >
      {!loaded && (
        <div
          className="optimized-image-skeleton"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
            zIndex: 1,
          }}
        />
      )}

      <Image
        src={imageSrc}
        alt={alt}
        fill={fill}
        width={fill ? undefined : finalWidth}
        height={fill ? undefined : finalHeight}
        sizes={sizes}
        priority={priority}
        quality={75}
        onLoad={() => setLoaded(true)}
        onError={() => { setLoaded(true); onError?.(); }}
        style={{
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        unoptimized={unoptimized || isLocal}
      />
    </div>
  );
}
