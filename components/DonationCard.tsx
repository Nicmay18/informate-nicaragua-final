'use client';

export default function DonationCard() {
  return (
    <div style={{
      background: 'linear-gradient(150deg, var(--c-primary) 0%, #0F2340 100%)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      marginBottom: 24,
      width: '100%',
    }}>
      {/* Red accent bar */}
      <div style={{
        background: 'var(--c-accent)',
        padding: '6px 18px',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: '#fff',
      }}>
        Periodismo Independiente
      </div>

      <div style={{ padding: '22px 20px 24px' }}>
        {/* Title */}
        <h3 style={{
          fontSize: 17,
          fontWeight: 800,
          color: '#fff',
          lineHeight: 1.3,
          marginBottom: 8,
          fontFamily: 'var(--font-merri, Georgia, serif)',
        }}>
          Apoya nuestra redacción
        </h3>

        {/* Description */}
        <p style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.62)',
          lineHeight: 1.65,
          marginBottom: 20,
        }}>
          Tu aporte garantiza el periodismo verificado e independiente desde Managua, sin presiones políticas ni comerciales.
        </p>

        {/* PayPal button */}
        <a
          href="https://paypal.me/NicaraguaInformate"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#fff',
            color: '#003087',
            fontWeight: 800,
            fontSize: 13,
            padding: '11px 20px',
            borderRadius: 6,
            textDecoration: 'none',
            letterSpacing: '0.2px',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f4ff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#003087" aria-hidden="true">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.828c-.666 0-1.226.49-1.33 1.146l-1.4 8.883a.64.64 0 0 0 .634.738h3.994c.524 0 .968-.382 1.051-.9l.437-2.766c.083-.518.527-.9 1.051-.9h.663c3.872 0 6.904-1.573 7.786-6.12.378-1.945.164-3.563-.492-4.876z"/>
          </svg>
          Donar con PayPal
        </a>

        {/* Trust badge */}
        <p style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.3)',
          textAlign: 'center',
          marginTop: 10,
          letterSpacing: '0.3px',
        }}>
          Seguro · Cifrado · Verificado
        </p>
      </div>
    </div>
  );
}
