import Link from 'next/link';
import type { Noticia } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';

export default function MasLeidas({ noticias }: { noticias: Noticia[] }) {
  if (!noticias.length) return null;

  return (
    <div className="bg-[var(--paper-accent)] rounded-[14px] border border-[var(--border-light)] overflow-hidden shadow-sm widget-lift">
      <div className="bg-gradient-to-br from-[#8c1d18] to-[#c41e3a] px-4 py-3 flex items-center gap-2">
        <i className="fas fa-fire text-red-300 text-sm" />
        <span className="text-white font-bold text-[13px] uppercase tracking-wider">Más Leídas</span>
      </div>
      <div className="py-2">
        {noticias.map((n, i) => (
          <Link
            key={n.id}
            href={`/noticias/${n.slug}`}
            className="mas-leidas-item flex gap-3.5 px-4 py-3 no-underline items-start transition-colors"
            style={{ borderBottom: i < noticias.length - 1 ? '1px solid var(--border-light)' : 'none' }}
          >
            <span
              className="text-[28px] font-black leading-none min-w-[32px] shrink-0"
              style={{ color: i === 0 ? '#8c1d18' : 'var(--border-medium)' }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <span
                className="text-[10px] font-bold uppercase block mb-0.5"
                style={{ color: CATEGORY_COLORS[n.categoria] || '#64748b' }}
              >
                {n.categoria}
              </span>
              <span className="text-[13px] text-[var(--ink-muted)] leading-snug line-clamp-2 font-semibold">
                {n.titulo}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
