import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';
import { Home, Newspaper, Flag, AlertTriangle, Trophy, Globe, Film, Laptop, FileText, Shield, Mail, Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mapa del Sitio | Nicaragua Informate',
  description: 'Explora todas las secciones y páginas de Nicaragua Informate. Noticias, categorías, legal y contacto.',
  alternates: { canonical: 'https://www.nicaraguainformate.com/mapa-del-sitio' },
};

const SECTIONS = [
  {
    title: 'Inicio',
    links: [
      { href: '/', label: 'Página principal', icon: <Home size={14} /> },
      { href: '/noticias', label: 'Todas las noticias', icon: <Newspaper size={14} /> },
    ],
  },
  {
    title: 'Categorías',
    links: [
      { href: '/categoria/nacionales', label: 'Nacionales', icon: <Flag size={14} /> },
      { href: '/categoria/sucesos', label: 'Sucesos', icon: <AlertTriangle size={14} /> },
      { href: '/categoria/deportes', label: 'Deportes', icon: <Trophy size={14} /> },
      { href: '/categoria/internacionales', label: 'Internacionales', icon: <Globe size={14} /> },
      { href: '/categoria/espectaculos', label: 'Espectáculos', icon: <Film size={14} /> },
      { href: '/categoria/tecnologia', label: 'Tecnología', icon: <Laptop size={14} /> },
    ],
  },
  {
    title: 'Legal e Información',
    links: [
      { href: '/nosotros', label: 'Sobre Nosotros', icon: <Info size={14} /> },
      { href: '/privacidad', label: 'Política de Privacidad', icon: <Shield size={14} /> },
      { href: '/terminos', label: 'Términos y Condiciones', icon: <FileText size={14} /> },
      { href: '/cookies', label: 'Política de Cookies', icon: <FileText size={14} /> },
    ],
  },
  {
    title: 'Contacto',
    links: [
      { href: '/contacto', label: 'Contacto y Formulario', icon: <Mail size={14} /> },
    ],
  },
];

export default function SitemapPage() {
  return (
    <LegalPageShell title="Mapa del Sitio">
      <p style={{ color: '#cbd5e1', marginBottom: '2rem', lineHeight: 1.7, fontSize: '0.95rem' }}>
        Encuentra rápidamente todas las secciones y páginas disponibles en Nicaragua Informate.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: '1.25rem',
            }}
          >
            <h2 style={{ fontSize: '1rem', color: '#fff', fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {section.title}
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: '#94a3b8',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      padding: '6px 8px',
                      borderRadius: 6,
                      transition: 'all 0.2s',
                    }}
                    className="sitemap-link"
                  >
                    <span style={{ color: '#8c1d18' }}>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <style>{`
        .sitemap-link:hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }
      `}</style>
    </LegalPageShell>
  );
}
