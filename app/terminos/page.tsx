import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos de Uso | Nicaragua Informate',
  description: 'Términos y condiciones de uso de Nicaragua Informate.',
  alternates: { canonical: 'https://nicaraguainformate.com/terminos' },
};

export default function TerminosPage() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', minHeight: '100vh', color: '#e2e8f0', lineHeight: 1.7 }}>
      <header style={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8c1d18', textDecoration: 'none' }}>Nicaragua <span style={{ color: '#fff' }}>Informate</span></Link>
          <nav><ul style={{ display: 'flex', gap: '2rem', listStyle: 'none', margin: 0, padding: 0 }}>
            <li><Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}>Inicio</Link></li>
            <li><Link href="/nosotros" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}>Nosotros</Link></li>
          </ul></nav>
        </div>
      </header>
      <main style={{ padding: '4rem 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, marginBottom: '1rem', background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Términos de Uso</h1>
          <p style={{ color: '#94a3b8', marginBottom: '3rem' }}>Por favor, lee cuidadosamente estos términos antes de usar nuestro sitio.</p>
          <article style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', padding: '3rem' }}>
            <div style={{ background: 'rgba(196,30,58,0.1)', border: '1px solid rgba(196,30,58,0.3)', borderRadius: '1rem', padding: '1.5rem', margin: '2rem 0' }}>
              <p style={{ margin: 0, color: '#fca5a5' }}>Al acceder y utilizar Nicaragua Informate, aceptas cumplir con estos términos y condiciones de uso.</p>
            </div>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2.5rem', marginBottom: '1rem' }}>1. Aceptación de los términos</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1.25rem' }}>El uso del sitio implica la aceptación plena de estas condiciones.</p>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2.5rem', marginBottom: '1rem' }}>2. Uso permitido del sitio</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1.25rem' }}>Puedes usar Nicaragua Informate para leer noticias y compartir artículos.</p>
            <p style={{ color: '#cbd5e1', marginBottom: '1.25rem' }}><strong>Queda prohibido:</strong></p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#cbd5e1' }}>
              <li style={{ marginBottom: '0.5rem' }}>Copiar o redistribuir contenido sin autorización</li>
              <li style={{ marginBottom: '0.5rem' }}>Usar el sitio para actividades ilegales</li>
              <li style={{ marginBottom: '0.5rem' }}>Intentar vulnerar la seguridad del sitio</li>
            </ul>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2.5rem', marginBottom: '1rem' }}>3. Propiedad intelectual</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1.25rem' }}>Todo el contenido está protegido por derechos de autor. No está permitida la reproducción total o parcial sin autorización.</p>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2.5rem', marginBottom: '1rem' }}>4. Limitación de responsabilidad</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1.25rem' }}>Nicaragua Informate no se hace responsable de daños derivados del uso del sitio.</p>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2.5rem', marginBottom: '1rem' }}>5. Contacto</h2>
            <p style={{ color: '#cbd5e1' }}><strong>Correo:</strong> <a href="mailto:keylingrivera20@gmail.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>keylingrivera20@gmail.com</a></p>
          </article>
        </div>
      </main>
      <footer style={{ background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '3rem 0 2rem', marginTop: '4rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>© 2025-2026 Nicaragua Informate. Todos los derechos reservados.</div>
      </footer>
    </div>
  );
}
