'use client';

import { useState } from 'react';
import { CATEGORIAS_NEGOCIO, DEPARTAMENTOS_NI } from '@/lib/negocios/modelo';

const FIELD: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  boxSizing: 'border-box',
};
const LABEL: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 };

export default function NegocioAltaForm({ negocioId = '', nombre = '' }: { negocioId?: string; nombre?: string }) {
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado('enviando');
    const fd = new FormData(e.currentTarget);
    const body = {
      tipo: negocioId ? 'correccion' : 'alta',
      negocioId,
      consentimiento: fd.get('consentimiento') === 'on',
      sitio: String(fd.get('sitio') || ''),
      nombre: String(fd.get('nombre') || ''),
      descripcion: String(fd.get('descripcion') || fd.get('correccion') || ''),
      categoria: String(fd.get('categoria') || '') || undefined,
      departamento: String(fd.get('departamento') || '') || undefined,
      telefono: String(fd.get('telefono') || ''),
      whatsapp: String(fd.get('whatsapp') || ''),
      correccion: String(fd.get('correccion') || ''),
    };
    try {
      const res = await fetch('/api/negocios/solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setEstado('ok');
        setMsg(json.mensaje || 'Solicitud recibida.');
      } else {
        setEstado('error');
        setMsg(json.error || 'No se pudo enviar. Revisá los campos.');
      }
    } catch {
      setEstado('error');
      setMsg('Error de conexión. Intentá de nuevo.');
    }
  }

  if (estado === 'ok') {
    return (
      <div style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: 14, padding: '1.5rem', color: '#166534' }}>
        <strong>¡Gracias!</strong> {msg}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
      {/* Honeypot invisible para bots */}
      <input type="text" name="sitio" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />

      <div>
        <label htmlFor="nb-nombre" style={LABEL}>Nombre del negocio *</label>
        <input id="nb-nombre" name="nombre" defaultValue={nombre} required minLength={2} maxLength={120} style={FIELD} />
      </div>
      <div>
        <label htmlFor="nb-desc" style={LABEL}>Descripción *</label>
        <textarea id="nb-desc" name="descripcion" required={!negocioId} minLength={10} maxLength={2000} rows={4} style={FIELD} placeholder="Qué ofrecen, a quién y en qué zona…" />
      </div>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div>
          <label htmlFor="nb-cat" style={LABEL}>Categoría</label>
          <select id="nb-cat" name="categoria" style={FIELD}>
            <option value="">Elegir…</option>
            {CATEGORIAS_NEGOCIO.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="nb-dep" style={LABEL}>Departamento</label>
          <select id="nb-dep" name="departamento" style={FIELD}>
            <option value="">Elegir…</option>
            {DEPARTAMENTOS_NI.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div>
          <label htmlFor="nb-tel" style={LABEL}>Teléfono</label>
          <input id="nb-tel" name="telefono" maxLength={20} style={FIELD} placeholder="8888-1234" />
        </div>
        <div>
          <label htmlFor="nb-wa" style={LABEL}>WhatsApp (solo dígitos con código de país)</label>
          <input id="nb-wa" name="whatsapp" maxLength={15} style={FIELD} placeholder="50588881234" />
        </div>
      </div>
      <div>
        <label htmlFor="nb-corr" style={LABEL}>¿Es una corrección? Escribí el nombre del perfil y el cambio</label>
        <input id="nb-corr" name="correccion" required={!!negocioId} minLength={negocioId ? 10 : undefined} maxLength={1000} style={FIELD} placeholder={negocioId ? 'Indicá la información correcta' : 'Opcional'} />
      </div>

      <label style={LABEL}><input name="consentimiento" type="checkbox" required /> Autorizo el uso de estos datos para revisar mi solicitud y contactarme. No incluyo datos personales privados para su publicación. <a href="/privacidad">Privacidad</a>.</label>
      <button
        type="submit"
        disabled={estado === 'enviando'}
        style={{ ...FIELD, background: 'var(--accent, #0369a1)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
      >
        {estado === 'enviando' ? 'Enviando…' : 'Enviar para revisión'}
      </button>
      {estado === 'error' && <p style={{ color: '#b91c1c', fontSize: 14, margin: 0 }}>{msg}</p>}
      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
        Nada se publica automáticamente: cada alta pasa por revisión editorial.
      </p>
    </form>
  );
}
