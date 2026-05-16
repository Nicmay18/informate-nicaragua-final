'use client';

import Image from 'next/image';

interface LutoImageProps {
  src: string;
  alt: string;
  nombre?: string;
  className?: string;
}

export default function LutoImage({ src, alt, nombre, className = '' }: LutoImageProps) {
  return (
    <div className={`luto-image-container ${className}`}>
      <div className="luto-image-cinta" />
      <div className="luto-image-ribbon">En Memoria</div>
      
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
        priority
      />
      
      <div className="luto-image-overlay" />
      <div className="luto-image-marca">Nicaragua Informate</div>
      
      {nombre && (
        <div className="luto-image-dep">
          D.E.P. <span>{nombre}</span>
        </div>
      )}
    </div>
  );
}
