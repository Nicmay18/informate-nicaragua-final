'use client';

import Link from 'next/link';
import { FileText, ArrowRight, Plane, Car, Building2, Scale, Stethoscope, GraduationCap } from 'lucide-react';

const GUIAS = [
  { slug: 'pasaporte-nicaragua-2026', label: 'Trámites de pasaporte', icon: Plane },
  { slug: 'licencia-conducir-nicaragua-2026', label: 'Licencia de conducir', icon: Car },
  { slug: 'inss-nicaragua-2026', label: 'Servicios INSS', icon: Building2 },
  { slug: 'denuncia-nicaragua-2026', label: 'Cómo denunciar', icon: Scale },
  { slug: 'salud-nicaragua-2026', label: 'Centros de salud', icon: Stethoscope },
  { slug: 'becas-nicaragua-2026', label: 'Becas y educación', icon: GraduationCap },
];

export default function GuiaUtilWidget() {
  return (
    <div className="guia-widget" role="region" aria-label="Guías útiles">
      <ul className="guia-list">
        {GUIAS.map((g) => (
          <li key={g.slug} className="guia-item">
            <Link href={`/guia/${g.slug}`} className="guia-link">
              <span className="guia-icon">
                <g.icon size={16} />
              </span>
              <span className="guia-label">{g.label}</span>
              <ArrowRight size={14} />
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/guia" className="guia-ver-todas">
        <FileText size={14} />
        Ver todas las guías
      </Link>
    </div>
  );
}
