'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Mail, Radio, BarChart3, CloudSun, TrendingUp, Share2 } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import dynamic from 'next/dynamic';
import GuiaUtilWidget from './GuiaUtilWidget';

const RadioPlayer = dynamic(() => import('@/components/RadioPlayer'), { ssr: false });
const EconomicBar = dynamic(() => import('@/components/EconomicBar'), { ssr: false });
const WeatherWidget = dynamic(() => import('@/components/WeatherWidget'), { ssr: false });

interface SidebarProProps {
  masLeidas?: Noticia[];
  populares?: Noticia[];
  noticias?: Noticia[];
  excluirIds?: Set<string>;
  ocultarSucesos?: boolean;
}

function MasLeidas({ noticias }: { noticias: Noticia[] }) {
  if (!noticias.length) return null;
  return (
    <div className="ni-sidebar__widget" data-reveal>
      <h3 className="ni-sidebar__title">
        <TrendingUp size={16} /> Más leídas
      </h3>
      <ol className="ni-trending">
        {noticias.slice(0, 5).map((n, i) => (
          <li key={n.id}>
            <span className="ni-trending__num">{i + 1}</span>
            <div>
              <Link href={`/noticias/${n.slug}`} className="ni-trending__text">{n.titulo}</Link>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SigueNos() {
  return (
    <div className="ni-sidebar__widget ni-sidebar__follow" data-reveal>
      <h3 className="ni-sidebar__title">
        <Share2 size={16} /> Síguenos
      </h3>
      <p className="ni-sidebar__follow-text">Únete a miles de nicaragüenses informados.</p>
      <div className="ni-sidebar__follow-links">
        <a
          href="https://www.facebook.com/profile.php?id=61578261125687"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="ni-sidebar__follow-btn ni-sidebar__follow-btn--fb"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
          <span>Facebook</span>
        </a>
        <a
          href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="ni-sidebar__follow-btn ni-sidebar__follow-btn--wa"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
          <span>WhatsApp</span>
        </a>
        <a
          href="https://t.me/fHHjncJqMQM3NjZh"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Telegram"
          className="ni-sidebar__follow-btn ni-sidebar__follow-btn--tg"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
          <span>Telegram</span>
        </a>
      </div>
    </div>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('success');
    setEmail('');
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <div className="ni-sidebar__widget ni-newsletter" data-reveal>
      <h3 className="ni-sidebar__title">
        <Mail size={16} /> Newsletter
      </h3>
      <p>Recibe las noticias más importantes de Nicaragua cada mañana.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="sidebar-newsletter-email" className="sr-only">Correo electrónico</label>
        <input
          id="sidebar-newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@gmail.com"
          aria-label="Tu correo electrónico para el newsletter"
          required
        />
        <button type="submit" aria-label="Suscribirse al newsletter">Suscribirme gratis</button>
      </form>
      {status === 'success' && <span className="newsletter-success">¡Gracias por suscribirte!</span>}
      <span className="newsletter-meta">Únete a miles de nicaragüenses informados.</span>
    </div>
  );
}

export default function SidebarPro({ masLeidas = [], populares = [], noticias = [], excluirIds, ocultarSucesos }: SidebarProProps) {
  // Si no hay masLeidas explícitas, usar noticias como fallback
  const lecturas = useMemo(() => {
    const base = masLeidas.length ? masLeidas : populares.length ? populares : noticias;
    return base
      .filter(n => !excluirIds?.has(n.id))
      .filter(n => !ocultarSucesos || n.categoria !== 'Sucesos')
      .slice(0, 5);
  }, [masLeidas, populares, noticias, excluirIds, ocultarSucesos]);

  return (
    <aside className="ni-sidebar" aria-label="Sidebar">
      {/* Radio en vivo - primero */}
      <div className="ni-sidebar__widget ni-widget-compact" data-reveal>
        <h3 className="ni-widget-compact__title">
          <Radio size={16} /> Radio en Vivo
        </h3>
        <RadioPlayer />
      </div>

      {/* Indicadores económicos compactos */}
      <div className="ni-sidebar__widget ni-widget-compact" data-reveal>
        <h3 className="ni-widget-compact__title">
          <BarChart3 size={16} /> Indicadores
        </h3>
        <EconomicBar />
      </div>

      {/* Clima compacto */}
      <div className="ni-sidebar__widget ni-widget-compact" data-reveal>
        <h3 className="ni-widget-compact__title">
          <CloudSun size={16} /> Clima Nicaragua
        </h3>
        <WeatherWidget />
      </div>

      {/* Más leídas */}
      <MasLeidas noticias={lecturas} />

      {/* Síguenos — redes sociales */}
      <SigueNos />

      {/* Newsletter */}
      <Newsletter />

      {/* Guías Útiles */}
      <div className="ni-sidebar__widget" data-reveal>
        <h3 className="ni-sidebar__title">Guías útiles</h3>
        <GuiaUtilWidget />
      </div>
    </aside>
  );
}
