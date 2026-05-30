"use client";

import { useState, useEffect } from 'react';
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
      <SidebarWeather />

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
            href="https://www.facebook.com/profile.php?id=61578261125687"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link facebook"
            aria-label="Síguenos en Facebook"
          >
            <span className="social-icon">📘</span>
            <span className="social-label">Facebook</span>
          </a>
          
        </div>
      </div>
    </aside>
  );
}

// Mini widget de clima real para Managua (Open-Meteo, sin API key)
function SidebarWeather() {
  const [data, setData] = useState<{ temp: number; humidity: number; condition: string; emoji: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=12.1328&longitude=-86.2504&current=temperature_2m,relative_humidity_2m,weather_code&timezone=America%2FManagua'
        );
        if (!res.ok) throw new Error('fail');
        const json = await res.json();
        const code = json.current.weather_code;
        const condition = wmoLabel(code);
        const emoji = wmoEmoji(code);
        setData({
          temp: Math.round(json.current.temperature_2m),
          humidity: json.current.relative_humidity_2m,
          condition,
          emoji,
        });
      } catch {
        setData({ temp: 0, humidity: 0, condition: 'Error', emoji: '⚠️' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="sidebar-widget weather-widget">
        <div className="widget-header"><h3 className="widget-title">Clima en Managua</h3></div>
        <div style={{ padding: 16, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="sidebar-widget weather-widget">
      <div className="widget-header"><h3 className="widget-title">Clima en Managua</h3></div>
      <div className="weather-content">
        <div className="weather-main">
          <div className="weather-icon">{data?.emoji}</div>
          <div className="weather-temp">
            <span className="temp-value">{data?.temp}°</span>
            <span className="temp-unit">C</span>
          </div>
        </div>
        <div className="weather-details">
          <div className="weather-condition">{data?.condition}</div>
          <div className="weather-humidity">Humedad: {data?.humidity}%</div>
        </div>
      </div>
    </div>
  );
}

function wmoLabel(code: number): string {
  if (code === 0) return 'Despejado';
  if (code === 1) return 'Casi despejado';
  if (code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code === 45 || code === 48) return 'Niebla';
  if (code >= 51 && code <= 55) return 'Llovizna';
  if (code >= 61 && code <= 65) return 'Lluvia';
  if (code >= 80 && code <= 82) return 'Chubascos';
  if (code >= 95) return 'Tormenta';
  return 'Variable';
}

function wmoEmoji(code: number): string {
  if (code === 0 || code === 1) return '☀️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 55) return '🌦️';
  if (code >= 61 && code <= 65) return '🌧️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}