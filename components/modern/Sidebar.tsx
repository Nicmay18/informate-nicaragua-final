"use client";

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Tag, Mail, ChevronRight, ExternalLink } from 'lucide-react';
import NewsCard from './NewsCard';
import type { Noticia } from '@/lib/types';

interface SidebarProps {
  masLeidas?: Noticia[];
  tags?: string[];
  className?: string;
}

const POPULAR_TAGS = [
  'Nicaragua', 'Managua', 'Política', 'Deportes',
  'Tecnología', 'Salud', 'Educación', 'Cultura', 'Turismo',
  'Medio Ambiente', 'Seguridad', 'Elecciones', 'Espectáculos'
];

const QUICK_LINKS = [
  { label: 'Contacto', href: '/contacto' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Política de Privacidad', href: '/privacidad' },
  { label: 'Términos de Uso', href: '/terminos' },
];

export default function Sidebar({ masLeidas = [], tags = POPULAR_TAGS, className = '' }: SidebarProps) {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubscribing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubscriptionStatus('success');
      setEmail('');
    } catch {
      setSubscriptionStatus('error');
    } finally {
      setIsSubscribing(false);
      setTimeout(() => setSubscriptionStatus('idle'), 3000);
    }
  };

  return (
    <aside className={`sidebar ${className}`}>
      {/* Trending News */}
      {masLeidas.length > 0 && (
        <div className="sidebar-widget trending-widget">
          <div className="widget-header">
            <TrendingUp size={20} className="widget-icon" />
            <h3 className="widget-title">Lo Más Leído</h3>
          </div>
          
          <div className="trending-list">
            {masLeidas.slice(0, 5).map((noticia, index) => (
              <div key={noticia.id} className="trending-item">
                <div className="trending-rank">
                  <span className={`rank-number ${index < 3 ? 'top-three' : ''}`}>
                    {index + 1}
                  </span>
                </div>
                <NewsCard
                  noticia={noticia}
                  variant="compact"
                  showExcerpt={false}
                  showAuthor={false}
                  showViews={true}
                />
              </div>
            ))}
          </div>
          
          <Link href="/mas-leidas" className="widget-footer-link">
            Ver todas las noticias populares
            <ChevronRight size={16} />
          </Link>
        </div>
      )}

      {/* Newsletter Subscription */}
      <div className="sidebar-widget newsletter-widget">
        <div className="widget-header">
          <Mail size={20} className="widget-icon" />
          <h3 className="widget-title">Boletín Informativo</h3>
        </div>
        
        <div className="newsletter-content">
          <p className="newsletter-description">
            Recibe las noticias más importantes de Nicaragua directamente en tu correo.
          </p>
          
          <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
            <div className="form-group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="newsletter-input"
                required
                disabled={isSubscribing}
              />
              <button
                type="submit"
                className="newsletter-button"
                disabled={isSubscribing || !email.trim()}
              >
                {isSubscribing ? 'Suscribiendo...' : 'Suscribirse'}
              </button>
            </div>
            
            {subscriptionStatus === 'success' && (
              <div className="subscription-message success">
                ¡Gracias! Te has suscrito exitosamente.
              </div>
            )}
            
            {subscriptionStatus === 'error' && (
              <div className="subscription-message error">
                Error al suscribirse. Inténtalo de nuevo.
              </div>
            )}
          </form>
          
          <p className="newsletter-disclaimer">
            No spam. Puedes cancelar tu suscripción en cualquier momento.
          </p>
        </div>
      </div>

      {/* Tags Cloud */}
      <div className="sidebar-widget tags-widget">
        <div className="widget-header">
          <Tag size={20} className="widget-icon" />
          <h3 className="widget-title">Temas Populares</h3>
        </div>
        
        <div className="tags-cloud">
          {tags.slice(0, 12).map((tag, index) => (
            <Link
              key={tag}
              href={`/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
              className={`tag-item ${index < 3 ? 'popular-tag' : ''}`}
            >
              #{tag}
            </Link>
          ))}
        </div>
        
        <Link href="/tags" className="widget-footer-link">
          Ver todos los temas
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Weather Widget */}
      <div className="sidebar-widget weather-widget">
        <div className="widget-header">
          <h3 className="widget-title">Clima en Managua</h3>
        </div>
        
        <div className="weather-content">
          <div className="weather-main">
            <div className="weather-icon">☀️</div>
            <div className="weather-temp">
              <span className="temp-value">32°</span>
              <span className="temp-unit">C</span>
            </div>
          </div>
          
          <div className="weather-details">
            <div className="weather-condition">Soleado</div>
            <div className="weather-range">Min: 24° / Max: 35°</div>
            <div className="weather-humidity">Humedad: 65%</div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="sidebar-widget links-widget">
        <div className="widget-header">
          <h3 className="widget-title">Enlaces Útiles</h3>
        </div>
        
        <div className="quick-links">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="quick-link"
            >
              <span>{link.label}</span>
              <ExternalLink size={14} />
            </Link>
          ))}
        </div>
      </div>

      {/* Social Media */}
      <div className="sidebar-widget social-widget">
        <div className="widget-header">
          <h3 className="widget-title">Síguenos</h3>
        </div>
        
        <div className="social-links">
          <a
            href="https://facebook.com/nicaraguainformate"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link facebook"
            aria-label="Síguenos en Facebook"
          >
            <span className="social-icon">📘</span>
            <span className="social-label">Facebook</span>
          </a>
          
          <a
            href="https://twitter.com/nicinformate"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link twitter"
            aria-label="Síguenos en Twitter"
          >
            <span className="social-icon">🐦</span>
            <span className="social-label">Twitter</span>
          </a>
          
          <a
            href="https://instagram.com/nicaraguainformate"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link instagram"
            aria-label="Síguenos en Instagram"
          >
            <span className="social-icon">📷</span>
            <span className="social-label">Instagram</span>
          </a>
          
          <a
            href="https://youtube.com/nicaraguainformate"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link youtube"
            aria-label="Síguenos en YouTube"
          >
            <span className="social-icon">📺</span>
            <span className="social-label">YouTube</span>
          </a>
        </div>
      </div>
    </aside>
  );
}