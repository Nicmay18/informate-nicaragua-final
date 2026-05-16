import Link from 'next/link';
import { CATEGORIES } from '@/lib/types';

export default function SiteFooter() {
  return (
    <footer style={{ background: '#1a1a2e', color: '#fff', padding: '48px 0 24px', marginTop: 48 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: 40 }}>
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
            <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, color: 'rgba(255,255,255,0.9)' }}>Secciones</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {CATEGORIES.map((cat) => (
                <li key={cat.name} style={{ marginBottom: 10 }}>
                  <a href={`/?cat=${encodeURIComponent(cat.name)}`} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}>
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, color: 'rgba(255,255,255,0.9)' }}>Legal</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {[
                { href: '/nosotros', label: 'Sobre Nosotros' },
                { href: '/privacidad', label: 'Privacidad' },
                { href: '/cookies', label: 'Cookies' },
                { href: '/terminos', label: 'Términos de Uso' },
              ].map(({ href, label }) => (
                <li key={href} style={{ marginBottom: 10 }}>
                  <a href={href} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, color: 'rgba(255,255,255,0.9)' }}>Contacto</h2>
            <p style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
              <span>📍</span> Managua, Nicaragua
            </p>
            <a href="mailto:contacto@nicaraguainformate.com" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              <span>✉️</span> contacto@nicaraguainformate.com
            </a>
            <Link href="/contacto" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              <span>📝</span> Formulario de contacto
            </Link>
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: '32px auto 0', padding: '20px 0 0', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          <p>© 2026 Nicaragua Informate. Todos los derechos reservados.</p>
          <p>Periodismo verificado desde Managua, Nicaragua</p>
        </div>
      </div>

    </footer>
  );
}
