'use client';

export function AudioButton({
  titulo,
  resumen,
  contenido,
}: {
  titulo: string;
  resumen: string;
  contenido: string;
}) {
  function speak() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const text = `${titulo}. ${resumen}. ${contenido.replace(/<[^>]*>/g, ' ').substring(0, 1200)}`;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
  return (
    <button
      onClick={speak}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        background: '#1e293b',
        color: '#fff',
        border: 'none',
        padding: '10px 20px',
        borderRadius: 8,
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.9rem',
        marginBottom: 24,
      }}
    >
      🎧 Escuchar noticia
    </button>
  );
}

export function CopyButton({ url }: { url: string }) {
  return (
    <button
      onClick={() => navigator.clipboard?.writeText(url)}
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: '#fffdf9',
        border: '1px solid #ddd6ce',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        color: '#756d66',
        fontSize: 16,
      }}
      title="Copiar enlace"
    >
      🔗
    </button>
  );
}

export function ShareChip({ href, label, bg }: { href: string; label: string; bg: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = bg;
        el.style.color = 'white';
        el.style.borderColor = bg;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = '#fffdf9';
        el.style.color = '#756d66';
        el.style.borderColor = '#ddd6ce';
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        textDecoration: 'none',
        border: '1px solid #ddd6ce',
        background: '#fffdf9',
        color: '#756d66',
        transition: 'all 0.2s',
      }}
    >
      {label}
    </a>
  );
}

export function ShareSticky({ href, icon, color }: { href: string; icon: string; color: string }) {
  const isSolid = icon === 'link';
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = color;
        el.style.color = '#fff';
        el.style.transform = 'scale(1.1)';
        el.style.boxShadow = `0 4px 12px ${color}55`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = color;
        el.style.color = '#fff';
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      }}
      style={{
        width: 42,
        height: 42,
        borderRadius: '50%',
        background: color,
        display: 'grid',
        placeItems: 'center',
        textDecoration: 'none',
        color: '#fff',
        fontSize: 16,
        transition: 'all 0.2s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <i className={`${isSolid ? 'fas' : 'fab'} fa-${icon}`} />
    </a>
  );
}

export function SocialFooter({ href, icon }: { href: string; icon: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = '#fffdf9';
        el.style.background = 'rgba(255,255,255,0.08)';
        el.style.borderColor = '#5b5b5f';
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = '#756d66';
        el.style.background = 'transparent';
        el.style.borderColor = 'transparent';
        el.style.transform = 'translateY(0)';
      }}
      style={{
        color: '#756d66',
        fontSize: 18,
        transition: 'all 0.2s',
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: '1px solid transparent',
        textDecoration: 'none',
      }}
    >
      <i className={`fab fa-${icon}`} />
    </a>
  );
}
