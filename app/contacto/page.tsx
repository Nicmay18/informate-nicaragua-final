import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Contacto | Nicaragua Informate',
  description: 'Contacta a Nicaragua Informate. Ubicación en Masaya, Nicaragua. Redacción: redaccion@nicaraguainformate.com. Horario: Lunes a Viernes 8:00 - 18:00',
  alternates: { canonical: 'https://nicaraguainformate.com/contacto' },
};

const CONTACT_CHANNELS = [
  { icon: 'fa-envelope', label: 'Redacción', val: 'redaccion@nicaraguainformate.com', href: 'mailto:redaccion@nicaraguainformate.com', desc: 'Noticias y prensa' },
  { icon: 'fa-shield-halved', label: 'Privacidad', val: 'privacidad@nicaraguainformate.com', href: 'mailto:privacidad@nicaraguainformate.com', desc: 'Datos personales' },
  { icon: 'fa-scale-balanced', label: 'Legal', val: 'legal@nicaraguainformate.com', href: 'mailto:legal@nicaraguainformate.com', desc: 'Asuntos legales' },
  { icon: 'fa-bullhorn', label: 'Publicidad', val: 'publicidad@nicaraguainformate.com', href: 'mailto:publicidad@nicaraguainformate.com', desc: 'Anuncios y patrocinios' },
];

const SOCIAL_CHANNELS = [
  { icon: 'fab fa-facebook-f', label: 'Facebook', href: 'https://facebook.com/profile.php?id=61578261125687', color: '#1877F2' },
  { icon: 'fab fa-whatsapp', label: 'WhatsApp', href: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17', color: '#25D366' },
  { icon: 'fab fa-telegram-plane', label: 'Telegram', href: 'https://t.me/+fHHjncJqMQM3NjZh', color: '#0088cc' },
];

export default function ContactoPage() {
  return (
    <LegalPageShell title="Contacto">
      {/* Intro */}
      <p style={{ fontSize: '1.05rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.75 }}>
        ¿Tienes una noticia, sugerencia o consulta? Estamos aquí para escucharte. 
        Contáctanos por correo electrónico, redes sociales o visita nuestras oficinas en Masaya.
      </p>

      {/* Location Card with Map */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fas fa-map-marker-alt" style={{ color: '#fff', fontSize: 20 }} />
          </div>
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Oficinas Principales</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Masaya, Nicaragua<br />
              <span style={{ color: '#cbd5e1' }}>Cerca del Parque Central de Masaya</span>
            </p>
          </div>
        </div>
        
        {/* Map Embed */}
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3901.7424!2d-86.2966!3d11.9739!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f740f5b7c0b8e4d%3A0x8f740f5b7c0b8e4d!2sMasaya%2C%20Nicaragua!5e0!3m2!1ses!2s!4v1600000000000!5m2!1ses!2s"
            width="100%" 
            height="250" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Hours */}
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-clock" style={{ color: '#fbbf24', fontSize: 14 }} />
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              <strong style={{ color: '#fff' }}>Lun - Vie:</strong> 8:00 - 18:00
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-clock" style={{ color: '#22c55e', fontSize: 14 }} />
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              <strong style={{ color: '#fff' }}>Sábado:</strong> 9:00 - 14:00
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-clock" style={{ color: '#64748b', fontSize: 14 }} />
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              <strong style={{ color: '#fff' }}>Domingo:</strong> Cerrado
            </span>
          </div>
        </div>
      </div>

      {/* Email Channels */}
      <h2 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="fas fa-envelope" style={{ color: '#8c1d18' }} />
        Correos Electrónicos
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.75rem', margin: '0 0 2rem' }}>
        {CONTACT_CHANNELS.map(c => (
          <a key={c.label} href={c.href} 
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem', textDecoration: 'none', transition: 'all 0.2s' }}
            className="contact-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(140,29,24,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`fas ${c.icon}`} style={{ color: '#8c1d18', fontSize: 14 }} />
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{c.label}</div>
            </div>
            <div style={{ color: '#60a5fa', fontSize: 12, wordBreak: 'break-all', marginBottom: 4 }}>{c.val}</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>{c.desc}</div>
          </a>
        ))}
      </div>

      {/* Social Media */}
      <h2 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="fas fa-share-alt" style={{ color: '#8c1d18' }} />
        Redes Sociales
      </h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: '2rem', flexWrap: 'wrap' }}>
        {SOCIAL_CHANNELS.map(s => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, textDecoration: 'none', transition: 'all 0.2s' }}
            className="social-contact-btn">
            <i className={s.icon} style={{ color: s.color, fontSize: 18 }} />
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{s.label}</span>
          </a>
        ))}
      </div>

      {/* Contact Form */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.5rem' }}>
        <h3 style={{ color: '#fff', margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Formulario de contacto</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Completa el formulario y te responderemos dentro de las próximas 24-48 horas hábiles.
        </p>
        <form action="https://formspree.io/f/mzzeepgv" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nombre completo *</label>
              <input type="text" name="name" required placeholder="Tu nombre"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Correo electrónico *</label>
              <input type="email" name="email" required placeholder="tu@email.com"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14 }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Asunto *</label>
            <select name="subject" required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14 }}>
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
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mensaje *</label>
            <textarea name="message" rows={5} required placeholder="Describe tu mensaje en detalle..."
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
            <i className="fas fa-info-circle" />
            <span>Al enviar este formulario, aceptas nuestra <a href="/privacidad" style={{ color: '#60a5fa', textDecoration: 'none' }}>política de privacidad</a></span>
          </div>
          <button type="submit"
            style={{ padding: '14px 28px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <i className="fas fa-paper-plane" />
            Enviar mensaje
          </button>
        </form>
      </div>

      <style>{`
        .contact-card:hover { border-color: rgba(140,29,24,0.4) !important; transform: translateY(-2px); }
        .social-contact-btn:hover { border-color: rgba(255,255,255,0.2) !important; background: rgba(255,255,255,0.08) !important; }
      `}</style>
    </LegalPageShell>
  );
}
