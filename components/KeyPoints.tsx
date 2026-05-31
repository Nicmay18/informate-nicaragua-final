'use client';

// No imports needed for useMemo

interface KeyPointsProps {
  titulo: string;
  resumen?: string;
  contenido?: string;
  categoria?: string;
  puntosClave?: string[];
}

export default function KeyPoints({ puntosClave }: KeyPointsProps) {
  if (!puntosClave || puntosClave.length === 0) return null;

  const sectionStyle: React.CSSProperties = {
    maxWidth: 768,
    margin: '32px auto',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    border: '1px solid #e5e5e5',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  };

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    paddingBottom: 12,
    marginBottom: 16,
    borderBottom: '2px solid #111827',
  };

  const labels = ['Ubicación', 'Dato personal / Detalle', 'Estado actual'];

  return (
    <section style={sectionStyle} aria-label="Resumen de puntos clave">
      <h2 style={titleStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
        </svg>
        Puntos Clave
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {puntosClave.map((point, i) => (
          <Point key={i} label={labels[i] || `Punto ${i + 1}`} text={point} />
        ))}
      </div>
    </section>
  );
}

function Point({ label, text }: { label: string; text: string }) {
  const dotStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 8,
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#2563eb',
  };

  return (
    <div style={{ position: 'relative', paddingLeft: 20 }}>
      <span style={dotStyle} aria-hidden="true" />
      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        {label}
      </span>
      <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>
        {text}
      </p>
    </div>
  );
}
