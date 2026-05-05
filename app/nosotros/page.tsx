import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | Nicaragua Informate',
  description: 'Conoce al equipo detrás de Nicaragua Informate. Periodismo de precisión desde Masaya, Nicaragua.',
  alternates: { canonical: 'https://nicaraguainformate.com/nosotros' },
};

export default function NosotrosPage() {
  return (
    <LegalPageShell title="Sobre Nicaragua Informate">
      <p style={{ fontSize: '1.15rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.8 }}>
        Nicaragua Informate es un medio de comunicación digital fundado en 2025, dedicado a ofrecer cobertura periodística rigurosa, verificada e independiente sobre los acontecimientos más relevantes de Nicaragua y la región centroamericana.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '2rem', lineHeight: 1.7 }}>
        Operamos desde Masaya, Nicaragua, y nuestro compromiso es con la verdad, la transparencia y el derecho de los ciudadanos a estar bien informados. Publicamos contenido original las 24 horas del día, los 7 días de la semana, cubriendo las áreas de sucesos, política nacional, economía, deportes, cultura, tecnología, espectáculos e internacionales.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem', margin: '0 0 2.5rem' }}>
        {[{ icon: 'fa-bullseye', title: 'Misión', desc: 'Brindar información verificada, contextualizada y oportuna que contribuya a la formación de ciudadanos informados y al fortalecimiento de la democracia.' },
          { icon: 'fa-eye', title: 'Visión', desc: 'Consolidarnos como la fuente de noticias más confiable para la población nicaragüense en el país y la diáspora.' },
          { icon: 'fa-handshake', title: 'Valores', desc: 'Veracidad, precisión, responsabilidad social, ética periodística, independencia editorial y respeto a la dignidad humana.' }].map((v) => (
          <div key={v.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center' }}>
            <i className={`fas ${v.icon}`} style={{ fontSize: '1.5rem', color: '#8c1d18', marginBottom: '0.75rem', display: 'block' }} />
            <h3 style={{ color: '#fff', marginBottom: '0.4rem', fontSize: '1.05rem' }}>{v.title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.55 }}>{v.desc}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2rem', marginBottom: '0.75rem' }}>Equipo Editorial</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1rem', lineHeight: 1.7 }}>
        Nuestro equipo está conformado por periodistas y comunicadores profesionales comprometidos con el rigor informativo. Cada pieza publicada pasa por un proceso de verificación y revisión editorial antes de ser publicada.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem', margin: '1rem 0 2rem' }}>
        {[
          { name: 'Keyling Rivera M.', role: 'Directora Editorial', desc: 'Periodista con experiencia en medios digitales nicaragüenses. Lidera la línea editorial y la verificación de contenidos.' },
          { name: 'Equipo de Redacción', role: 'Periodistas', desc: 'Equipo multidisciplinario de reporteros y editores que cubren las principales fuentes informativas del país.' },
        ].map((m) => (
          <div key={m.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1.25rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
              {m.name.charAt(0)}
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{m.name}</div>
            <div style={{ color: '#8c1d18', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{m.role}</div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.55 }}>{m.desc}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2rem', marginBottom: '0.75rem' }}>Principios editoriales</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', lineHeight: 1.7 }}>
        Nuestra labor periodística se rige por principios fundamentales que garantizan la calidad y confiabilidad de nuestro contenido:
      </p>
      <ul style={{ color: '#cbd5e1', lineHeight: 1.8, paddingLeft: '1.5rem', listStyleType: 'disc', marginBottom: '2rem' }}>
        <li><strong style={{ color: '#fff' }}>Verificación:</strong> Toda información es contrastada con al menos dos fuentes independientes antes de su publicación.</li>
        <li><strong style={{ color: '#fff' }}>Correcciones:</strong> Cuando se detecta un error, se corrige de forma transparente y se notifica al lector.</li>
        <li><strong style={{ color: '#fff' }}>Independencia:</strong> No aceptamos presiones externas que comprometan nuestra línea editorial.</li>
        <li><strong style={{ color: '#fff' }}>Separación editorial-comercial:</strong> El contenido informativo es independiente de los anunciantes.</li>
      </ul>
      <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
        Consulta nuestra <a href="/politica-editorial" style={{ color: '#60a5fa', textDecoration: 'none' }}>Política Editorial</a> completa para más detalles.
      </p>

      <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem' }}>Ubicación y contacto</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', margin: '0.5rem 0 1.5rem' }}>
        {[
          { icon: 'fa-map-marker-alt', label: 'Dirección', val: 'Masaya, Departamento de Masaya, Nicaragua, Centroamérica' },
          { icon: 'fa-envelope', label: 'Correo editorial', val: 'redaccion@nicaraguainformate.com' },
          { icon: 'fa-globe', label: 'Sitio web', val: 'www.nicaraguainformate.com' },
        ].map(c => (
          <div key={c.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem' }}>
            <i className={`fas ${c.icon}`} style={{ color: '#8c1d18', fontSize: 16, marginBottom: 8, display: 'block' }} />
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.label}</div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{c.val}</div>
          </div>
        ))}
      </div>
      <p style={{ color: '#cbd5e1', marginTop: '1rem' }}>
        ¿Tienes sugerencias o quieres reportar una noticia? Usa nuestro{' '}
        <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a>.
      </p>
    </LegalPageShell>
  );
}
