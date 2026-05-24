// File: components/Footer.tsx
import Link from 'next/link';

const CATEGORIES = [
  { slug: 'sucesos', label: 'Sucesos' },
  { slug: 'nacionales', label: 'Nacionales' },
  { slug: 'espectaculos', label: 'Espectáculos' },
  { slug: 'deportes', label: 'Deportes' },
  { slug: 'tecnologia', label: 'Tecnología' },
  { slug: 'internacionales', label: 'Internacionales' },
];

const RADIOS = [
  { name: 'Radio Ya', url: 'https://www.radioya.com.ni/' },
  { name: 'Viva FM', url: 'https://www.vivafm.com.ni/' },
  { name: 'Fiesta Latina', url: 'https://fiestalatina.com.ni/' },
  { name: 'Radio Juvenil', url: 'https://radiojuvenil.com.ni/' },
  { name: 'Radio Nicaragua', url: 'https://www.radionicaragua.com/' },
  { name: 'Radio Futura', url: 'https://radiofutura.net/' },
  { name: 'La Tuani', url: 'https://www.latuani.com/' },
  { name: 'Radio Amor', url: 'https://radioamor.com.ni/' },
  { name: 'Radio Tigre', url: 'https://radiotigre.com.ni/' },
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

          {/* Columna 2: Sobre nosotros + Legal */}
          <div>
            <h3 className="footer-section-title">Sobre nosotros</h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '16px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Portal de noticias dedicado a informar con precisión y profesionalismo sobre los hechos más relevantes de Nicaragua y el mundo.
            </p>
            <nav className="footer-links" aria-label="Información sobre nosotros">
              <Link href="/nosotros">Quiénes somos</Link>
              <Link href="/politica-editorial">Política editorial</Link>
              <Link href="/correcciones">Correcciones</Link>
              <Link href="/mapa-del-sitio">Mapa del sitio</Link>
            </nav>
          </div>

          {/* Columna 3: Redes sociales */}
          <div>
            <h3 className="footer-section-title">Síguenos</h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '16px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Mantente informado a través de nuestros canales oficiales.
            </p>
            <nav className="footer-social-nav" aria-label="Redes sociales">
              <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer" aria-label="Síguenos en Facebook" className="footer-social-link" title="Facebook">
                <span aria-hidden="true" style={{ fontWeight: 700 }}>f</span>
              </a>
              <a href="https://wa.me/505" target="_blank" rel="noopener noreferrer" aria-label="Síguenos en WhatsApp" className="footer-social-link" title="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              <a href="https://t.me/nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="Síguenos en Telegram" className="footer-social-link" title="Telegram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
            </nav>
          </div>

          {/* Columna 4: Radio Nicaragua */}
          <div>
            <h3 className="footer-section-title">Radio Nicaragua</h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '16px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Escucha las radios más populares del país.
            </p>
            <nav className="footer-links" aria-label="Radios de Nicaragua">
              {RADIOS.map((radio) => (
                <a key={radio.name} href={radio.url} target="_blank" rel="noopener noreferrer" title={radio.name}>
                  {radio.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Barra inferior: legal */}
      <div className="footer-divider" />

      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '0 24px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px 24px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
        <Link href="/contacto" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Contacto</Link>
        <a href="mailto:info@nicaraguainformate.com" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>info@nicaraguainformate.com</a>
        <Link href="/privacidad" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Privacidad</Link>
        <Link href="/terminos" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Términos</Link>
        <Link href="/cookies" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Cookies</Link>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.dispatchEvent(new Event('ni-open-cookie-settings'));
          }}
          style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', cursor: 'pointer' }}
        >
          Configurar cookies
        </a>
      </div>

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
