import Link from 'next/link';
import { FileText, ArrowRight, Plane, Coins, Map, Utensils, Trophy, BookOpen } from 'lucide-react';
import { getAllEvergreen } from '@/lib/evergreen';
import { diversifyEvergreen } from '@/lib/diversify';

const ICON_BY_CATEGORY: Record<string, React.ElementType> = {
  Trámites: Plane,
  Turismo: Map,
  Economía: Coins,
  Cultura: Utensils,
  Deportes: Trophy,
};

export default function GuiaUtilWidget() {
  const guias = diversifyEvergreen(getAllEvergreen(), 6);

  return (
    <div className="guia-widget" role="region" aria-label="Guías útiles">
      <ul className="guia-list" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {guias.map((g) => {
          const Icon = ICON_BY_CATEGORY[g.category] || BookOpen;
          return (
            <li key={g.slug} className="guia-item" style={{ borderRadius: 8, background: 'var(--ni-bg)', border: '1px solid var(--ni-border)' }}>
              <Link href={`/guia/${g.slug}`} className="guia-link" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', textDecoration: 'none', color: 'inherit' }}>
                <span className="guia-icon" style={{ color: 'var(--rd-accent)', flexShrink: 0 }}>
                  <Icon size={18} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="guia-label" style={{ fontWeight: 600, fontSize: 14, display: 'block' }}>{g.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>{g.category}</span>
                </span>
                <ArrowRight size={14} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href="/guia" className="guia-ver-todas" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--rd-accent)', marginTop: 12, textDecoration: 'none' }}>
        <FileText size={14} />
        Ver todas las guías
      </Link>
    </div>
  );
}
