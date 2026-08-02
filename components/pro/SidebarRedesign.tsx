import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Flame } from 'lucide-react';
import { diversifyNoticias } from '@/lib/diversify';
import type { Noticia } from '@/lib/types';

import GuiaUtilWidget from '@/components/pro/GuiaUtilWidget';

const RadioPlayer = dynamic(() => import('@/components/RadioPlayer'), { ssr: false });
const EconomicBar = dynamic(() => import('@/components/EconomicBar'), { ssr: false });
const WeatherWidget = dynamic(() => import('@/components/WeatherWidget'), { ssr: false });
const WorldClock = dynamic(() => import('@/components/WorldClock'), { ssr: false });

interface SidebarRedesignProps {
  masLeidas: Noticia[];
}

export default function SidebarRedesign({ masLeidas }: SidebarRedesignProps) {
  const lecturas = diversifyNoticias(masLeidas, 5, 1);

  function timeAgo(dateString?: string) {
    const d = dateString ? new Date(dateString) : new Date();
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (Number.isNaN(days) || days < 0) return '';
    return days === 0 ? 'hoy' : `hace ${days} d`;
  }

  return (
    <>
      {/* Radio en vivo */}
      <div className="rd-panel" style={{ overflow: 'hidden' }}>
        <div className="rd-panel-head">Radio en Vivo</div>
        <div style={{ padding: '0 0 16px' }}>
          <RadioPlayer />
        </div>
      </div>

      {/* Indicadores económicos */}
      <div className="rd-panel" style={{ overflow: 'hidden', background: '#0f172a' }}>
        <div className="rd-panel-head" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>Indicadores económicos</div>
        <EconomicBar />
      </div>

      {/* Clima */}
      <div className="rd-panel" style={{ overflow: 'hidden', background: '#0f172a' }}>
        <div className="rd-panel-head" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>Clima Nicaragua</div>
        <WeatherWidget />
      </div>

      {/* Reloj mundial */}
      <div className="rd-panel" style={{ overflow: 'hidden', background: '#0f172a' }}>
        <div className="rd-panel-head" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>Reloj mundial</div>
        <WorldClock />
      </div>

      {lecturas.length > 0 && (
        <div className="rd-panel">
          <div className="rd-panel-head" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={18} /> Lo más leído
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: '0 16px 14px' }}>
            {lecturas.map((n, i) => (
              <li key={n.id} style={{ padding: '12px 0', borderBottom: i < lecturas.length - 1 ? '1px solid var(--rd-line)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--rd-serif)', fontWeight: 800, fontSize: 20, color: 'var(--rd-accent)', lineHeight: 1 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--rd-accent)', background: 'var(--rd-accent-soft)', padding: '3px 8px', borderRadius: 999 }}>
                    {n.categoria}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--rd-muted)' }}>{timeAgo(n.fecha)}</span>
                </div>
                <h4 style={{ fontFamily: 'var(--rd-serif)', fontSize: 14.5, lineHeight: 1.35, fontWeight: 600, margin: 0 }}>
                  <Link href={`/noticias/${n.slug}`} style={{ color: 'var(--rd-ink)', textDecoration: 'none' }}>{n.titulo}</Link>
                </h4>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Guías útiles */}
      <div className="rd-panel" style={{ overflow: 'hidden' }}>
        <div className="rd-panel-head">Guías útiles</div>
        <div style={{ padding: '0 16px 14px' }}>
          <GuiaUtilWidget />
        </div>
      </div>

      <div style={{ background: 'var(--rd-accent-soft)', border: '1px solid #B9DAD6', borderRadius: 'var(--rd-radius)', padding: 20 }}>
        <h3 style={{ fontFamily: 'var(--rd-serif)', fontSize: 17, margin: '0 0 6px' }}>Boletín matutino</h3>
        <p style={{ fontSize: 13, color: '#0B3D3A', margin: '0 0 14px', lineHeight: 1.45 }}>
          Recibe las noticias más importantes de Nicaragua cada mañana, directo a tu correo.
        </p>
        <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: 8 }}>
          <input
            type="email"
            placeholder="nombre@correo.com"
            aria-label="Correo electrónico"
            style={{ flex: 1, minWidth: 0, border: '1px solid #A9CFCB', borderRadius: 'var(--rd-radius)', padding: '9px 10px', fontFamily: 'var(--rd-sans)', fontSize: 13, background: '#fff' }}
          />
          <button type="submit" style={{ background: 'var(--rd-ink)', color: '#fff', border: 'none', borderRadius: 'var(--rd-radius)', padding: '9px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Suscribirme
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <a href="https://www.facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ width: 36, height: 36, border: '1px solid var(--rd-line)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rd-ink)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.87.24-1.46 1.5-1.46H16.5V4.35C16.24 4.32 15.36 4.25 14.33 4.25c-2.15 0 -3.62 1.31-3.62 3.72v2.53H8.25v3H10.71V21h2.79z" /></svg>
        </a>
        <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" style={{ width: 36, height: 36, border: '1px solid var(--rd-line)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rd-ink)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 00-7.75 13.6L3 21l4.55-1.2A9 9 0 1012 3z" /></svg>
        </a>
        <a href="https://t.me/fHHjncJqMQM3NjZh" target="_blank" rel="noopener noreferrer" aria-label="Telegram" style={{ width: 36, height: 36, border: '1px solid var(--rd-line)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rd-ink)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 4.5L3.6 11.4c-1.1.44-1.1 1.06-.2 1.33l4.6 1.44 1.77 5.4c.22.6.4.83.8.83.35 0 .5-.16.7-.35l1.9-1.85 4 2.94c.7.4 1.22.2 1.4-.65l2.5-11.9c.28-1.1-.4-1.6-1.17-1.15z" /></svg>
        </a>
      </div>
    </>
  );
}
