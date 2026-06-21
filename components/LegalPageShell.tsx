'use client';
import Link from 'next/link';
import Image from 'next/image';

const NAV_LINKS = [
  { label: 'Inicio', href: '/' },
  { label: 'Noticias', href: '/noticias' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'Radio', href: '/radio' },
];

const FOOTER_COLS = [
  { title: 'Secciones', links: [
    { label: 'Inicio', href: '/' },
    { label: 'Últimas Noticias', href: '/noticias' },
    { label: 'Nacionales', href: '/categoria/nacionales' },
    { label: 'Sucesos', href: '/categoria/sucesos' },
    { label: 'Espectáculos', href: '/categoria/espectaculos' },
    { label: 'Internacionales', href: '/categoria/internacionales' },
    { label: 'Tecnología', href: '/categoria/tecnologia' },
    { label: 'Deportes', href: '/categoria/deportes' },
  ]},
  { title: 'Legal', links: [
    { label: 'Sobre Nosotros', href: '/nosotros' },
    { label: 'Política de Privacidad', href: '/privacidad' },
    { label: 'Política de Cookies', href: '/cookies' },
    { label: 'Términos de Uso', href: '/terminos' },
    { label: 'Política Editorial', href: '/politica-editorial' },
    { label: 'Contacto', href: '/contacto' },
  ]},
  { title: 'Contacto', links: [
    { label: 'contacto@nicaraguainformate.com', href: 'mailto:contacto@nicaraguainformate.com' },
    { label: 'privacidad@nicaraguainformate.com', href: 'mailto:privacidad@nicaraguainformate.com' },
    { label: 'Managua, Nicaragua' },
  ]},
];

export default function LegalPageShell({ children, title }: { children: React.ReactNode; title: string }) {
  const currentYear = new Date().getFullYear();
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: '#f8fafc', minHeight: '100vh', color: '#1e293b', lineHeight: 1.7 }}>
      {/* Header claro consistente */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo.webp" alt="Nicaragua Informate" width={42} height={42} style={{ borderRadius: 6, objectFit: 'contain' }} />
            <span style={{ fontFamily: "'Merriweather', serif", fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>Nicaragua <span style={{ color: '#b07d3a' }}>Informate</span></span>
          </Link>
          <nav className="legal-nav-scroll"><ul style={{ display: 'flex', gap: '1.5rem', listStyle: 'none', margin: 0, padding: 0, whiteSpace: 'nowrap' }}>
            {NAV_LINKS.map((l) => (
              <li key={l.href}><Link href={l.href} style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>{l.label}</Link></li>
            ))}
          </ul></nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav aria-label="Miga de pan" style={{ maxWidth: 800, margin: '0 auto', padding: '20px 20px 0', fontSize: 13, color: '#94a3b8' }}>
        <Link href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Inicio</Link>
        <span style={{ margin: '0 8px', color: '#cbd5e1' }}>/</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>{title}</span>
      </nav>

      {/* Main */}
      <main style={{ padding: '2rem 0 3rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ fontFamily: "'Merriweather', serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, marginBottom: 12, color: '#0f172a' }}>{title}</h1>
          <div style={{ width: 60, height: 4, background: '#b07d3a', borderRadius: 2, marginBottom: 32 }} />
          <article style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '2rem 2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            {children}
          </article>
        </div>
      </main>

      {/* Footer claro */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '48px 0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 32 }}>
          <div>
            <h3 style={{ color: '#0f172a', fontWeight: 800, fontSize: 16, margin: '0 0 10px', fontFamily: "'Merriweather', serif" }}>Nicaragua Informate</h3>
            <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>Periodismo de precisión para Nicaragua y el mundo.</p>
          </div>
          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <h4 style={{ color: '#0f172a', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>{col.title}</h4>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.links.map((l) => {
                  if (!l.href) {
                    return <li key={l.label} style={{ color: '#94a3b8', fontSize: 13 }}>{l.label}</li>;
                  }
                  const isMail = l.href.startsWith('mailto:');
                  if (isMail) {
                    return (
                      <li key={l.label}>
                        <a href={l.href} style={{ color: '#64748b', textDecoration: 'none', fontSize: 13, transition: 'color 0.2s' }} className="footer-link-hover">{l.label}</a>
                      </li>
                    );
                  }
                  return (
                    <li key={l.label}>
                      <Link href={l.href} style={{ color: '#64748b', textDecoration: 'none', fontSize: 13, transition: 'color 0.2s' }} className="footer-link-hover">{l.label}</Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1200, margin: '32px auto 0', padding: '20px 20px 0', borderTop: '1px solid #f1f5f9', textAlign: 'center', color: '#94a3b8', fontSize: 12 }} suppressHydrationWarning>
          © 2025-{currentYear} Nicaragua Informate. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
