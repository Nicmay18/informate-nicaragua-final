'use client';

import { Cross } from 'lucide-react';

interface LutoBadgeProps {
  nombre?: string;
  className?: string;
}

export default function LutoBadge({ nombre, className = '' }: LutoBadgeProps) {
  return (
    <div className={`luto-container ${className}`}>
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
