// File: components/Footer.tsx
import Link from 'next/link';
import { Rss } from 'lucide-react';

const CATEGORIES = [
  { slug: 'sucesos', label: 'Sucesos' },
  { slug: 'nacionales', label: 'Nacionales' },
  { slug: 'espectaculos', label: 'Espectáculos' },
  { slug: 'deportes', label: 'Deportes' },
  { slug: 'tecnologia', label: 'Tecnología' },
  { slug: 'internacionales', label: 'Internacionales' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo" aria-label="Pie de página de Nicaragua Informate">
      <div className="footer-content">
        <div className="footer-grid">
          {/* Columna 1: Categorías */}
          <div>
            <h3 className="footer-section-title">Categorías</h3>
            <nav className="footer-links" aria-label="Categorías de noticias">
              {CATEGORIES.map((cat) => (
                <Link key={cat.slug} href={`/categoria/${cat.slug}`}>{cat.label}</Link>
              ))}
              <Link href="/noticias">Todas las noticias</Link>
            </nav>
          </div>

          {/* Columna 2: Sobre nosotros */}
          <div>
            <h3 className="footer-section-title">Sobre nosotros</h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '16px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Portal de noticias independiente dedicado a informar sobre los hechos más relevantes de Nicaragua, Centroamérica y el mundo.
            </p>
            <nav className="footer-links" aria-label="Información sobre nosotros">
              <Link href="/nosotros">Quiénes somos</Link>
              <Link href="/politica-editorial">Política editorial</Link>
              <Link href="/mapa-del-sitio">Mapa del sitio</Link>
            </nav>
          </div>

          {/* Columna 3: Contacto */}
          <div>
            <h3 className="footer-section-title">Contacto</h3>
            <nav className="footer-links" aria-label="Contacto y legal">
              <Link href="/contacto">Escríbenos</Link>
              <a href="mailto:info@nicaraguainformate.com">info@nicaraguainformate.com</a>
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/terminos">Términos de uso</Link>
              <Link href="/cookies">Cookies</Link>
            </nav>
          </div>

          {/* Columna 4: Redes sociales */}
          <div>
            <h3 className="footer-section-title">Síguenos</h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '16px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Mantente informado a través de nuestras redes sociales.
            </p>
            <nav className="footer-social-nav" aria-label="Redes sociales">
              <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer" aria-label="Síguenos en Facebook" className="footer-social-link">
                <span aria-hidden="true">f</span>
              </a>
              <a href="https://x.com/nicinformate" target="_blank" rel="noopener noreferrer" aria-label="Síguenos en X (Twitter)" className="footer-social-link">
                <span aria-hidden="true">𝕏</span>
              </a>
              <a href="https://instagram.com/nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="Síguenos en Instagram" className="footer-social-link">
                <span aria-hidden="true">📷</span>
              </a>
              <a href="/feed.xml" target="_blank" rel="noopener noreferrer" aria-label="RSS Feed de Nicaragua Informate" className="footer-social-link">
                <Rss size={16} aria-hidden="true" />
              </a>
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
