import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';
import { MapPin, Clock, Mail, Share2, Info, Send, Shield, Scale, Megaphone } from 'lucide-react';
import BrandIcon from '@/components/BrandIcon';

export const metadata: Metadata = {
  title: 'Contacto | Nicaragua Informate',
  description: 'Contacta a Nicaragua Informate. Correo: contacto@nicaraguainformate.com. Dirección en Managua, Nicaragua. Redes sociales y formulario de contacto.',
  alternates: { canonical: 'https://nicaraguainformate.com/contacto' },
};

const CONTACT_CHANNELS = [
  { icon: <Mail size={14} />, label: 'Contacto general', val: 'contacto@nicaraguainformate.com', href: 'mailto:contacto@nicaraguainformate.com', desc: 'Consultas generales' },
  { icon: <Mail size={14} />, label: 'Redacción', val: 'redaccion@nicaraguainformate.com', href: 'mailto:redaccion@nicaraguainformate.com', desc: 'Noticias y prensa' },
  { icon: <Shield size={14} />, label: 'Privacidad', val: 'privacidad@nicaraguainformate.com', href: 'mailto:privacidad@nicaraguainformate.com', desc: 'Datos personales' },
  { icon: <Scale size={14} />, label: 'Legal', val: 'legal@nicaraguainformate.com', href: 'mailto:legal@nicaraguainformate.com', desc: 'Asuntos legales' },
  { icon: <Megaphone size={14} />, label: 'Publicidad', val: 'publicidad@nicaraguainformate.com', href: 'mailto:publicidad@nicaraguainformate.com', desc: 'Anuncios y patrocinios' },
];

const SOCIAL_CHANNELS = [
  { icon: 'facebook-f', label: 'Facebook', href: 'https://facebook.com/profile.php?id=61578261125687', color: '#1877F2' },
  { icon: 'whatsapp', label: 'WhatsApp', href: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17', color: '#25D366' },
  { icon: 'telegram', label: 'Telegram', href: 'https://t.me/+fHHjncJqMQM3NjZh', color: '#0088cc' },
];

export default function ContactoPage() {
  return (
    <LegalPageShell title="Contacto">
      <p style={{ color: '#cbd5e1', marginBottom: '2.5rem', lineHeight: 1.7, fontSize: '0.95rem' }}>
        ¿Tienes una noticia, sugerencia o consulta? Estamos aquí para escucharte.
        Contáctanos por correo electrónico, redes sociales o visita nuestras oficinas en Managua, Nicaragua.
      </p>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={20} color="#fff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 600 }}>Dirección de Redacción</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Managua, Nicaragua<br />
              <span style={{ color: '#cbd5e1' }}>Centroamérica</span>
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} color="#fbbf24" />
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              <strong style={{ color: '#fff' }}>Lun - Vie:</strong> 8:00 - 18:00
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} color="#22c55e" />
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              <strong style={{ color: '#fff' }}>Sábado:</strong> 9:00 - 14:00
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} color="#64748b" />
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              <strong style={{ color: '#fff' }}>Domingo:</strong> Cerrado
            </span>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Mail size={16} color="#8c1d18" />
        Correos Electrónicos
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.75rem', margin: '0 0 2rem' }}>
        {CONTACT_CHANNELS.map(c => (
          <a key={c.label} href={c.href}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem', textDecoration: 'none', transition: 'all 0.2s' }}
            className="contact-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(140,29,24,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c.icon}
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{c.label}</div>
            </div>
            <div style={{ color: '#60a5fa', fontSize: 12, wordBreak: 'break-all', marginBottom: 4 }}>{c.val}</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>{c.desc}</div>
          </a>
        ))}
      </div>

      <h2 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Share2 size={16} color="#8c1d18" />
        Redes Sociales
      </h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: '2rem', flexWrap: 'wrap' }}>
        {SOCIAL_CHANNELS.map(s => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, textDecoration: 'none', transition: 'all 0.2s' }}
            className="social-contact-btn">
            <BrandIcon name={s.icon} size={18} />
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{s.label}</span>
          </a>
        ))}
      </div>

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
            <Info size={14} />
            <span>Al enviar este formulario, aceptas nuestra <a href="/privacidad" style={{ color: '#60a5fa', textDecoration: 'none' }}>política de privacidad</a></span>
          </div>
          <button type="submit"
            style={{ padding: '14px 28px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Send size={16} />
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
