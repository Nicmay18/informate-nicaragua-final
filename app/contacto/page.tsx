import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Contacto | Nicaragua Informate',
  description: 'Contacta a Nicaragua Informate. Envíanos tus consultas, sugerencias o reportes de noticias.',
  alternates: { canonical: 'https://nicaraguainformate.com/contacto' },
};

export default function ContactoPage() {
  return (
    <LegalPageShell title="Contacto">
      <p style={{ fontSize: '1.05rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.75 }}>
        ¿Tienes una noticia, sugerencia o consulta? Escríbenos a través de cualquiera de los canales a continuación.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.75rem', margin: '0 0 2rem' }}>
        {[
          { icon: 'fa-envelope', label: 'Redacción', val: 'redaccion@nicaraguainformate.com', href: 'mailto:redaccion@nicaraguainformate.com' },
          { icon: 'fa-shield-halved', label: 'Privacidad', val: 'privacidad@nicaraguainformate.com', href: 'mailto:privacidad@nicaraguainformate.com' },
          { icon: 'fa-scale-balanced', label: 'Legal', val: 'legal@nicaraguainformate.com', href: 'mailto:legal@nicaraguainformate.com' },
        ].map(c => (
          <div key={c.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem' }}>
            <i className={`fas ${c.icon}`} style={{ color: '#8c1d18', fontSize: 16, marginBottom: 8, display: 'block' }} />
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.label}</div>
            <a href={c.href} style={{ color: '#60a5fa', fontSize: 12, textDecoration: 'none' }}>{c.val}</a>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1.25rem' }}>
        <h3 style={{ color: '#fff', margin: '0 0 0.6rem', fontSize: '1rem' }}>Formulario de contacto</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Completa los campos a continuación y te responderemos lo antes posible.
        </p>
        <form action="https://formspree.io/f/mzzeepgv" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nombre</label>
            <input type="text" name="name" required placeholder="Tu nombre completo"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Correo electrónico</label>
            <input type="email" name="email" required placeholder="tu@email.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Asunto</label>
            <select name="subject" required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14 }}>
              <option value="" style={{ color: '#18181b' }}>Selecciona un asunto</option>
              <option value="sugerencia" style={{ color: '#18181b' }}>Sugerencia</option>
              <option value="reporte" style={{ color: '#18181b' }}>Reportar una noticia</option>
              <option value="correccion" style={{ color: '#18181b' }}>Solicitar corrección</option>
              <option value="privacidad" style={{ color: '#18181b' }}>Privacidad / Datos personales</option>
              <option value="publicidad" style={{ color: '#18181b' }}>Publicidad / Patrocinio</option>
              <option value="otro" style={{ color: '#18181b' }}>Otro</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mensaje</label>
            <textarea name="message" rows={5} required placeholder="Escribe tu mensaje..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, resize: 'vertical' }} />
          </div>
          <button type="submit"
            style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 }}>
            Enviar mensaje
          </button>
        </form>
      </div>
    </LegalPageShell>
  );
}
