import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | Nicaragua Informate',
  description: 'Conoce a Nicaragua Informate, portal de noticias digital de Nicaragua.',
  alternates: { canonical: 'https://nicaraguainformate.com/nosotros' },
};

export default function NosotrosPage() {
  return (
    <LegalPageShell title="Sobre Nicaragua Informate">
      <p style={{ fontSize: '1.15rem', color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.8 }}>
        Nicaragua Informate es un portal de noticias digital dedicado a ofrecer información verificada, precisa y oportuna sobre los acontecimientos más importantes en Nicaragua y el mundo.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem', margin: '2rem 0' }}>
        {[{ icon: 'fa-bullseye', title: 'Misión', desc: 'Brindar información verificada y contextualizada que contribuya a la formación de ciudadanos informados.' },
          { icon: 'fa-eye', title: 'Visión', desc: 'Consolidarnos como fuente de consulta confiable para la población nicaragüense y la diáspora.' },
          { icon: 'fa-handshake', title: 'Valores', desc: 'Veracidad, precisión, responsabilidad, ética periodística e independencia editorial.' }].map((v) => (
          <div key={v.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center' }}>
            <i className={`fas ${v.icon}`} style={{ fontSize: '1.5rem', color: '#8c1d18', marginBottom: '0.75rem', display: 'block' }} />
            <h3 style={{ color: '#fff', marginBottom: '0.4rem', fontSize: '1.05rem' }}>{v.title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.55 }}>{v.desc}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem' }}>Qué hacemos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem' }}>Publicamos noticias verificadas de actualidad permanente en las áreas de sucesos, política nacional, economía, deportes, cultura, tecnología, espectáculos e internacionales. Nuestro contenido se distribuye de forma gratuita a través de nuestro sitio web y canales digitales oficiales.</p>

      <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2rem', marginBottom: '0.75rem' }}>Equipo Editorial</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem' }}>Somos un equipo de periodistas y comunicadores con sede en Masaya, Nicaragua. Nuestra redacción trabaja con rigor periodístico para garantizar la veracidad de cada publicación.</p>

      <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2rem', marginBottom: '0.75rem' }}>Dirección</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem' }}>Masaya, Nicaragua · Centroamérica</p>

      <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2rem', marginBottom: '0.75rem' }}>Contacto</h2>
      <p style={{ color: '#cbd5e1' }}>
        Escríbenos a:{' '}
        <a href="mailto:redaccion@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>redaccion@nicaraguainformate.com</a>
        <br />
        También puedes usar nuestro{' '}
        <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a>.
      </p>
    </LegalPageShell>
  );
}
