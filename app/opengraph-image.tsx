import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Nicaragua Informate — Noticias de Nicaragua';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1E3A5F 0%, #0F2340 60%, #0a1628 100%)',
          position: 'relative',
        }}
      >
        {/* Red accent bar top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: '#C41E3A', display: 'flex' }} />

        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          display: 'flex',
        }} />

        {/* Logo circle */}
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: '#C41E3A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 32,
          boxShadow: '0 0 0 4px rgba(196,30,58,0.3)',
        }}>
          <span style={{ fontSize: 48, color: '#fff', fontWeight: 900 }}>NI</span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 64,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-1px',
          marginBottom: 16,
          textAlign: 'center',
          display: 'flex',
        }}>
          Nicaragua Informate
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 28,
          color: 'rgba(255,255,255,0.7)',
          textAlign: 'center',
          marginBottom: 40,
          display: 'flex',
        }}>
          Periodismo verificado desde Managua
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 12 }}>
          {['Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Tecnología'].map((cat) => (
            <div key={cat} style={{
              padding: '8px 18px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 16,
              fontWeight: 600,
              display: 'flex',
            }}>
              {cat}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div style={{
          position: 'absolute', bottom: 32,
          fontSize: 20, color: 'rgba(255,255,255,0.5)',
          display: 'flex',
        }}>
          nicaraguainformate.com
        </div>

        {/* Red accent bar bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: '#C41E3A', display: 'flex' }} />
      </div>
    ),
    { ...size }
  );
}
