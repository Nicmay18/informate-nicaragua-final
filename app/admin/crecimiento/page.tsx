'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Reporte {
  fecha: string;
  fechaLocal: string;
  diaSemana: string;
  dominio: string;
  noticiasExistentes: number;
  ultimosTitulos: string[];
  trendingTopics: { tema: string; demanda: string; competencia: string }[];
  gaps: { oportunidad: string; problema: string; accion: string; impacto: string }[];
  planSemanal: { dia: string; tarea: string; tiempo: string }[];
  tareaHoy: { dia: string; tarea: string; tiempo: string } | null;
  objetivos: { metrica: string; actual: number | string; meta: number | string; como: string }[];
  promptEditorial: string;
  temaDelDia: string;
  distribucionCategorias: Record<string, number>;
}

export default function CrecimientoPage() {
  const [data, setData] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/admin/crecimiento', { cache: 'no-store' })
      .then(r => r.json())
      .then((d: Reporte) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  const copyPrompt = () => {
    if (!data?.promptEditorial) return;
    navigator.clipboard.writeText(data.promptEditorial);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🚀</div>
        <p>Generando reporte forense de crecimiento...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', padding: 40 }}>
      <p style={{ color: '#f87171' }}>Error cargando reporte: {error}</p>
      <Link href="/admin" style={{ color: '#818cf8' }}>← Volver al Admin</Link>
    </div>
  );

  const impactoColor = (impacto: string) => {
    if (impacto === 'Crítico') return '#f87171';
    if (impacto === 'Muy Alto') return '#fb923c';
    if (impacto === 'Alto') return '#facc15';
    return '#94a3b8';
  };

  const demandaIcon = (d: string) => {
    if (d === 'Muy Alta') return '🔴';
    if (d === 'Alta') return '🟠';
    return '🟡';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <header style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: '#f8fafc' }}>🚀 Prompt Forense de Crecimiento</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{data.diaSemana}, {data.fechaLocal} · {data.dominio}</p>
        </div>
        <Link href="/admin" style={{ padding: '8px 16px', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
          ← Volver al Admin
        </Link>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* TAREA DE HOY */}
        {data.tareaHoy && (
          <div style={{ background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)', borderRadius: 16, padding: 24, border: '1px solid #6366f1' }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#c7d2fe', marginBottom: 8 }}>Tu tarea hoy ({data.tareaHoy.dia})</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{data.tareaHoy.tarea}</div>
            <div style={{ fontSize: 13, color: '#c7d2fe' }}>⏱️ Tiempo estimado: {data.tareaHoy.tiempo}</div>
          </div>
        )}

        {/* INVENTARIO */}
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 16, color: '#f8fafc', marginBottom: 16 }}>📑 Inventario de Contenido</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ background: '#0f172a', padding: 16, borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#818cf8' }}>{data.noticiasExistentes}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Noticias indexadas</div>
            </div>
            <div style={{ background: '#0f172a', padding: 16, borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#34d399' }}>{Object.keys(data.distribucionCategorias).length}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Categorías activas</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Últimas noticias:</div>
            {data.ultimosTitulos.slice(0, 5).map((t, i) => (
              <div key={i} style={{ fontSize: 13, color: '#cbd5e1', padding: '4px 0', borderBottom: '1px solid #334155' }}>
                → {t.length > 70 ? t.substring(0, 70) + '...' : t}
              </div>
            ))}
          </div>
        </div>

        {/* TENDENCIAS */}
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 16, color: '#f8fafc', marginBottom: 16 }}>🔥 Tendencias de Búsqueda (Nicaragua)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.trendingTopics.map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '10px 14px', borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: '#e2e8f0' }}>{demandaIcon(t.demanda)} {t.tema}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Demanda: <strong style={{ color: t.demanda === 'Muy Alta' ? '#f87171' : '#facc15' }}>{t.demanda}</strong> | Competencia: {t.competencia}</span>
              </div>
            ))}
          </div>
        </div>

        {/* GAP ANALYSIS */}
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 16, color: '#f8fafc', marginBottom: 16 }}>🕵️ Gap Analysis — Contenido Faltante</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.gaps.map((g, i) => (
              <div key={i} style={{ background: '#0f172a', padding: 14, borderRadius: 8, borderLeft: `4px solid ${impactoColor(g.impacto)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>#{i + 1} {g.oportunidad}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: impactoColor(g.impacto), color: '#0f172a', fontWeight: 700 }}>{g.impacto}</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>❌ {g.problema}</div>
                <div style={{ fontSize: 12, color: '#34d399' }}>✅ {g.accion}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MÉTRICAS OBJETIVO */}
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 16, color: '#f8fafc', marginBottom: 16 }}>🎯 Métricas Objetivo (Próximos 30 días)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {data.objetivos.map((o, i) => (
              <div key={i} style={{ background: '#0f172a', padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{o.metrica}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>
                  {typeof o.actual === 'number' && typeof o.meta === 'number'
                    ? `${o.actual} → ${o.meta}`
                    : `${o.actual} → ${o.meta}`}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>🛠️ {o.como}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PROMPT EDITORIAL */}
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, color: '#f8fafc' }}>✍️ Prompt Editorial del Día</h2>
            <button onClick={copyPrompt} style={{ padding: '6px 14px', background: copied ? '#059669' : '#4f46e5', color: '#fff', borderRadius: 6, border: 'none', fontSize: 13, cursor: 'pointer' }}>
              {copied ? '✅ Copiado' : '📋 Copiar'}
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>Tema sugerido: <strong style={{ color: '#facc15' }}>{data.temaDelDia}</strong></div>
          <pre style={{ background: '#0f172a', padding: 16, borderRadius: 8, fontSize: 12, color: '#e2e8f0', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', border: '1px solid #334155', lineHeight: 1.6 }}>
            {data.promptEditorial}
          </pre>
        </div>

        {/* PLAN SEMANAL COMPLETO */}
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 16, color: '#f8fafc', marginBottom: 16 }}>📅 Plan Semanal Completo</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.planSemanal.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0f172a', padding: '10px 14px', borderRadius: 8, border: data.tareaHoy?.dia === p.dia ? '1px solid #4f46e5' : '1px solid transparent' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: data.tareaHoy?.dia === p.dia ? '#818cf8' : '#64748b', minWidth: 80 }}>{p.dia}</div>
                <div style={{ flex: 1, fontSize: 13, color: '#e2e8f0' }}>{p.tarea}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.tiempo}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: 12 }}>
          Reporte generado automáticamente · Se actualiza cada 24 horas
        </div>
      </main>
    </div>
  );
}
