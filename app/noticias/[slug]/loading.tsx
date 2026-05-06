export default function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #ddd6ce', borderTopColor: '#8c1d18', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
