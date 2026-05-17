export default function Loading() {
  return (
    <div className="article-skeleton" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <div className="skeleton-title" style={{ height: '32px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '16px', width: '80%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      <div className="skeleton-meta" style={{ height: '16px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '24px', width: '40%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      <div className="skeleton-image" style={{ height: '300px', background: '#e5e7eb', borderRadius: '12px', marginBottom: '24px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      <div className="skeleton-paragraph" style={{ height: '16px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '12px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      <div className="skeleton-paragraph" style={{ height: '16px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '12px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      <div className="skeleton-paragraph" style={{ height: '16px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '12px', width: '60%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
