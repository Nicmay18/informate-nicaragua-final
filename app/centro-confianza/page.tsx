import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Users, RefreshCw, Mail, Scale, Search } from 'lucide-react';
import { getCspNonce } from '@/lib/nonce';

const TRUST_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: 'Nicaragua Informate',
  url: 'https://nicaraguainformate.com',
  logo: 'https://nicaraguainformate.com/logo.webp',
  sameAs: ['https://www.facebook.com/profile.php?id=61578261125687'],
  ethicsPolicy: 'https://nicaraguainformate.com/politica-editorial',
  correctionsPolicy: 'https://nicaraguainformate.com/correcciones',
  about: 'https://nicaraguainformate.com/nosotros',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'contacto@nicaraguainformate.com',
    contactType: 'Editorial',
  },
};

export const metadata: Metadata = {
  title: { absolute: 'Centro de Confianza | Nicaragua Informate' },
  description: 'Conozca quiénes somos, cómo verificamos, nuestra metodología y cómo corregimos. Transparencia editorial de Nicaragua Informate.',
  alternates: { canonical: 'https://nicaraguainformate.com/centro-confianza' },
};

const PAGES = [
  { href: '/nosotros', icon: <Users size={22} />, title: 'Quiénes somos', desc: 'Equipo, misión y visión del medio.' },
  { href: '/autores', icon: <Shield size={22} />, title: 'Equipo editorial', desc: 'Perfiles públicos de autores y editores.' },
  { href: '/metodologia-editorial', icon: <Search size={22} />, title: 'Metodología', desc: 'Cómo investigamos, verificamos y publicamos.' },
  { href: '/politica-editorial', icon: <Scale size={22} />, title: 'Política editorial', desc: 'Independencia, criterios y separación publicitaria.' },
  { href: '/correcciones', icon: <RefreshCw size={22} />, title: 'Correcciones', desc: 'Errores detectados, errores corregidos.' },
  { href: '/contacto', icon: <Mail size={22} />, title: 'Contacto editorial', desc: 'Canales para consultas y reportes.' },
];

export default async function CentroConfianzaPage() {
  const nonce = await getCspNonce();
  return (
    <main className="article-page" style={{ paddingTop: 40 }}>
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(TRUST_SCHEMA) }} />
      <nav className="ni-breadcrumbs" aria-label="Miga de pan" style={{ maxWidth: 900, margin: '0 auto', padding: '16px 20px 0' }}>
        <Link href="/">Inicio</Link>
        <span className="ni-breadcrumbs__sep">/</span>
        <span>Centro de Confianza</span>
      </nav>

      <section className="article-hero" style={{ height: 'auto', minHeight: 220 }}>
        <div style={{ background: 'var(--primary)', position: 'absolute', inset: 0 }} />
        <div className="article-hero-content" style={{ position: 'relative' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: 12, color: 'white' }}>
            Centro de Confianza
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: 640 }}>
            Transparencia, verificación y autoridad editorial. Todo lo que necesitas saber para confiar en nuestro contenido.
          </p>
        </div>
      </section>

      <div className="article-content-wrapper">
        <p className="article-body" style={{ marginBottom: 32 }}>
          <strong>Nicaragua Informate</strong> opera bajo principios de veracidad, independencia y rendición de cuentas. En este centro centralizamos las señales de autoridad y confianza del medio.
        </p>

        <div className="article-related-grid" style={{ marginBottom: 48 }}>
          {PAGES.map((p) => (
            <Link key={p.href} href={p.href} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="sidebar-widget" style={{ height: '100%' }}>
                <div style={{ color: 'var(--accent)', marginBottom: 10 }}>{p.icon}</div>
                <h3 style={{ color: 'var(--text)', marginBottom: 6, fontSize: '1.05rem', fontWeight: 700 }}>{p.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>{p.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <h2 className="article-summary-title" style={{ marginBottom: 16 }}>Compromisos públicos</h2>
        <ul className="article-body" style={{ marginBottom: 32, paddingLeft: 24, listStyleType: 'disc' }}>
          <li><strong>Verificación:</strong> contrastamos la información con al menos dos fuentes antes de publicar.</li>
          <li><strong>Correcciones:</strong> corregimos errores y los publicamos visiblemente.</li>
          <li><strong>Independencia:</strong> editorial libre de presiones políticas y comerciales.</li>
          <li><strong>Autores identificados:</strong> cada noticia cuenta con un autor verificable.</li>
          <li><strong>Datos reales:</strong> nuestras estadísticas y audiencia son auditables.</li>
        </ul>
      </div>
    </main>
  );
}
