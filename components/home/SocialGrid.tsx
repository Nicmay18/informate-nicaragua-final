import BrandIcon from '@/components/BrandIcon';
import { Rss } from 'lucide-react';

const SOCIALS = [
  { href: 'https://facebook.com/profile.php?id=61578261125687', icon: <BrandIcon name="facebook-f" size={14} />, label: 'Facebook', hint: 'Noticias diarias', bg: '#1877F2' },
  { href: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17', icon: <BrandIcon name="whatsapp" size={14} />, label: 'WhatsApp', hint: 'Únete al canal', bg: '#25D366' },
  { href: 'https://t.me/+fHHjncJqMQM3NjZh', icon: <BrandIcon name="telegram" size={14} />, label: 'Telegram', hint: 'Alertas al instante', bg: '#0088cc' },
  { href: '/feed.xml', icon: <Rss size={14} />, label: 'RSS', hint: 'Feed de noticias', bg: '#ff6600' },
];

export default function SocialGrid() {
  return (
    <div className="sidebar-widget social-widget" style={{ background: '#faf9f7', borderRadius: 8, padding: 20, marginBottom: 24, border: '1px solid #f0f0f4' }}>
      {/* Widget Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #1a1a2e' }}>
        <h3 style={{ fontFamily: 'var(--font-merri)', fontSize: 16, fontWeight: 900, color: '#1a1a2e', margin: 0 }}>Síguenos</h3>
      </div>

      <div className="social-link-grid">
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target={s.href.startsWith('http') ? '_blank' : undefined}
            rel={s.href.startsWith('http') ? 'noopener' : undefined}
            className="social-card"
          >
            <span style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              background: s.bg,
              flexShrink: 0,
            }}>
              {s.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-text" style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</div>
              <div className="sidebar-muted" style={{ fontSize: 11, color: '#8a8a9e' }}>{s.hint}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
