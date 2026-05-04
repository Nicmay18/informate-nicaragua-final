import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Nicaragua Informate',
  description: 'Política de privacidad de Nicaragua Informate — Cómo protegemos tu información.',
  alternates: { canonical: 'https://nicaraguainformate.com/privacidad' },
};

export default function PrivacidadPage() {
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
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, marginBottom: '1rem', background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Política de Privacidad</h1>
          <p style={{ color: '#94a3b8', marginBottom: '3rem' }}>Tu privacidad es importante para nosotros.</p>
          <article style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', padding: '3rem' }}>
            <div style={{ background: 'rgba(96,165,250,0.1)', borderLeft: '4px solid #60a5fa', padding: '1rem 1.5rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
              <strong>Última actualización:</strong> 30 de marzo de 2026
            </div>
            <p style={{ color: '#cbd5e1', marginBottom: '1.25rem' }}>En <strong>Nicaragua Informate</strong> valoramos y respetamos tu privacidad.</p>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2.5rem', marginBottom: '1rem' }}>1. Información que recopilamos</h2>
            <h3 style={{ fontSize: '1.1rem', color: '#e2e8f0', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Información anónima automática</h3>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#cbd5e1' }}>
              <li style={{ marginBottom: '0.5rem' }}>Dirección IP (anonimizada)</li>
              <li style={{ marginBottom: '0.5rem' }}>Tipo de dispositivo y navegador</li>
              <li style={{ marginBottom: '0.5rem' }}>Páginas visitadas y tiempo de navegación</li>
            </ul>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2.5rem', marginBottom: '1rem' }}>2. Cookies y tecnologías de seguimiento</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1.25rem' }}>Utilizamos Google Analytics y Google AdSense. Puedes gestionar tus preferencias en <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>adssettings.google.com</a>.</p>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2.5rem', marginBottom: '1rem' }}>3. Uso de la información</h2>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#cbd5e1' }}>
              <li style={{ marginBottom: '0.5rem' }}>Enviarte noticias relevantes</li>
              <li style={{ marginBottom: '0.5rem' }}>Mejorar nuestros servicios</li>
              <li style={{ marginBottom: '0.5rem' }}>Analizar el tráfico del sitio</li>
            </ul>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2.5rem', marginBottom: '1rem' }}>4. Tus derechos</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1.25rem' }}>Tienes derecho a acceder, corregir o eliminar tus datos personales.</p>
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
