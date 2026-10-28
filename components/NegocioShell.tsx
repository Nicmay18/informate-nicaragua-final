import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Envoltorio de las páginas públicas del directorio.
 * El Header/Footer global ya viene del layout raíz: este componente solo
 * aporta miga de pan, título y tarjeta de contenido.
 */
export default function NegocioShell({ title, children }:
  { title: string; children: ReactNode }) {
  return (
    <div style={{ background: '#f8fafc', color: '#1e293b', lineHeight: 1.7, overflowWrap: 'anywhere',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <nav aria-label="Miga de pan" style={{ maxWidth: 800, margin: '0 auto', padding: '20px 20px 0', fontSize: 13, color: '#94a3b8' }}>
        <Link href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Inicio</Link>
        <span style={{ margin: '0 8px', color: '#cbd5e1' }}>/</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>{title}</span>
      </nav>
      <div style={{ padding: '2rem 0 3rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ fontFamily: "'Merriweather', serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, marginBottom: 12, color: '#0f172a' }}>{title}</h1>
          <div style={{ width: 60, height: 4, background: '#b07d3a', borderRadius: 2, marginBottom: 32 }} />
          <article style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 'clamp(16px, 4vw, 32px)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
