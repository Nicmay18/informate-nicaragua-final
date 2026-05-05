import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Página no encontrada | Nicaragua Informate',
  description: 'La página que buscas no existe o ha sido movida.',
};

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 80, fontWeight: 900, color: '#8c1d18', lineHeight: 1, marginBottom: 8 }}>404</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>Página no encontrada</h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
          La página que buscas no existe, fue eliminada o la dirección es incorrecta. Te invitamos a explorar nuestras últimas noticias.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#8c1d18', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            <i className="fas fa-home" /> Ir al inicio
          </Link>
          <Link href="/noticias" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', border: '1px solid var(--border-light)', color: 'var(--ink)', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            <i className="fas fa-newspaper" /> Ver noticias
          </Link>
        </div>
        <div style={{ marginTop: 40, padding: '16px 0', borderTop: '1px solid var(--border-light)', fontSize: 12, color: 'var(--ink-faint)' }}>
          <Link href="/contacto" style={{ color: '#8c1d18', textDecoration: 'none', fontWeight: 600 }}>Contacto</Link>
          {' · '}
          <Link href="/nosotros" style={{ color: '#8c1d18', textDecoration: 'none', fontWeight: 600 }}>Sobre nosotros</Link>
          {' · '}
          <Link href="/politica-editorial" style={{ color: '#8c1d18', textDecoration: 'none', fontWeight: 600 }}>Política editorial</Link>
        </div>
      </div>
    </div>
  );
}
