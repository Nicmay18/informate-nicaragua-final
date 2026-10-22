'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CATEGORIAS_NEGOCIO, DEPARTAMENTOS_NI, PLANES_PROPUESTOS, diasParaVencer, slugifyNegocio } from '@/lib/negocios/modelo';
import './negocios-panel.css';

type Row = Record<string, unknown> & { id: string };
type Section = 'negocios' | 'prospectos' | 'campanas' | 'planes' | 'solicitudes' | 'auditoria';
type Field = { key: string; label: string; type?: string; options?: readonly string[]; required?: boolean };
const sections: Section[] = ['negocios', 'prospectos', 'campanas', 'planes', 'solicitudes', 'auditoria'];
const labels = { negocios: 'Perfiles', prospectos: 'Prospectos', campanas: 'Campañas y pagos', planes: 'Planes', solicitudes: 'Solicitudes', auditoria: 'Historial' };
const url = (s: Section) => `/api/admin/${s === 'negocios' ? s : `negocios-${s}`}`;
const text = (r: Record<string, unknown>, k: string) => String(r[k] ?? '');
const states = ['nuevo', 'contactado', 'interesado', 'negociacion', 'ganado', 'perdido'];
const fields: Record<Section, Field[]> = {
  negocios: [
    { key: 'nombre', label: 'Nombre', required: true }, { key: 'slug', label: 'Dirección del perfil (slug)' },
    { key: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
    { key: 'categoria', label: 'Categoría', options: CATEGORIAS_NEGOCIO, required: true },
    { key: 'departamento', label: 'Departamento', options: DEPARTAMENTOS_NI, required: true },
    { key: 'municipio', label: 'Municipio' }, { key: 'direccion', label: 'Dirección pública' },
    { key: 'telefono', label: 'Teléfono público' }, { key: 'whatsapp', label: 'WhatsApp con código de país, solo dígitos' },
    { key: 'email', label: 'Correo público', type: 'email' }, { key: 'web', label: 'Sitio web', type: 'url' },
    { key: 'fotos', label: 'Fotos autorizadas: una URL por línea (máximo 6)', type: 'lines' },
    { key: 'horario', label: 'Horario' }, { key: 'vigenteHasta', label: 'Publicar hasta (opcional)', type: 'date' },
    { key: 'destacado', label: 'Destacar durante una campaña pagada vigente', type: 'checkbox' },
    { key: 'notasInternas', label: 'Notas internas, nunca públicas', type: 'textarea' },
  ],
  prospectos: [
    { key: 'negocio', label: 'Negocio', required: true }, { key: 'contacto', label: 'Contacto comercial (privado)' },
    { key: 'canal', label: 'Canal', options: ['whatsapp', 'llamada', 'email', 'presencial', 'referido', 'otro'] },
    { key: 'estado', label: 'Estado', options: states },
    { key: 'proximoSeguimiento', label: 'Próximo seguimiento', type: 'date' },
    { key: 'notas', label: 'Notas', type: 'textarea' },
  ],
  campanas: [
    { key: 'negocioId', label: 'Negocio', required: true }, { key: 'planId', label: 'Plan', required: true },
    { key: 'precioAcordadoUsd', label: 'Importe acordado USD (no cobrado todavía)', type: 'number', required: true },
    { key: 'fechaInicio', label: 'Inicio', type: 'date', required: true },
    { key: 'fechaVencimiento', label: 'Fin inclusive (UTC)', type: 'date', required: true },
    { key: 'estadoPago', label: 'Estado de pago', options: ['pendiente', 'piloto', 'pagado', 'vencido', 'cancelado'] },
    { key: 'referenciaPago', label: 'Referencia del pago verificado' },
    { key: 'pagoConfirmado', label: 'Confirmé personalmente que el dinero fue recibido', type: 'checkbox' },
    { key: 'renovacionDe', label: 'ID de campaña anterior (solo renovación)' },
    { key: 'notas', label: 'Notas', type: 'textarea' },
  ],
  planes: [
    { key: 'nombre', label: 'Nombre', required: true },
    { key: 'precioUsd', label: 'Precio mensual USD', type: 'number', required: true },
    { key: 'features', label: 'Prestaciones acordadas: una por línea', type: 'lines' },
    { key: 'orden', label: 'Orden', type: 'number' },
    { key: 'activo', label: 'Disponible para campañas nuevas', type: 'checkbox' },
  ],
  solicitudes: [
    { key: 'estado', label: 'Estado de revisión', options: ['pendiente', 'procesada', 'descartada'] },
    { key: 'notas', label: 'Resultado de la revisión', type: 'textarea' },
  ],
  auditoria: [],
};
async function api(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(path, { method, credentials: 'same-origin',
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Error ${response.status}`);
  return result;
}
export default function NegociosPanel() {
  const [section, setSection] = useState<Section>('negocios');
  const [rows, setRows] = useState<Row[]>([]);
  const [businesses, setBusinesses] = useState<Row[]>([]);
  const [plans, setPlans] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [truncated, setTruncated] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setMessage('');
    try {
      const data = await api(url(section));
      setRows(data.items); setSummary(data.resumen || {}); setTruncated(data.truncated);
      if (section === 'campanas') {
        const [b, p] = await Promise.all([api(url('negocios')), api(url('planes'))]);
        setBusinesses(b.items); setPlans(p.items);
      }
    } catch (err) { setMessage((err as Error).message); }
    finally { setLoading(false); }
  }, [section]);
  useEffect(() => { setEditing(null); void load(); }, [load]);
  const newItem = () => setEditing(section === 'planes' ? { activo: true, orden: 0 }
    : section === 'prospectos' ? { estado: 'nuevo', canal: 'whatsapp' }
    : section === 'campanas' ? { estadoPago: 'pendiente', pagoConfirmado: false } : {});
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!editing) return;
    setBusy(true); setMessage('');
    const payload: Record<string, unknown> = {};
    for (const f of fields[section]) {
      const value = editing[f.key];
      payload[f.key] = f.type === 'checkbox' ? value === true : f.type === 'number' ? Number(value || 0)
        : f.type === 'lines' ? (Array.isArray(value) ? value : String(value || '').split('\n').map((v) => v.trim()).filter(Boolean))
        : String(value || '');
    }
    if (section === 'negocios') {
      payload.slug = payload.slug || slugifyNegocio(String(payload.nombre));
      payload.estado = 'pendiente'; payload.plan = 'basico';
    }
    const id = text(editing, 'id');
    const path = section === 'negocios' && id ? `${url(section)}/${encodeURIComponent(id)}`
      : url(section) + (id ? `?id=${encodeURIComponent(id)}` : '');
    try {
      await api(path, id ? 'PUT' : 'POST', payload);
      setEditing(null); await load(); setMessage('Guardado. Los perfiles requieren aprobación por separado.');
    } catch (err) { setMessage((err as Error).message); }
    finally { setBusy(false); }
  }
  async function moderate(row: Row, estado: string) {
    if (!confirm(`${estado === 'aprobado' ? 'Confirmar revisión editorial y publicar' : 'Cambiar a ' + estado}: ${row.nombre}?`)) return;
    setBusy(true);
    try { await api(`${url('negocios')}/${row.id}`, 'PATCH', { estado }); await load(); }
    catch (err) { setMessage((err as Error).message); } finally { setBusy(false); }
  }
  async function initialPlans() {
    if (!confirm('Crear Básico US$10, Destacado US$15 y Premium US$25 como hipótesis editables, sin cobros automáticos?')) return;
    setBusy(true);
    try {
      for (const plan of PLANES_PROPUESTOS) await api(url('planes'), 'POST', plan);
      await load();
    } catch (err) { setMessage((err as Error).message); } finally { setBusy(false); }
  }
  function fromRequest(row: Row) {
    const data = row.datos as Record<string, unknown>;
    // No aplica correcciones automáticamente. Solo prepara un borrador.
    setSection('negocios');
    setTimeout(() => setEditing({ nombre: data.nombre, descripcion: data.descripcion,
      categoria: data.categoria || CATEGORIAS_NEGOCIO[0], departamento: data.departamento || DEPARTAMENTOS_NI[9],
      telefono: data.telefono || '', whatsapp: data.whatsapp || '' }), 0);
  }
  return <main className="negocios-admin">
    <header><div><p>NICARAGUA INFORMATE</p><h1>Negocios · gestión comercial</h1></div><Link href="/negocios">Ver directorio ↗</Link></header>
    <p>Publicación con revisión editorial. Los clics no prueban conversaciones ni ventas. Los pagos se registran únicamente después de verificarlos.</p>
    <nav aria-label="Gestión comercial">{sections.map((s) => <button key={s} aria-pressed={s === section} onClick={() => setSection(s)}>{labels[s]}</button>)}</nav>
    <div className="negocios-toolbar"><h2>{labels[section]}</h2><button disabled={busy} onClick={() => void load()}>Actualizar</button>
      {!['solicitudes', 'auditoria'].includes(section) && <button onClick={newItem}>Nuevo registro</button>}
      {section === 'planes' && !loading && rows.length === 0 && <button disabled={busy} onClick={initialPlans}>Configurar planes propuestos</button>}
    </div>
    {section === 'campanas' && <div className="negocios-kpis">
      <p>Cobrado confirmado <strong>US${(summary.cobradoUsd || 0).toFixed(2)}</strong></p>
      <p>Pendiente <strong>US${(summary.pendienteUsd || 0).toFixed(2)}</strong></p>
      <p>Vencen en 14 días <strong>{summary.porVencer14d || 0}</strong></p>
      <p>Renovaciones pagadas <strong>{summary.renovaciones || 0}</strong></p>
      <p>Pilotos gratuitos activos <strong>{summary.pilotosActivos || 0}/3</strong></p>
    </div>}
    {message && <p role="status" className="negocios-message">{message}</p>}
    {truncated && <p role="alert">Se muestran 500 registros; los totales son parciales. Reducí el volumen antes de usar este resumen para contabilidad.</p>}
    {editing && <form onSubmit={save} className="negocios-editor">
      <h3>{editing.id ? 'Editar' : 'Nuevo'} · {labels[section]}</h3>
      {section === 'campanas' && <p>Piloto gratuito: importe cero, sin pago ni referencia, máximo 45 días inclusive y tres activos. Al finalizar caduca el perfil; para continuar, registrá una campaña nueva y revisá la vigencia del perfil.</p>}
      {fields[section].map((f) => {
        const choices = f.key === 'negocioId' ? businesses : f.key === 'planId' ? plans : null;
        return <label key={f.key}>{f.label}
          {choices ? <select required value={text(editing, f.key)} onChange={(e) => {
            const id = e.target.value; const plan = f.key === 'planId' ? plans.find((p) => p.id === id) : null;
            setEditing({ ...editing, [f.key]: id, ...(plan ? { precioAcordadoUsd: plan.precioUsd } : {}) });
          }}><option value="">Seleccionar…</option>{choices.map((r) => <option key={r.id} value={r.id}>{text(r, 'nombre')}</option>)}</select>
          : f.options ? <select value={text(editing, f.key)} required={f.required} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}>
            <option value="">Seleccionar…</option>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
          : ['textarea', 'lines'].includes(f.type || '') ? <textarea required={f.required} value={Array.isArray(editing[f.key]) ? (editing[f.key] as string[]).join('\n') : text(editing, f.key)} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
          : <input type={f.type || 'text'} required={f.required} step={f.type === 'number' ? '0.01' : undefined} min={f.type === 'number' ? 0 : undefined}
            disabled={f.key === 'slug' && !!editing.id} checked={f.type === 'checkbox' ? editing[f.key] === true : undefined}
            value={f.type === 'checkbox' ? undefined : text(editing, f.key)}
            onChange={(e) => setEditing({ ...editing, [f.key]: f.type === 'checkbox' ? e.target.checked : e.target.value })} />}
        </label>;
      })}
      <div><button disabled={busy} type="submit">{busy ? 'Guardando…' : 'Guardar'}</button> <button type="button" onClick={() => setEditing(null)}>Cancelar</button></div>
    </form>}
    {loading ? <p>Cargando…</p> : rows.length === 0 ? <p>No hay registros. No se han creado datos de ejemplo.</p> : <div className="negocios-records">
      {rows.map((row) => <article key={row.id}>
        <h3>{text(row, 'nombre') || text(row, 'negocio') || text(row, 'planNombre') || text(row, 'entidad') || text(row, 'tipo')}</h3>
        <p><code>{row.id}</code> · {text(row, 'estado') || text(row, 'estadoPago') || text(row, 'accion')}</p>
        {section === 'negocios' && <>
          <p>{text(row, 'categoria')} · {text(row, 'departamento')}</p>
          <Link href={`/negocios/${row.slug}`}>Abrir perfil</Link>{' '}
          <a href={`/api/admin/negocios-reporte?negocioId=${row.id}&dias=30`}>Reporte CSV 30 días</a>
          <div><button disabled={busy} onClick={() => moderate(row, 'aprobado')}>Aprobar y publicar</button> <button disabled={busy} onClick={() => moderate(row, 'rechazado')}>Rechazar</button> <button disabled={busy} onClick={() => moderate(row, 'suspendido')}>Suspender</button></div>
        </>}
        {section === 'campanas' && <>
          <p>US${Number(row.precioAcordadoUsd).toFixed(2)} · {text(row, 'fechaInicio')} → {text(row, 'fechaVencimiento')}</p>
          <p>{diasParaVencer(text(row, 'fechaVencimiento')) < 0 ? 'Vencida' : `Vence en ${diasParaVencer(text(row, 'fechaVencimiento'))} días`}</p>
          <p>Referencia: {text(row, 'referenciaPago') || 'Sin pago confirmado'}</p>
          <a href={`/api/admin/negocios-reporte?negocioId=${row.negocioId}&campanaId=${row.id}&dias=90`}>Reporte de campaña CSV (90 días)</a>
          {['pagado', 'piloto'].includes(text(row, 'estadoPago')) && <button onClick={() => setEditing({ ...row, id: undefined, renovacionDe: row.id, fechaInicio: '', fechaVencimiento: '', referenciaPago: '', estadoPago: 'pendiente', pagoConfirmado: false })}>Preparar renovación</button>}
        </>}
        {section === 'planes' && <p>US${Number(row.precioUsd).toFixed(2)}/mes · {row.activo ? 'Activo' : 'Inactivo'}</p>}
        {section === 'prospectos' && <><p>{text(row, 'contacto')} · {text(row, 'canal')}</p><p>Seguimiento: {text(row, 'proximoSeguimiento') || 'Sin fecha'} {text(row, 'proximoSeguimiento') && text(row, 'proximoSeguimiento') <= new Date().toISOString().slice(0, 10) && !['ganado', 'perdido'].includes(text(row, 'estado')) ? '· Pendiente de atender' : ''}</p></>}
        {section === 'solicitudes' && <><pre>{JSON.stringify(row.datos, null, 2)}</pre>{row.tipo === 'alta' && <button onClick={() => fromRequest(row)}>Preparar perfil para revisión</button>}<p>Las correcciones se aplican editando el perfil y volviéndolo a aprobar.</p></>}
        {section === 'auditoria' && <><p>{text(row, 'timestamp')} · {text(row, 'actor')}</p><pre>{JSON.stringify(row.diff, null, 2)}</pre><p>Campos: {Array.isArray(row.campos) ? row.campos.join(', ') : ''}</p></>}
        {section !== 'auditoria' && !(section === 'campanas' && ['pagado', 'cancelado', 'piloto'].includes(text(row, 'estadoPago'))) && <button onClick={() => setEditing({ ...row })}>Editar</button>}
      </article>)}
    </div>}
  </main>;
}
