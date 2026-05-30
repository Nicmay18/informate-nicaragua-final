"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ExternalLink, Heart } from 'lucide-react';

const FOOTER_SECTIONS = {
  navigation: {
    title: 'Navegación',
    links: [
      { label: 'Inicio', href: '/', external: false },
      { label: 'Nacionales', href: '/categoria/nacionales', external: false },
      { label: 'Internacionales', href: '/categoria/internacionales', external: false },
      { label: 'Sucesos', href: '/categoria/sucesos', external: false },
      { label: 'Deportes', href: '/categoria/deportes', external: false },
      { label: 'Tecnología', href: '/categoria/tecnologia', external: false },
    ]
  },
  company: {
    title: 'Nosotros',
    links: [
      { label: 'Quiénes Somos', href: '/nosotros', external: false },
      { label: 'Nuestro Equipo', href: '/equipo', external: false },
      { label: 'Contacto', href: '/contacto', external: false },
      { label: 'Publicidad', href: '/publicidad', external: false },
      { label: 'Trabaja con Nosotros', href: '/empleos', external: false },
    ]
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Política de Privacidad', href: '/privacidad', external: false },
      { label: 'Términos de Uso', href: '/terminos', external: false },
      { label: 'Política de Cookies', href: '/cookies', external: false },
      { label: 'Correcciones', href: '/correcciones', external: false },
      { label: 'Código de Ética', href: '/etica', external: false },
    ]
  },
  resources: {
    title: 'Recursos',
    links: [
      { label: 'RSS Feed', href: '/feed.xml', external: true },
      { label: 'Mapa del Sitio', href: '/mapa-del-sitio', external: false },
      { label: 'Archivo de Noticias', href: '/archivo', external: false },
      { label: 'Newsletter', href: '/newsletter', external: false },
      { label: 'API Pública', href: '/api-docs', external: true },
    ]
  }
};

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61578261125687',
    icon: '📘',
    color: '#1877f2'
  },
  {
    name: 'WhatsApp',
    href: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17',
    icon: '💬',
    color: '#25d366'
  },
  {
    name: 'Telegram',
    href: 'https://t.me/fHHjncJqMQM3NjZh',
    icon: '✈️',
    color: '#0088cc'
  }
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-main">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <Image
                src="/logo.png"
                alt="Nicaragua Informate"
                width={48}
                height={48}
                className="footer-logo-image"
              />
              <div className="footer-logo-text">
                <span className="footer-logo-title">Nicaragua Informate</span>
                <span className="footer-logo-tagline">Periodismo de Precisión</span>
              </div>
            </Link>

            <p className="footer-description">
              El portal de noticias más confiable de Nicaragua. Comprometidos con la verdad, 
              la transparencia y el periodismo de calidad desde 2020.
            </p>

            {/* Contact Info */}
            <div className="footer-contact">
              <div className="contact-item">
                <MapPin size={16} />
                <span>Managua, Nicaragua</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <a href="tel:+50588888888">+505 8888-8888</a>
              </div>
              <div className="contact-item">
                <Mail size={16} />
                <a href="mailto:contacto@nicaraguainformate.com">
                  contacto@nicaraguainformate.com
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div className="footer-social">
              <h4 className="social-title">Síguenos</h4>
              <div className="social-links">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    style={{ '--social-color': social.color } as React.CSSProperties}
                    aria-label={`Síguenos en ${social.name}`}
                  >
                    <span className="social-icon">{social.icon}</span>
                    <span className="social-name">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="footer-sections">
            {Object.entries(FOOTER_SECTIONS).map(([key, section]) => (
              <div key={key} className="footer-section">
                <h4 className="section-title">{section.title}</h4>
                <ul className="section-links">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="section-link external-link"
                        >
                          {link.label}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <Link href={link.href} className="section-link">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="footer-newsletter">
          <div className="newsletter-content">
            <h3 className="newsletter-title">Mantente Informado</h3>
            <p className="newsletter-description">
              Recibe las noticias más importantes de Nicaragua en tu correo electrónico.
            </p>
          </div>
          <form className="newsletter-form">
            <div className="newsletter-input-group">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                className="newsletter-input"
                required
              />
              <button type="submit" className="newsletter-button">
                Suscribirse
              </button>
            </div>
            <p className="newsletter-disclaimer">
              Al suscribirte, aceptas nuestra política de privacidad. 
              Puedes cancelar tu suscripción en cualquier momento.
            </p>
          </form>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>
                © {currentYear} Nicaragua Informate. Todos los derechos reservados.
              </p>
              <p className="made-with">
                Hecho con <Heart size={14} className="heart-icon" /> en Nicaragua
              </p>
            </div>

            <div className="footer-bottom-links">
              <Link href="/privacidad" className="bottom-link">
                Privacidad
              </Link>
              <Link href="/terminos" className="bottom-link">
                Términos
              </Link>
              <Link href="/cookies" className="bottom-link">
                Cookies
              </Link>
              <Link href="/mapa-del-sitio" className="bottom-link">
                Mapa del Sitio
              </Link>
            </div>
          </div>

          {/* Back to Top Button */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="back-to-top"
            aria-label="Volver arriba"
          >
            ↑
          </button>
        </div>
      </div>
    </footer>
  );
}