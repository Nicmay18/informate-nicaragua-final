"use client";

import { useState } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  unoptimized?: boolean;
}

export default function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  className,
  style,
  priority,
  unoptimized,
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src || '/logo.webp');

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      className={className}
      style={style}
      priority={priority}
      unoptimized={unoptimized}
      onError={() => setImgSrc('/logo.webp')}
    />
  );
}
