'use client';

import { useState } from 'react';
import type { ContentRecoveryReport, RecoveryArticle } from '@/lib/nios/intelligence/types';

interface Props {
  recovery: ContentRecoveryReport | null;
  snapshotDate: string | null;
}

export default function RecoveryQueueClient({ recovery, snapshotDate }: Props) {
  const [filter, setFilter] = useState<'' | 'red' | 'yellow' | 'green'>('');
  const [search, setSearch] = useState('');

  if (!recovery) {
    return (
      <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>
          Recovery Queue
        </h1>
        <div style={{
          padding: '2rem',
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 8,
          color: '#92400e',
        }}>
          <p style={{ fontWeight: 600 }}>Datos insuficientes para evaluar.</p>
          <p style={{ fontSize: '0.875rem' }}>
            Ejecuta el pipeline de recolección con POST <code>/api/admin/nios-collect</code>.
          </p>
        </div>
      </div>
    );
  }

  const filtered = recovery.articles
    .filter(a => (filter ? a.status === filter : true))
    .filter(a => a.titulo.toLowerCase().includes(search.toLowerCase()) || a.slug.toLowerCase().includes(search.toLowerCase()));

  const display = filtered.slice(0, 100);

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
        Recovery Queue
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Snapshot: {snapshotDate || 'N/A'} | {recovery.totalArticles} analizados
      </p>

      {/* Resumen */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem',
      }}>
        <Metric label="Total" value={recovery.totalArticles} color="#64748b" />
        <Metric label="GREEN" value={`${recovery.greenCount} (${recovery.greenPct}%)`} color="#22c55e" />
        <Metric label="YELLOW" value={`${recovery.yellowCount} (${recovery.yellowPct}%)`} color="#f59e0b" />
        <Metric label="RED" value={`${recovery.redCount} (${recovery.redPct}%)`} color="#ef4444" />
        <Metric label="Promedio" value={`${recovery.avgRecoveryScore}/100`} color="#0f766e" />
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar título o slug"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #e2e8f0', minWidth: 240 }}
        />
        {(['', 'red', 'yellow', 'green'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #e2e8f0',
              background: filter === s ? '#f1f5f9' : '#fff', cursor: 'pointer',
            }}
          >
            {s === '' ? 'Todos' : s.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>URL / Título</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Categoría</th>
              <th style={{ textAlign: 'right', padding: '0.5rem' }}>MENI</th>
              <th style={{ textAlign: 'right', padding: '0.5rem' }}>G.Trust</th>
              <th style={{ textAlign: 'right', padding: '0.5rem' }}>Imp.</th>
              <th style={{ textAlign: 'right', padding: '0.5rem' }}>CTR</th>
              <th style={{ textAlign: 'right', padding: '0.5rem' }}>Eng.</th>
              <th style={{ textAlign: 'right', padding: '0.5rem' }}>Rec.</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Problema</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {display.map(a => (
              <tr key={a.slug} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.titulo}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.slug}</div>
                </td>
                <td style={{ padding: '0.5rem' }}>{a.categoria}</td>
                <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.scoreMeni}</td>
                <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.googleTrustScore}</td>
                <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.gscImpressions.toLocaleString()}</td>
                <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.gscCtr}%</td>
                <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.ga4AvgEngagementTimeSec}s</td>
                <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                  <StatusBadge status={a.status} />
                </td>
                <td style={{ padding: '0.5rem', maxWidth: 220 }}>{a.mainProblem}</td>
                <td style={{ padding: '0.5rem', maxWidth: 260 }}>{a.recommendedAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      padding: '1rem', background: '#fff', borderRadius: 8,
      border: '1px solid #e2e8f0', textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: RecoveryArticle['status'] }) {
  const color = status === 'green' ? '#22c55e' : status === 'yellow' ? '#f59e0b' : '#ef4444';
  return (
    <span style={{
      color, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem',
    }}>
      {status}
    </span>
  );
}
