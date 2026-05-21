"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import ProLayout from '@/components/ProLayout';
import WeatherWidget from '@/components/WeatherWidget';
import IndicadoresWidget from '@/components/IndicadoresWidget';
import NewsletterSignup from '@/components/NewsletterSignup';
import RadioPlayer from '@/components/RadioPlayer';
import { tiempoLectura } from '@/lib/formateo';
import type { Noticia } from '@/lib/types';

interface MobileHomeProps {
  noticias: Noticia[];
  masLeidas: Noticia[];
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return date;
  }
}

function timeAgo(date: string) {
  try {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return 'Hace ' + Math.floor(diff / 60) + ' min';
    if (diff < 86400) return 'Hace ' + Math.floor(diff / 3600) + ' horas';
    return formatDate(date);
  } catch { return date; }
}

function readTime(resumen?: string, contenido?: string) {
  return Math.max(1, tiempoLectura(contenido || resumen || '')) + ' min lectura';
}

export default function MobileHome({ noticias, masLeidas }: MobileHomeProps) {
  const hero = noticias[0];
  const latest = noticias.slice(1, 7);
  const tickerText = hero?.titulo || 'Nicaragua Informate';

  return (
    <ProLayout tickerText={tickerText}>
      {noticias.length > 0 && (
        <section className="swiper-section">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={noticias.length > 1}
            className="swiper"
          >
            {noticias.slice(0, 5).map((n) => (
              <SwiperSlide key={n.slug}>
                <Link href={`/noticias/${n.slug}`}>
                  {n.imagen && n.imagen !== '/logo.png' ? (
                    <Image src={n.imagen} alt={n.titulo} fill className="object-cover" sizes="100vw" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1e293b,#0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
                      {n.categoria}
                    </div>
                  )}
                  <div className="swiper-overlay">
                    <span className="swiper-tag">{n.categoria}</span>
                    <h2 className="swiper-title">{n.titulo}</h2>
                    <div className="swiper-meta">
                      <span>Por Redacción</span>
                      <span>{formatDate(n.fecha)}</span>
                      <span>{readTime(n.resumen, n.contenido)}</span>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      <div className="main">
        <div className="main-content">
          {masLeidas.length > 0 && (
            <section className="most-read-section">
              <div className="section-header">
                <h2 className="section-title">Más Leídas</h2>
                <Link href="/mas-leidas" className="section-link">Ver todas →</Link>
              </div>
              <div className="most-read-grid">
                {masLeidas.slice(0, 6).map((n, idx) => (
                  <Link href={`/noticias/${n.slug}`} key={n.slug} className="most-read-card">
                    <span className="most-read-number">{idx + 1}</span>
                    <div className="most-read-content">
                      <h3 className="most-read-title">{n.titulo}</h3>
                      <div className="most-read-meta">{timeAgo(n.fecha)} • {n.vistas?.toLocaleString() || 0} lecturas</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {latest.length > 0 && (
            <section>
              <div className="section-header">
                <h2 className="section-title">Últimas Noticias</h2>
                <Link href="/noticias" className="section-link">Ver todas →</Link>
              </div>
              <div className="news-grid">
                {latest.map((n) => (
                  <Link href={`/noticias/${n.slug}`} key={n.slug} className="news-card">
                    <div className="news-card-image">
                      {n.imagen && n.imagen !== '/logo.png' ? (
                        <Image src={n.imagen} alt={n.titulo} width={600} height={375} className="object-cover" style={{ width: '100%', height: 'auto', aspectRatio: '16/10', display: 'block' }} />
                      ) : (
                        <div style={{ width: '100%', aspectRatio: '16/10', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 700, fontSize: 14 }}>
                          {n.categoria}
                        </div>
                      )}
                      <span className="news-card-tag">{n.categoria}</span>
                    </div>
                    <div className="news-card-body">
                      <h3 className="news-card-title">{n.titulo}</h3>
                      {n.resumen && <p className="news-card-excerpt">{n.resumen}</p>}
                      <div className="news-card-meta">
                        <span>{timeAgo(n.fecha)}</span>
                        <span>{n.vistas?.toLocaleString() || 0} vistas</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="sidebar">
          <div className="sidebar-widget">
            <h3 className="widget-title">Newsletter</h3>
            <NewsletterSignup variant="sidebar" />
          </div>

          <RadioPlayer />

          <div className="sidebar-widget weather-widget">
            <h3 className="widget-title">Clima en Nicaragua</h3>
            <WeatherWidget />
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">Indicadores Económicos</h3>
            <IndicadoresWidget />
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">Síguenos</h3>
            <div className="social-grid">
              <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer" className="social-btn social-facebook">
                <span className="social-icon">📘</span>
                Facebook
              </a>
              <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener noreferrer" className="social-btn social-telegram">
                <span className="social-icon">✈️</span>
                Telegram
              </a>
              <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener noreferrer" className="social-btn social-whatsapp">
                <span className="social-icon">💬</span>
                WhatsApp
              </a>
            </div>
          </div>
        </aside>
      </div>
    </ProLayout>
  );
}
