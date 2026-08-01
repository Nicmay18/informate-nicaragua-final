export default function RootLoading() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--paper)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: '3px solid var(--border-light)',
            borderTopColor: 'var(--rd-accent)',
            borderRadius: '50%',
            animation: 'ni-spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p style={{ color: 'var(--ink-muted)', fontSize: 14, fontWeight: 500 }}>
          Cargando Nicaragua Informate…
        </p>
      </div>
    </div>
  );
}
