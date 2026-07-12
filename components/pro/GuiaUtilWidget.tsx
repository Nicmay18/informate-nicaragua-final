'use client';

import Link from 'next/link';
import { FileText, ArrowRight, Plane, Scale, Building2, Wallet, Coins } from 'lucide-react';

const GUIAS = [
  { slug: 'tramites-migratorios-nicaraguenses-costa-rica-eeuu-espana-2026', label: 'Trámites migratorios', icon: Plane },
  { slug: 'apostillar-documentos-nicaragua-2026', label: 'Apostillar documentos', icon: FileText },
  { slug: 'anular-recurso-policial-nicaragua-2026', label: 'Anular récord policial', icon: Scale },
  { slug: 'salario-minimo-nicaragua-2026', label: 'Salario mínimo 2026', icon: Wallet },
  { slug: 'costo-de-vida-nicaragua-2026', label: 'Costo de vida', icon: Building2 },
  { slug: 'dolar-a-cordoba-nicaragua-hoy-2026', label: 'Dólar a córdoba', icon: Coins },
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
