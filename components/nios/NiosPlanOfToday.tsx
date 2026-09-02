'use client';

import { useState } from 'react';
import type { NiosAction } from '@/lib/nios/action-engine';
import { approveNiosAction, rejectNiosAction, approveAllNiosActions } from '@/lib/nios/actions-server';

interface Props {
  actions: NiosAction[];
}

function statusLabel(status: NiosAction['status']): string {
  switch (status) {
    case 'PENDING':
      return 'Pendiente de aprobación';
    case 'APPROVED':
      return 'Aprobada';
    case 'RUNNING':
      return 'En proceso';
    case 'COMPLETED':
      return 'Completada';
    case 'FAILED':
      return 'Falló';
    case 'REJECTED':
      return 'Rechazada';
    default:
      return status;
  }
}

function statusColor(status: NiosAction['status']): string {
  switch (status) {
    case 'PENDING':
      return '#ca8a04';
    case 'APPROVED':
      return '#16a34a';
    case 'RUNNING':
      return '#2563eb';
    case 'COMPLETED':
      return '#16a34a';
    case 'FAILED':
      return '#dc2626';
    case 'REJECTED':
      return '#64748b';
    default:
      return '#64748b';
  }
}

function priorityColor(impact: NiosAction['impact']): string {
  switch (impact) {
    case 'Alto':
      return '#dc2626';
    case 'Medio':
      return '#ca8a04';
    default:
      return '#64748b';
  }
}

export function NiosPlanOfToday({ actions: initialActions }: Props) {
  const [actions, setActions] = useState<NiosAction[]>(initialActions);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  const pending = actions.filter((a) => a.status === 'PENDING');
  const running = actions.filter((a) => a.status === 'RUNNING' || a.status === 'APPROVED');
  const completed = actions.filter((a) => a.status === 'COMPLETED');
  const failed = actions.filter((a) => a.status === 'FAILED');
  const rejected = actions.filter((a) => a.status === 'REJECTED');

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }

  async function handleApprove(id: string) {
    setLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const updated = await approveNiosAction(id, 'panel');
      setActions((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`🟢 Acción aprobada. NIOS la ejecutó.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(`🔴 No se pudo ejecutar: ${message}`);
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleReject(id: string) {
    setLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const updated = await rejectNiosAction(id, 'Rechazado desde el panel', 'panel');
      setActions((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`⏹️ Acción rechazada. NIOS la recordará.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(`🔴 Error al rechazar: ${message}`);
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleApproveAll() {
    if (pending.length === 0) return;
    setLoading({ all: true });
    try {
      const updated = await approveAllNiosActions(pending.map((a) => a.id), 'panel');
      const map = new Map(updated.map((a) => [a.id, a]));
      setActions((prev) => prev.map((a) => (map.has(a.id) ? map.get(a.id)! : a)));
      showToast(`🟢 ${updated.length} acción${updated.length === 1 ? '' : 'es'} aprobadas y ejecutadas.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(`🔴 Error: ${message}`);
    } finally {
      setLoading({});
    }
  }

  function ActionCard({ action }: { action: NiosAction }) {
    const isPending = action.status === 'PENDING';
    return (
      <div
        style={{
          border: '1px solid var(--border)',
          borderLeft: `4px solid ${priorityColor(action.impact)}`,
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 12,
          background: 'var(--ni-bg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{action.title}</div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 999,
              background: statusColor(action.status),
              color: '#fff',
              textTransform: 'uppercase',
            }}
          >
            {statusLabel(action.status)}
          </span>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 6 }}>
          <strong>Por qué:</strong> {action.evidence}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 8 }}>
          <strong>Qué propone:</strong> {action.proposal}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
          <span>
            <strong>Impacto:</strong> {action.impact}
          </span>
          <span>
            <strong>Confianza:</strong> {action.confidence}
          </span>
          <span>
            <strong>Objetivo:</strong> {action.objective}
          </span>
          <span>
            <strong>Métrica:</strong> {action.metric}
          </span>
        </div>
        {isPending ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => handleApprove(action.id)}
              disabled={loading[action.id]}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: 'none',
                background: '#16a34a',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: loading[action.id] ? 0.6 : 1,
              }}
            >
              {loading[action.id] ? 'Ejecutando...' : 'APROBAR'}
            </button>
            <button
              onClick={() => handleReject(action.id)}
              disabled={loading[action.id]}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              RECHAZAR
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {action.status === 'COMPLETED' && action.result?.note ? (
              <span>🟢 {String(action.result.note)}</span>
            ) : action.status === 'FAILED' && action.error ? (
              <span>🔴 {action.error}</span>
            ) : action.status === 'REJECTED' ? (
              <span>⏹️ Rechazada. No se volverá a proponer hoy.</span>
            ) : (
              <span>🟡 {statusLabel(action.status)}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  function HistorySection({
    title,
    emoji,
    items,
  }: {
    title: string;
    emoji: string;
    items: NiosAction[];
  }) {
    if (items.length === 0) return null;
    return (
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>
          {emoji} {title}
        </h3>
        {items.map((a) => (
          <div
            key={a.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 8,
              background: 'rgba(255,255,255,0.03)',
              fontSize: '0.9rem',
            }}
          >
            <div style={{ fontWeight: 700 }}>{a.title}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {a.status === 'COMPLETED' && a.result ? (
                <span>
                  {typeof a.result.note === 'string' ? a.result.note : 'Completada'} — medirá {a.metric}
                </span>
              ) : a.status === 'FAILED' ? (
                <span>{a.error || 'Falló'}</span>
              ) : a.status === 'RUNNING' ? (
                <span>En ejecución...</span>
              ) : (
                <span>{statusLabel(a.status)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section style={{ marginBottom: 28 }}>
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 24,
          background: 'var(--ni-bg)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>🎯 PLAN DE HOY</h2>
          {pending.length > 0 && (
            <button
              onClick={handleApproveAll}
              disabled={loading.all}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#16a34a',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: loading.all ? 0.6 : 1,
              }}
            >
              {loading.all ? 'Aprobando...' : `APROBAR PLAN COMPLETO (${pending.length})`}
            </button>
          )}
        </div>

        {pending.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No hay acciones pendientes de aprobación hoy.</p>
        ) : (
          pending.map((a) => <ActionCard key={a.id} action={a} />)
        )}

        {toast && (
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              padding: '12px 16px',
              borderRadius: 10,
              background: '#16a34a',
              color: '#fff',
              fontWeight: 600,
              zIndex: 1000,
            }}
          >
            {toast}
          </div>
        )}
      </div>

      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 24,
          background: 'var(--ni-bg)',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, marginBottom: 18 }}>🤖 LO QUE NIOS ESTÁ HACIENDO</h2>

        <HistorySection title="EN PROCESO" emoji="🟡" items={running} />
        <HistorySection title="COMPLETADO" emoji="🟢" items={completed} />
        <HistorySection title="FALLÓ" emoji="🔴" items={failed} />
        <HistorySection title="RECHAZADO" emoji="⏹️" items={rejected} />

        {running.length === 0 && completed.length === 0 && failed.length === 0 && rejected.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>Aún no hay acciones en el historial.</p>
        )}
      </div>
    </section>
  );
}
