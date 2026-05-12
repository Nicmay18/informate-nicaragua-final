'use client';

import { Cross } from 'lucide-react';

interface LutoBadgeProps {
  nombre?: string;
  className?: string;
}

export default function LutoBadge({ nombre, className = '' }: LutoBadgeProps) {
  return (
    <div className={`luto-container ${className}`}>
      <style>{`
        .luto-container {
          position: relative;
          overflow: hidden;
        }
        .luto-cinta {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 6px;
          background: repeating-linear-gradient(
            90deg,
            #000 0px,
            #000 10px,
            #333 10px,
            #333 20px
          );
          z-index: 10;
        }
        .luto-ribbon {
          position: absolute;
          top: 20px;
          right: -35px;
          background: #000;
          color: #fff;
          padding: 6px 50px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          transform: rotate(45deg);
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .luto-dep {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #000;
          color: #fff;
          padding: 6px 14px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .luto-marca-agua {
          position: absolute;
          bottom: 12px;
          right: 12px;
          color: rgba(255,255,255,0.4);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          z-index: 5;
          pointer-events: none;
        }
        .luto-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.15);
          z-index: 3;
          pointer-events: none;
        }
        .luto-nombre {
          font-style: italic;
          font-weight: 400;
          opacity: 0.9;
        }
      `}</style>
      
      <div className="luto-cinta" />
      <div className="luto-ribbon">Luto</div>
      
      {nombre && (
        <div className="luto-dep">
          <Cross size={14} />
          D.E.P. <span className="luto-nombre">{nombre}</span>
        </div>
      )}
      
      <div className="luto-marca-agua">Nicaragua Informate</div>
    </div>
  );
}
