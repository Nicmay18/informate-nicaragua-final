import Link from 'next/link';
import Image from 'next/image';

/**
 * URLs de redes sociales
 */
const SOCIAL_URLS = {
  facebook: 'https://facebook.com/profile.php?id=61578261125687',
  whatsapp: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17',
  telegram: 'https://t.me/+fHHjncJqMQM3NjZh',
  rss: '/feed.xml',
} as const;

/**
 * Componente de footer del sitio
 * @returns Footer con navegación y links sociales
 */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer-pro" role="contentinfo">
      <div className="footer-nav">
        <ul className="footer-links-row">
          <li><Link href="/">Inicio</Link></li>
          <li><Link href="/nosotros">Nosotros</Link></li>
          <li><Link href="/privacidad">Privacidad</Link></li>
          <li><Link href="/terminos">Términos</Link></li>
          <li><Link href="/contacto">Contacto</Link></li>
          <li><a href="/feed.xml" target="_blank" rel="noopener">RSS</a></li>
          <li><Link href="/sitemap.xml">Sitemap</Link></li>
        </ul>
      </div>
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Image src="/logo.png" alt="Nicaragua Informate" className="footer-logo-img" width={56} height={56} />
              <p className="footer-title">Nicaragua Informate</p>
              <p className="footer-desc">
                Periodismo de Precisión. Noticias de Nicaragua al instante: Sucesos, Nacionales,
                Deportes, Internacionales y Espectáculos.
              </p>
              <div className="footer-social">
                <a href={SOCIAL_URLS.facebook} target="_blank" rel="noopener" aria-label="Facebook">
                  <i className="fab fa-facebook-f" />
                </a>
                <a href={SOCIAL_URLS.whatsapp} target="_blank" rel="noopener" aria-label="WhatsApp">
                  <i className="fab fa-whatsapp" />
                </a>
                <a href={SOCIAL_URLS.telegram} target="_blank" rel="noopener" aria-label="Telegram">
                  <i className="fab fa-telegram-plane" />
                </a>
                <a href={SOCIAL_URLS.rss} target="_blank" rel="noopener" aria-label="RSS">
                  <i className="fas fa-rss" />
                </a>
              </div>
            </div>
            <div className="footer-sections">
              <div className="footer-col">
                <h4>Secciones</h4>
                <ul>
                  <li><Link href="/?cat=Sucesos">Sucesos</Link></li>
                  <li><Link href="/?cat=Nacionales">Nacionales</Link></li>
                  <li><Link href="/?cat=Deportes">Deportes</Link></li>
                  <li><Link href="/?cat=Internacionales">Internacionales</Link></li>
                  <li><Link href="/?cat=Espect%C3%A1culos">Espectáculos</Link></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Nosotros</h4>
                <ul>
                  <li><Link href="/nosotros">¿Quiénes somos?</Link></li>
                  <li><Link href="/contacto">Contacto</Link></li>
                  <li><Link href="/privacidad">Política de Privacidad</Link></li>
                  <li><Link href="/terminos">Términos de Uso</Link></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Más</h4>
                <ul>
                  <li><a href={SOCIAL_URLS.rss} target="_blank" rel="noopener">Feed RSS</a></li>
                  <li><a href={SOCIAL_URLS.whatsapp} target="_blank" rel="noopener">Canal WhatsApp</a></li>
                  <li><a href={SOCIAL_URLS.telegram} target="_blank" rel="noopener">Canal Telegram</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom-bar">
        <div className="container">
          <div className="footer-bottom-content">
            <p className="copyright" suppressHydrationWarning>
              &copy; {year} <strong>Nicaragua Informate</strong>. Todos los derechos reservados.
            </p>
            <div className="footer-bottom-links">
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/terminos">Términos</Link>
              <Link href="/contacto">Contacto</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
