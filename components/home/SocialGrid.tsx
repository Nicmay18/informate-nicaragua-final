const SOCIALS = [
  { href: 'https://facebook.com/profile.php?id=61578261125687', icon: 'fab fa-facebook-f', label: 'Facebook', hint: 'Noticias diarias', bg: '#1877F2' },
  { href: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17', icon: 'fab fa-whatsapp', label: 'WhatsApp', hint: 'Únete al canal', bg: '#25D366' },
  { href: 'https://t.me/+fHHjncJqMQM3NjZh', icon: 'fab fa-telegram-plane', label: 'Telegram', hint: 'Alertas al instante', bg: '#0088cc' },
  { href: '/feed.xml', icon: 'fas fa-rss', label: 'RSS', hint: 'Feed de noticias', bg: '#f26522' },
];

export default function SocialGrid() {
  return (
    <div className="bg-[var(--paper-accent)] rounded-[14px] border border-[var(--border-light)] p-[18px] shadow-sm widget-lift">
      <div className="flex items-center gap-2 mb-4 text-[13px] font-extrabold tracking-wide uppercase text-[var(--ink)]">
        <span className="block w-1 h-5 bg-gradient-to-b from-red-500 to-orange-500 rounded-sm" />
        Síguenos
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target={s.href.startsWith('http') ? '_blank' : undefined}
            rel={s.href.startsWith('http') ? 'noopener' : undefined}
            className="social-item flex items-center gap-2.5 p-3 bg-[var(--paper)] border border-[var(--border-light)] rounded-xl no-underline text-[var(--ink)]"
          >
            <span
              className="w-[38px] h-[38px] rounded-[10px] grid place-items-center shrink-0 text-white text-[17px]"
              style={{ background: s.bg }}
            >
              <i className={s.icon} />
            </span>
            <div>
              <div className="text-[13px] font-bold leading-tight">{s.label}</div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-0.5 font-medium">{s.hint}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
