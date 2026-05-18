import BrandIcon from '@/components/BrandIcon';
import { Rss, ChevronRight } from 'lucide-react';

const SOCIALS = [
  {
    href: 'https://facebook.com/profile.php?id=61578261125687',
    icon: <BrandIcon name="facebook-f" size={13} />,
    label: 'Facebook',
    action: 'Seguir página',
    color: '#1877F2',
  },
  {
    href: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17',
    icon: <BrandIcon name="whatsapp" size={13} />,
    label: 'WhatsApp',
    action: 'Unirse al canal',
    color: '#25D366',
  },
  {
    href: 'https://t.me/+fHHjncJqMQM3NjZh',
    icon: <BrandIcon name="telegram" size={13} />,
    label: 'Telegram',
    action: 'Unirse al grupo',
    color: '#0088cc',
  },
  {
    href: '/feed.xml',
    icon: <Rss size={13} />,
    label: 'RSS',
    action: 'Suscribirse al feed',
    color: '#e8590c',
  },
];

export default function SocialGrid() {
  return (
    <div style={{
      background: 'var(--c-surface-elevated)',
      border: '1px solid var(--c-border-light)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '2px solid var(--c-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--c-accent)', display: 'inline-block',
        }} />
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '1px',
          textTransform: 'uppercase', color: 'var(--c-text-muted)',
        }}>Nuestras Redes</span>
      </div>

      {/* Social rows */}
      {SOCIALS.map((s, i) => (
        <a
          key={s.label}
          href={s.href}
          target={s.href.startsWith('http') ? '_blank' : undefined}
          rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '11px 16px',
            borderBottom: i < SOCIALS.length - 1 ? '1px solid var(--c-border-light)' : 'none',
            borderLeft: `3px solid ${s.color}`,
            background: 'transparent',
            textDecoration: 'none',
            transition: 'background 0.15s',
            cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-surface)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{
            width: 30, height: 30, borderRadius: 6,
            background: s.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
          }}>
            {s.icon}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 1 }}>{s.action}</div>
          </div>
          <ChevronRight size={14} style={{ color: 'var(--c-text-muted)', flexShrink: 0 }} />
        </a>
      ))}
    </div>
  );
}
