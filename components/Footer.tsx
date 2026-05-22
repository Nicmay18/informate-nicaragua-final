// File: components/Footer.tsx
import Link from 'next/link';
import { Globe, Share2, Camera, Rss } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-grid">
          {/* Sobre nosotros */}
          <div>
            <h3 className="footer-section-title">Sobre Nicaragua Informate</h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: 'var(--spacing-md)', color: 'rgba(255, 255, 255, 0.7)' }}>
              Portal de noticias independiente dedicado a informar sobre los hechos más relevantes de Nicaragua, Centroamérica y el mundo.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="footer-social-link">
                <Globe size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="footer-social-link">
                <Share2 size={18} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-social-link">
                <Camera size={18} />
              </a>
              <a href="/feed.xml" target="_blank" rel="noopener noreferrer" aria-label="RSS Feed" className="footer-social-link">
                <Rss size={18} />
              </a>
            </div>
          </div>

          {/* Categorías */}
          <div>
            <h3 className="footer-section-title">Categorías</h3>
            <nav className="footer-links">
              <Link href="/categoria/sucesos">Sucesos</Link>
              <Link href="/categoria/nacionales">Nacionales</Link>
              <Link href="/categoria/deportes">Deportes</Link>
              <Link href="/categoria/tecnologia">Tecnología</Link>
              <Link href="/categoria/espectaculos">Espectáculos</Link>
              <Link href="/noticias">Todas las noticias</Link>
            </nav>
          </div>

          {/* Páginas legales */}
          <div>
            <h3 className="footer-section-title">Legal</h3>
            <nav className="footer-links">
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/terminos">Términos de uso</Link>
              <Link href="/politica-editorial">Política editorial</Link>
              <Link href="/cookies">Cookies</Link>
              <Link href="/contacto">Contacto</Link>
            </nav>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="footer-section-title">Empresa</h3>
            <nav className="footer-links">
              <Link href="/nosotros">Nosotros</Link>
              <Link href="/mapa-del-sitio">Mapa del sitio</Link>
              <Link href="/contacto">Contacto</Link>
              <a href="mailto:info@nicaraguainformate.com">info@nicaraguainformate.com</a>
            </nav>
          </div>
        </div>
      </div>

      <div className="footer-divider" />

      <div className="footer-bottom">
        <p className="footer-copyright">
          © {currentYear} Nicaragua Informate. Todos los derechos reservados.
        </p>
        <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
          Hecho con ❤️ desde Nicaragua
        </p>
      </div>
    </footer>
  );
}
