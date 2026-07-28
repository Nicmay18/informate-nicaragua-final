'use client';

import { useState, useEffect } from 'react';
import { getAdminToken } from '@/hooks/useAdminFetch';

interface DashboardData {
  periodo: { dias: number; desde: string };
  notas: { analizadas: number; publicadas: number; rechazadas: number };
  correcciones: {
    automaticas: number;
    humanas: number;
    repetidas: number;
    patronesAprendidos: number;
  };
  predicciones: {
    facebook: { total: number; acertadas: number; precision: number };
    discover: { total: number; acertadas: number; precision: number };
    portada: { total: number; acertadas: number; precision: number };
  };
  erroresFrecuentes: { campo: string; count: number }[];
  calificacionPeriodistas: {
    promedio: number;
    total: number;
    razones: { razon: string; count: number }[];
  };
  scoreSemanal: { semana: string; score: number }[];
  categoriasDistribucion: Record<string, number>;
}

const RAZONES_LABELS: Record<string, string> = {
  buen_contexto: 'Buen contexto',
  buen_titulo: 'Buen título',
  buena_estructura: 'Buena estructura',
  explico_bien: 'Explicó bien',
  perdio_tiempo: 'Perdió tiempo',
  no_aporto: 'No aportó nada',
};

export default function MeniDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dias, setDias] = useState(30);

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      setError(null);
      try {
        const token = getAdminToken();
        const res = await fetch(`/api/admin/meni-dashboard?dias=${dias}`, {
          headers: { 'x-admin-token': token },
        });
        if (!res.ok) throw new Error('Error al cargar dashboard');
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [dias]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Cargando dashboard de MENI...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">{error || 'Sin datos'}</p>
      </div>
    );
  }

  const precisionColor = (p: number) =>
    p >= 80 ? 'text-green-600' : p >= 60 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard de Desempeño MENI</h1>
            <p className="text-sm text-slate-500">El sistema midindose a sí mismo</p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDias(d)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  dias === d
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {d} días
              </button>
            ))}
          </div>
        </div>

        {/* 1. Notas analizadas */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Notas analizadas" value={data.notas.analizadas} color="indigo" />
          <StatCard label="Publicadas" value={data.notas.publicadas} color="green" />
          <StatCard label="Rechazadas" value={data.notas.rechazadas} color="red" />
          <StatCard
            label="Tasa de aprobación"
            value={
              data.notas.analizadas > 0
                ? `${Math.round((data.notas.publicadas / data.notas.analizadas) * 100)}%`
                : '—'
            }
            color="blue"
          />
        </div>

        {/* 2. Correcciones */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Correcciones</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Automáticas" value={data.correcciones.automaticas} color="blue" />
            <StatCard label="Humanas" value={data.correcciones.humanas} color="amber" />
            <StatCard label="Repetidas" value={data.correcciones.repetidas} color="red" />
            <StatCard label="Patrones aprendidos" value={data.correcciones.patronesAprendidos} color="purple" />
          </div>
        </div>

        {/* 3. Predicciones */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Precisión de Predicciones
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <PredictionCard
              title="Facebook"
              total={data.predicciones.facebook.total}
              acertadas={data.predicciones.facebook.acertadas}
              precision={data.predicciones.facebook.precision}
              colorClass={precisionColor(data.predicciones.facebook.precision)}
            />
            <PredictionCard
              title="Google Discover"
              total={data.predicciones.discover.total}
              acertadas={data.predicciones.discover.acertadas}
              precision={data.predicciones.discover.precision}
              colorClass={precisionColor(data.predicciones.discover.precision)}
            />
            <PredictionCard
              title="Portada"
              total={data.predicciones.portada.total}
              acertadas={data.predicciones.portada.acertadas}
              precision={data.predicciones.portada.precision}
              colorClass={precisionColor(data.predicciones.portada.precision)}
            />
          </div>
          {data.predicciones.facebook.total === 0 &&
            data.predicciones.discover.total === 0 &&
            data.predicciones.portada.total === 0 && (
              <p className="mt-4 text-sm text-slate-400">
                Sin datos de predicciones todavía. Las predicciones se registran cuando se guarda el veredicto
                ejecutivo y se comparan con métricas reales posteriormente.
              </p>
            )}
        </div>

        {/* 4. Errores frecuentes */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Errores Frecuentes de MENI
          </h2>
          {data.erroresFrecuentes.length > 0 ? (
            <div className="space-y-2">
              {data.erroresFrecuentes.map((err, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3"
                >
                  <span className="text-sm font-medium text-slate-700 capitalize">
                    {err.campo.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-bold text-red-600">{err.count} correcciones</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Sin correcciones humanas registradas todavía. Usa el widget de calificación después de publicar.
            </p>
          )}
        </div>

        {/* 5. Calificación de periodistas */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Calificación de los Periodistas
          </h2>
          {data.calificacionPeriodistas.total > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-slate-800">
                  {data.calificacionPeriodistas.promedio.toFixed(1)}
                </span>
                <span className="text-2xl text-amber-400">
                  {'★'.repeat(Math.round(data.calificacionPeriodistas.promedio))}
                  <span className="text-slate-300">
                    {'★'.repeat(5 - Math.round(data.calificacionPeriodistas.promedio))}
                  </span>
                </span>
                <span className="text-sm text-slate-500">
                  {data.calificacionPeriodistas.total} calificaciones
                </span>
              </div>
              {data.calificacionPeriodistas.razones.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Razones más frecuentes</p>
                  {data.calificacionPeriodistas.razones.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">
                        {RAZONES_LABELS[r.razon] || r.razon}
                      </span>
                      <span className="font-semibold text-slate-500">{r.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Sin calificaciones todavía. Los periodistas pueden calificar a MENI después de publicar cada nota.
            </p>
          )}
        </div>

        {/* 6. Score semanal */}
        {data.scoreSemanal.length > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Evolución del Score de MENI
            </h2>
            <div className="space-y-2">
              {data.scoreSemanal.map((s, i) => {
                const prev = i > 0 ? data.scoreSemanal[i - 1].score : null;
                const delta = prev !== null ? s.score - prev : 0;
                return (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{s.semana}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800">{s.score}%</span>
                      {delta !== 0 && (
                        <span className={`text-xs font-semibold ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {delta > 0 ? '↑' : '↓'} {Math.abs(delta)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. Distribución por categoría */}
        {Object.keys(data.categoriasDistribucion).length > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Distribución por Categoría
            </h2>
            <div className="space-y-2">
              {Object.entries(data.categoriasDistribucion)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => {
                  const max = Math.max(...Object.values(data.categoriasDistribucion));
                  const pct = max > 0 ? (count / max) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="w-32 text-sm text-slate-600">{cat}</span>
                      <div className="h-6 flex-1 rounded bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-semibold text-slate-700">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-4">
          MENI Editor Jefe — Dashboard de Desempeño · Últimos {dias} días
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: 'indigo' | 'green' | 'red' | 'blue' | 'amber' | 'purple';
}) {
  const colors = {
    indigo: 'border-indigo-500 bg-indigo-50',
    green: 'border-green-500 bg-green-50',
    red: 'border-red-500 bg-red-50',
    blue: 'border-blue-500 bg-blue-50',
    amber: 'border-amber-500 bg-amber-50',
    purple: 'border-purple-500 bg-purple-50',
  };
  return (
    <div className={`rounded-xl border-l-4 p-4 shadow-sm ${colors[color]}`}>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function PredictionCard({
  title,
  total,
  acertadas,
  precision,
  colorClass,
}: {
  title: string;
  total: number;
  acertadas: number;
  precision: number;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {total > 0 ? (
        <>
          <p className={`mt-2 text-3xl font-bold ${colorClass}`}>{precision}%</p>
          <p className="mt-1 text-xs text-slate-500">
            {acertadas} de {total} predicciones acertadas
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-400">Sin datos</p>
      )}
    </div>
  );
}
