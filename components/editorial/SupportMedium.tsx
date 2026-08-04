'use client';

import { useEffect, useRef, useState } from 'react';

interface SupportMediumProps {
  titulo?: string;
  mensaje?: string;
  url?: string;
  textoBoton?: string;
  textoSecundario?: string;
  slug?: string;
}

const DEFAULT_TITULO = 'Apoya el periodismo de Nicaragua Informate';
const DEFAULT_MENSAJE =
  'Cada noticia que publicamos requiere investigación, verificación de datos y trabajo editorial. Tu apoyo voluntario nos ayuda a seguir ofreciendo información verificada, gratuita y de interés público para nuestros lectores.';
const DEFAULT_URL = 'https://paypal.me/NicaraguaInformate';
const DEFAULT_BOTON = 'Apoyar con PayPal';
const DEFAULT_SECUNDARIO =
  'Gracias por ser parte de una comunidad que valora el periodismo responsable.';

export default function SupportMedium({
  titulo = DEFAULT_TITULO,
  mensaje = DEFAULT_MENSAJE,
  url = DEFAULT_URL,
  textoBoton = DEFAULT_BOTON,
  textoSecundario = DEFAULT_SECUNDARIO,
  slug = '',
}: SupportMediumProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [impressionLogged, setImpressionLogged] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || impressionLogged) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setImpressionLogged(true);
          observer.disconnect();
          fetch('/api/support/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'impression', slug }),
          }).catch(() => {});
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [impressionLogged, slug]);

  const handleClick = () => {
    fetch('/api/support/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'click', slug }),
    }).catch(() => {});
  };

  return (
    <section
      ref={sectionRef}
      aria-label="Apoya el periodismo"
      style={{
        marginTop: 40,
        padding: '32px 28px',
        backgroundColor: '#fafbfc',
        borderTop: '3px solid #0f4c81',
        borderBottom: '1px solid #e2e8f0',
        borderRadius: '4px 4px 12px 12px',
      }}
    >
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 12 }} aria-hidden="true">
          ❤️
        </div>

        <h2
          style={{
            fontFamily: "'Merriweather', serif",
            fontSize: 'clamp(1.3rem, 3.5vw, 1.7rem)',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 16px',
            lineHeight: 1.3,
            letterSpacing: '-0.2px',
          }}
        >
          {titulo}
        </h2>

        <p
          style={{
            fontSize: 15.5,
            lineHeight: 1.7,
            color: '#475569',
            margin: '0 0 24px',
          }}
        >
          {mensaje}
        </p>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={handleClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            color: '#fff',
            backgroundColor: '#0070ba',
            padding: '13px 32px',
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: 15.5,
            whiteSpace: 'nowrap',
            transition: 'background-color 0.2s ease, transform 0.15s ease',
            boxShadow: '0 2px 8px -2px rgba(0,112,186,0.35)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#005ea6';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#0070ba';
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.63l-1.496 9.478h2.79c.457 0 .85-.334.922-.788l.04-.19.73-4.627.047-.255a.933.933 0 0 1 .922-.788h.58c3.76 0 6.705-1.528 7.565-5.946.025-.13.048-.26.066-.39a5.65 5.65 0 0 0-.04-1.722c-.01-.065-.02-.13-.032-.194a3.506 3.506 0 0 0-.108-.313z" />
          </svg>
          {textoBoton}
        </a>

        <p
          style={{
            fontSize: 13.5,
            color: '#94a3b8',
            margin: '20px 0 0',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}
        >
          {textoSecundario}
        </p>
      </div>
    </section>
  );
}
