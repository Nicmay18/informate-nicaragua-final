'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Mail, Radio, BarChart3, CloudSun, TrendingUp } from 'lucide-react';
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

export default function SidebarPro({ masLeidas = [], populares = [], noticias = [], excluirIds }: SidebarProProps) {
  // Si no hay masLeidas explícitas, usar noticias como fallback
  const lecturas = useMemo(() => {
    const base = masLeidas.length ? masLeidas : populares.length ? populares : noticias;
    return base.filter(n => !excluirIds?.has(n.id)).slice(0, 5);
  }, [masLeidas, populares, noticias, excluirIds]);

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
