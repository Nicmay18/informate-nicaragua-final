import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | Nicaragua Informate',
  description: 'Conoce a Nicaragua Informate, portal de noticias digital de Nicaragua.',
  alternates: { canonical: 'https://nicaraguainformate.com/nosotros' },
};

export default function NosotrosPage() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh', color: '#e2e8f0', lineHeight: 1.7 }}>
      <header style={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8c1d18', textDecoration: 'none' }}>
            Nicaragua <span style={{ color: '#fff' }}>Informate</span>
          </Link>
          <nav><ul style={{ display: 'flex', gap: '2rem', listStyle: 'none', margin: 0, padding: 0 }}>
            <li><Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}>Inicio</Link></li>
            <li><Link href="/nosotros" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Nosotros</Link></li>
          </ul></nav>
        </div>
      </header>
      <main style={{ padding: '4rem 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, marginBottom: '1rem', background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Sobre Nicaragua Informate
          </h1>
          <article style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', padding: '3rem' }}>
            <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.8 }}>
              Nicaragua Informate es un portal de noticias digital dedicado a ofrecer información verificada, precisa y oportuna sobre los acontecimientos más importantes en Nicaragua y el mundo.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.5rem', margin: '2rem 0' }}>
              {[{ icon: 'fa-bullseye', title: 'Misión', desc: 'Brindar información verificada y contextualizada que contribuya a la formación de ciudadanos informados' },
                { icon: 'fa-eye', title: 'Visión', desc: 'Consolidarnos como fuente de consulta confiable para la población nicaragüense' },
                { icon: 'fa-handshake', title: 'Valores', desc: 'Veracidad, precisión, responsabilidad y ética periodística' }].map((v) => (
                <div key={v.title} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1.5rem', textAlign: 'center' }}>
                  <i className={`fas ${v.icon}`} style={{ fontSize: '2rem', color: '#8c1d18', marginBottom: '1rem', display: 'block' }} />
                  <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>{v.title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>{v.desc}</p>
                </div>
              ))}
            </div>
            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginTop: '2.5rem', marginBottom: '1rem' }}>Qué hacemos</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1.25rem' }}>Publicamos noticias verificadas de actualidad permanente en las áreas de sucesos, política nacional, economía, deportes, cultura, tecnología, espectáculos e internacionales.</p>
            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginTop: '2.5rem', marginBottom: '1rem' }}>Equipo Editorial</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1.25rem' }}>Somos un equipo de periodistas y comunicadores con sede en Masaya, Nicaragua.</p>
            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginTop: '2.5rem', marginBottom: '1rem' }}>Contacto</h2>
            <p style={{ color: '#cbd5e1' }}>Escríbenos a: <a href="mailto:keylingrivera20@gmail.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>keylingrivera20@gmail.com</a></p>
          </article>
        </div>
      </main>
      <footer style={{ background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '3rem 0 2rem', marginTop: '4rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
          © 2025-2026 Nicaragua Informate. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
