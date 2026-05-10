import Link from 'next/link';
import BrandIcon from '@/components/BrandIcon';
import { CATEGORIES } from '@/lib/types';

const SOCIAL_URLS = {
  facebook: 'https://facebook.com/profile.php?id=61578261125687',
  whatsapp: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17',
  telegram: 'https://t.me/+fHHjncJqMQM3NjZh',
  rss: '/feed.xml',
} as const;

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Brand */}
        <div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-merri)', fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 12, display: 'inline-block' }}>
              Nicaragua <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Informate</span>
            </div>
          </Link>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 300 }}>
            Cubriendo las noticias más importantes de Nicaragua al instante, con compromiso y rigor informativo.
          </p>
        </div>

        {/* Secciones */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, color: 'rgba(255,255,255,0.9)' }}>Secciones</h4>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {CATEGORIES.map((cat) => (
              <li key={cat.name} style={{ marginBottom: 10 }}>
                <Link href={`/noticias?cat=${encodeURIComponent(cat.name)}`} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}>
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, color: 'rgba(255,255,255,0.9)' }}>Legal</h4>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {[
              { href: '/nosotros', label: 'Sobre Nosotros' },
              { href: '/privacidad', label: 'Privacidad' },
              { href: '/cookies', label: 'Cookies' },
              { href: '/terminos', label: 'Términos de Uso' },
            ].map(({ href, label }) => (
              <li key={href} style={{ marginBottom: 10 }}>
                <Link href={href} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, color: 'rgba(255,255,255,0.9)' }}>Contacto</h4>
          <p style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
            <span>📍</span> Estelí, Nicaragua
          </p>
          <a href="mailto:redaccion@nicaraguainformate.com" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
            <span>✉️</span> redaccion@nicaraguainformate.com
          </a>
          <Link href="/contacto" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
            <span>📝</span> Formulario de contacto
          </Link>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <a href={SOCIAL_URLS.facebook} target="_blank" rel="noopener" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }} aria-label="Facebook">
              <BrandIcon name="facebook-f" size={13} />
            </a>
            <a href={SOCIAL_URLS.whatsapp} target="_blank" rel="noopener" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }} aria-label="WhatsApp">
              <BrandIcon name="whatsapp" size={13} />
            </a>
            <a href={SOCIAL_URLS.telegram} target="_blank" rel="noopener" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }} aria-label="Telegram">
              <BrandIcon name="telegram" size={13} />
            </a>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '32px auto 0', padding: '20px 24px 0', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
        <p suppressHydrationWarning>© {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados.</p>
        <p>Periodismo verificado desde Estelí, Nicaragua</p>
      </div>
    </footer>
  );
}
