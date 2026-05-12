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
      <style>{`
        .luto-image-container {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
        }
        .luto-image-cinta {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 8px;
          background: repeating-linear-gradient(
            90deg,
            #000 0px,
            #000 12px,
            #222 12px,
            #222 24px
          );
          z-index: 10;
        }
        .luto-image-ribbon {
          position: absolute;
          top: 24px;
          right: -45px;
          background: #000;
          color: #fff;
          padding: 8px 60px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          transform: rotate(45deg);
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .luto-image-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.12);
          z-index: 3;
          pointer-events: none;
        }
        .luto-image-marca {
          position: absolute;
          bottom: 16px;
          right: 16px;
          color: rgba(255,255,255,0.5);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          z-index: 5;
          pointer-events: none;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }
        .luto-image-dep {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: rgba(0,0,0,0.75);
          color: #fff;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1px;
          z-index: 10;
        }
        .luto-image-dep span {
          font-style: italic;
          font-weight: 400;
        }
        @media (max-width: 640px) {
          .luto-image-ribbon {
            font-size: 10px;
            padding: 6px 50px;
            top: 18px;
            right: -40px;
          }
        }
      `}</style>
      
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
