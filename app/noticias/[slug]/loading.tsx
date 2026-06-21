export default function Loading() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* Píldora de categoría */}
      <div style={{ height: 22, width: 100, background: '#e2e8f0', borderRadius: 9999, marginBottom: 16, animation: 'shimmer 1.6s infinite linear' }} />
      {/* Título */}
      <div style={{ height: 40, background: '#e2e8f0', borderRadius: 6, marginBottom: 12, width: '92%', animation: 'shimmer 1.6s infinite linear' }} />
      <div style={{ height: 40, background: '#e2e8f0', borderRadius: 6, marginBottom: 24, width: '70%', animation: 'shimmer 1.6s infinite linear' }} />
      {/* Byline */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#e2e8f0', animation: 'shimmer 1.6s infinite linear' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 16, width: 160, background: '#e2e8f0', borderRadius: 4, marginBottom: 6, animation: 'shimmer 1.6s infinite linear' }} />
          <div style={{ height: 12, width: 100, background: '#e2e8f0', borderRadius: 4, animation: 'shimmer 1.6s infinite linear' }} />
        </div>
      </div>
      {/* Imagen */}
      <div style={{ height: 360, background: '#e2e8f0', borderRadius: 14, marginBottom: 24, animation: 'shimmer 1.6s infinite linear' }} />
      {/* Lead */}
      <div style={{ height: 20, background: '#e2e8f0', borderRadius: 4, marginBottom: 10, width: '100%', animation: 'shimmer 1.6s infinite linear' }} />
      <div style={{ height: 20, background: '#e2e8f0', borderRadius: 4, marginBottom: 10, width: '95%', animation: 'shimmer 1.6s infinite linear' }} />
      <div style={{ height: 20, background: '#e2e8f0', borderRadius: 4, marginBottom: 28, width: '60%', animation: 'shimmer 1.6s infinite linear' }} />
      {/* Párrafos */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i}>
          <div style={{ height: 16, background: '#e2e8f0', borderRadius: 4, marginBottom: 10, width: '100%', animation: 'shimmer 1.6s infinite linear', animationDelay: `${i * 0.1}s` }} />
          <div style={{ height: 16, background: '#e2e8f0', borderRadius: 4, marginBottom: 10, width: '100%', animation: 'shimmer 1.6s infinite linear', animationDelay: `${i * 0.1 + 0.05}s` }} />
          <div style={{ height: 16, background: '#e2e8f0', borderRadius: 4, marginBottom: 24, width: `${65 + Math.random() * 30}%`, animation: 'shimmer 1.6s infinite linear', animationDelay: `${i * 0.1 + 0.1}s` }} />
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .article-skeleton > div {
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 200% 100%;
        }
      `}</style>
    </div>
  );
}
