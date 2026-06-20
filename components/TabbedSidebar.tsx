'use client';

import { useState, useMemo } from 'react';
import type { ComponentProps } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Flame } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import { getResponsiveImageUrl } from '@/lib/image-utils';
import { catClass } from '@/lib/homepage-utils';

const NoPrefetchLink = (props: ComponentProps<typeof Link>) => (
  <Link {...props} prefetch={false} />
);

export default function TabbedSidebarWidget({
  ultimas,
  populares,
  tendencias,
}: {
  ultimas: Noticia[];
  populares: Noticia[];
  tendencias: Noticia[];
}) {
  const [activeTab, setActiveTab] = useState<'ultimas' | 'populares' | 'tendencias'>('ultimas');

  const list = useMemo(() => {
    if (activeTab === 'ultimas') return ultimas.slice(0, 5);
    if (activeTab === 'populares') return populares.slice(0, 5);
    return tendencias.slice(0, 5);
  }, [activeTab, ultimas, populares, tendencias]);

  return (
    <div className="ni-sidebar__widget ni-tab-widget">
      <div className="ni-tab-widget__header">
        <button
          className={`ni-tab-widget__btn ${activeTab === 'ultimas' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('ultimas')}
        >
          <TrendingUp size={12} style={{ marginRight: 4 }} /> Más leídas
        </button>
        <button
          className={`ni-tab-widget__btn ${activeTab === 'populares' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('populares')}
        >
          <Flame size={12} style={{ marginRight: 4 }} /> Populares
        </button>
        <button
          className={`ni-tab-widget__btn ${activeTab === 'tendencias' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('tendencias')}
        >
          <TrendingUp size={12} style={{ marginRight: 4 }} /> Tendencias
        </button>
      </div>
      <div className="ni-tab-widget__body">
        <ul className="ni-tab-list">
          {list.map((n) => (
            <li key={n.id} className="ni-tab-item">
              <div className="ni-tab-item__img">
                {n.imagen ? (
                  <Image
                    src={getResponsiveImageUrl(n.imagen, 100)}
                    alt={n.titulo}
                    width={64}
                    height={64}
                    style={{ objectFit: 'cover' }}
                    unoptimized={n.imagen.endsWith('.gif')}
                  />
                ) : (
                  <div className="ni-tab-item__fallback">🇳🇮</div>
                )}
              </div>
              <div className="ni-tab-item__content">
                <span className={`ni-tab-item__pill ni-tab-item__pill--${catClass(n.categoria)}`}>
                  {n.categoria}
                </span>
                <NoPrefetchLink href={`/noticias/${n.slug}`} className="ni-tab-item__title">
                  {n.titulo}
                </NoPrefetchLink>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
