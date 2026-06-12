'use client';
import Link from 'next/link';
import Image from 'next/image';

type NavLink = { label: string; href: string };
type FooterLink = { label: string; href?: string; external?: boolean };

const LEGAL_LINKS: NavLink[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Noticias', href: '/noticias' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: '/contacto' },
];

const FOOTER_COLS: { title: string; links: FooterLink[] }[] = [
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
    { label: 'legal@nicaraguainformate.com', href: 'mailto:legal@nicaraguainformate.com' },
    { label: 'Managua, Nicaragua' },
  ]},
];

export default function LegalPageShell({ children, title }: { children: React.ReactNode; title: string }) {
  const currentYear = new Date().getFullYear();
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', minHeight: '100vh', color: '#e2e8f0', lineHeight: 1.7 }}>
      {/* Sticky header */}
      <header style={{ background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo-ni.png" alt="Nicaragua Informate" width={34} height={34} style={{ borderRadius: 8 }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8c1d18', lineHeight: 1 }}>Nicaragua <span style={{ color: '#fff' }}>Informate</span></span>
          </Link>
          <nav className="legal-nav-scroll"><ul style={{ display: 'flex', gap: '1.25rem', listStyle: 'none', margin: 0, padding: 0, whiteSpace: 'nowrap' }}>
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}><Link href={l.href} style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}>{l.label}</Link></li>
            ))}
          </ul></nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav aria-label="Miga de pan" style={{ maxWidth: 800, margin: '0 auto', padding: '16px 20px 0', fontSize: 13, color: '#94a3b8' }}>
        <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Inicio</Link>
        <span style={{ margin: '0 8px', color: '#475569' }}>/</span>
        <span style={{ color: '#cbd5e1' }}>{title}</span>
      </nav>

      {/* Main */}
      <main style={{ padding: '2rem 0 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, marginBottom: 12, background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{title}</h1>
          <div style={{ width: 60, height: 4, background: '#8c1d18', borderRadius: 2, marginBottom: 32 }} />
          <article style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', padding: '2.5rem' }}>
            {children}
          </article>
        </div>
      </main>

      {/* Full footer */}
      <footer style={{ background: 'rgba(15,23,42,0.97)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '48px 0 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 32 }}>
          {/* Brand */}
          <div>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: '0 0 10px' }}>Nicaragua Informate</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>Periodismo de precisión para Nicaragua y el mundo.</p>
          </div>
          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <h4 style={{ color: '#fff', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>{col.title}</h4>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.links.map((l) => {
                  if (!l.href) {
                    return <li key={l.label} style={{ color: '#94a3b8', fontSize: 13 }}>{l.label}</li>;
                  }

                  const isExternal = l.external || l.href.startsWith('http') || l.href.startsWith('mailto:');
                  const isMail = l.href.startsWith('mailto:');

                  if (isExternal && !isMail) {
                    return (
                      <li key={l.label}>
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}
                          className="footer-link-hover"
                        >
                          {l.label}
                        </a>
                      </li>
                    );
                  }

                  if (isMail) {
                    return (
                      <li key={l.label}>
                        <a href={l.href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }} className="footer-link-hover">
                          {l.label}
                        </a>
                      </li>
                    );
                  }

                  return (
                    <li key={l.label}>
                      <Link href={l.href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }} className="footer-link-hover">
                        {l.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1000, margin: '32px auto 0', padding: '20px 20px 0', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#475569', fontSize: 12 }} suppressHydrationWarning>
          © 2025-{currentYear} Nicaragua Informate. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
