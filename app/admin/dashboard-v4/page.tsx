'use client';

import { useState, useEffect } from 'react';
import type { MetricasGlobales } from '@/lib/editor-jefe-v4/metrics';
import type { ShadowLogEntry } from '@/lib/editor-jefe-v4/shadow-logger';

export default function DashboardV4() {
  const [metricas, setMetricas] = useState<MetricasGlobales | null>(null);
  const [logsRecientes, setLogsRecientes] = useState<ShadowLogEntry[]>([]);
  const [cargando, setCargando] = useState(true);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState<ShadowLogEntry | null>(null);
  const [recomendacionesRepetidas, setRecomendacionesRepetidas] = useState<{ texto: string; frecuencia: number }[]>([]);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/dashboard-v4');
      const data = await res.json();
      setMetricas(data.metricas);
      setLogsRecientes(data.logsRecientes || []);

      // Calcular recomendaciones repetidas
      const recCount: Record<string, number> = {};
      for (const log of data.logsRecientes || []) {
        for (const obs of log.observaciones || []) {
          recCount[obs] = (recCount[obs] || 0) + 1;
        }
      }
      const sorted = Object.entries(recCount)
        .map(([texto, frecuencia]) => ({ texto, frecuencia }))
        .sort((a, b) => b.frecuencia - a.frecuencia)
        .slice(0, 10);
      setRecomendacionesRepetidas(sorted);
    } catch (error) {
      console.error(error);
    }
    setCargando(false);
  };

  const cargarDetalle = async (slug: string) => {
    try {
      const res = await fetch(`/api/admin/shadow-detail?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setArticuloSeleccionado(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  if (cargando) {
    return (
      <div className="p-8 bg-gray-900 rounded-lg text-white">
        <p className="text-gray-400 animate-pulse">Cargando dashboard...</p>
      </div>
    );
  }

  if (!metricas) {
    return (
      <div className="p-8 bg-gray-900 rounded-lg text-white">
        <p className="text-gray-400">No hay datos disponibles. Ejecuta análisis en modo paralelo primero.</p>
      </div>
    );
  }

  const veredictoColor: Record<string, string> = {
    cobertura_especial: 'bg-purple-600',
    portada: 'bg-green-600',
    publicar_destacado: 'bg-green-600',
    publicar_estandar: 'bg-blue-600',
    publicar_breve: 'bg-yellow-500 text-black',
    no_publicar: 'bg-red-600',
    EDITOR_INCONSISTENT: 'bg-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">📊 Dashboard de Calidad Editorial V4</h2>
        <button
          onClick={cargar}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Análisis totales" value={metricas.totalAnalisis.toString()} color="bg-blue-600" />
        <KPI label="Score promedio V4" value={metricas.scorePromedioV4.toFixed(1)} color="bg-purple-600" />
        <KPI label="Coincidencia V3-V4" value={`${metricas.coincidenciaGlobalV3V4.toFixed(1)}%`} color={metricas.coincidenciaGlobalV3V4 >= 70 ? 'bg-green-600' : 'bg-yellow-600'} />
        <KPI label="Consistencia OK" value={`${metricas.consistenciaOkPorcentaje.toFixed(1)}%`} color={metricas.consistenciaOkPorcentaje >= 95 ? 'bg-green-600' : 'bg-red-600'} />
      </div>

      {/* Tiempos */}
      <div className="grid grid-cols-2 gap-4">
        <KPI label="Tiempo promedio V4" value={`${metricas.tiempoPromedioV4Ms.toFixed(0)}ms`} color="bg-cyan-700" />
        <KPI label="Tiempo promedio V3" value={metricas.tiempoPromedioV3Ms !== null ? `${metricas.tiempoPromedioV3Ms.toFixed(0)}ms` : 'N/A'} color="bg-cyan-700" />
      </div>

      {/* Distribución de veredictos */}
      <div className="p-5 bg-gray-900/60 rounded-lg border border-gray-700">
        <h3 className="font-bold text-white mb-3">Distribución de veredictos</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(metricas.distribucionVeredictos).map(([v, count]) => (
            <span key={v} className={`px-3 py-1 rounded text-sm font-bold text-white ${veredictoColor[v] || 'bg-gray-700'}`}>
              {v}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Reglas que más penalizan */}
      {metricas.reglasQueMasPenalizan.length > 0 && (
        <div className="p-5 bg-gray-900/60 rounded-lg border border-gray-700">
          <h3 className="font-bold text-white mb-3">¿Cuáles reglas aparecen más?</h3>
          <div className="space-y-2">
            {metricas.reglasQueMasPenalizan.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{r.regla}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (r.frecuencia / metricas.totalAnalisis) * 100)}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-xs w-8 text-right">{r.frecuencia}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendaciones repetidas */}
      {recomendacionesRepetidas.length > 0 && (
        <div className="p-5 bg-gray-900/60 rounded-lg border border-gray-700">
          <h3 className="font-bold text-white mb-3">¿Qué recomendaciones se repiten?</h3>
          <div className="space-y-2">
            {recomendacionesRepetidas.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate max-w-md">{r.texto}</span>
                <span className="text-gray-400 text-xs w-8 text-right">{r.frecuencia}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Métricas por categoría */}
      <div className="p-5 bg-gray-900/60 rounded-lg border border-gray-700">
        <h3 className="font-bold text-white mb-3">¿Cuál categoría obtiene mejores scores?</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-2">Categoría</th>
                <th className="pb-2 text-center">Total</th>
                <th className="pb-2 text-center">Score V4</th>
                <th className="pb-2 text-center">σ V4</th>
                <th className="pb-2 text-center">FP</th>
                <th className="pb-2 text-center">FN</th>
                <th className="pb-2 text-center">Coinc. V3</th>
                <th className="pb-2 text-center">Tiempo V4</th>
              </tr>
            </thead>
            <tbody>
              {[...metricas.metricasPorCategoria].sort((a, b) => b.scorePromedioV4 - a.scorePromedioV4).map(m => (
                <tr key={m.categoria} className="border-b border-gray-800">
                  <td className="py-2 text-gray-200">{m.categoria}</td>
                  <td className="py-2 text-center text-gray-300">{m.total}</td>
                  <td className="py-2 text-center text-purple-300 font-mono">{m.scorePromedioV4.toFixed(1)}</td>
                  <td className="py-2 text-center text-gray-400 font-mono">{m.desviacionEstandarV4.toFixed(1)}</td>
                  <td className={`py-2 text-center font-mono ${m.falsosPositivos > 0 ? 'text-red-400' : 'text-gray-500'}`}>{m.falsosPositivos}</td>
                  <td className={`py-2 text-center font-mono ${m.falsosNegativos > 0 ? 'text-red-400' : 'text-gray-500'}`}>{m.falsosNegativos}</td>
                  <td className="py-2 text-center text-gray-300">{m.coincidenciaV3V4.toFixed(0)}%</td>
                  <td className="py-2 text-center text-cyan-300 font-mono">{m.tiempoPromedioV4Ms.toFixed(0)}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs recientes */}
      {logsRecientes.length > 0 && (
        <div className="p-5 bg-gray-900/60 rounded-lg border border-gray-700">
          <h3 className="font-bold text-white mb-3">Análisis recientes (shadow mode)</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logsRecientes.map((log, i) => (
              <div key={i} className="bg-gray-800/50 p-2 rounded text-xs flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 truncate">{log.titulo}</p>
                  <p className="text-gray-500">
                    {log.categoriaDetectadaV4} · V4: {log.scoreV4} · V3: {log.scoreV3 ?? 'N/A'}
                    {log.moduloMayorDiferencia && ` · Mayor diff: ${log.moduloMayorDiferencia}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {!log.consistenciaOk && <span className="text-red-400">⚠️</span>}
                  {log.coinciden ? <span className="text-green-400">✓</span> : <span className="text-yellow-400">~</span>}
                  <button
                    onClick={() => cargarDetalle(log.slug)}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalle del artículo seleccionado */}
      {articuloSeleccionado && (
        <div className="p-5 bg-blue-900/20 border border-blue-500 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-blue-300">Detalle del artículo</h3>
            <button
              onClick={() => setArticuloSeleccionado(null)}
              className="text-xs text-gray-400 hover:text-white"
            >
              ✕ Cerrar
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
            <div className="bg-gray-800/50 p-2 rounded">
              <p className="text-xs text-gray-400">Score V4</p>
              <p className="text-lg font-bold text-purple-300">{articuloSeleccionado.scoreV4}</p>
            </div>
            <div className="bg-gray-800/50 p-2 rounded">
              <p className="text-xs text-gray-400">Veredicto</p>
              <p className="text-sm font-bold text-white">{articuloSeleccionado.veredictoV4}</p>
            </div>
            <div className="bg-gray-800/50 p-2 rounded">
              <p className="text-xs text-gray-400">Palabras</p>
              <p className="text-sm text-gray-300">{articuloSeleccionado.estructura.palabraCount}</p>
            </div>
            <div className="bg-gray-800/50 p-2 rounded">
              <p className="text-xs text-gray-400">Fuentes</p>
              <p className="text-sm text-gray-300">{articuloSeleccionado.fuentes.numeroFuentes}</p>
            </div>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p><strong>H2:</strong> {articuloSeleccionado.estructura.h2Count} · <strong>Strong:</strong> {articuloSeleccionado.estructura.strongCount}</p>
            <p><strong>Fuentes detectadas:</strong> {articuloSeleccionado.fuentes.fuentesDetectadas.join(', ') || 'Ninguna'}</p>
            <p><strong>Fuente propia:</strong> {articuloSeleccionado.fuentes.tieneFuentePropia ? 'Sí' : 'No'}</p>
            <p><strong>Seguimiento:</strong> {articuloSeleccionado.seguimiento.tieneSeguimiento ? 'Sí' : 'No'} · <strong>Actualizable:</strong> {articuloSeleccionado.seguimiento.actualizable ? 'Sí' : 'No'}</p>
            <p><strong>Utilidad:</strong> {articuloSeleccionado.utilidad.tieneServicio ? 'Servicio' : ''} {articuloSeleccionado.utilidad.tieneRecomendaciones ? '· Recomendaciones' : ''}</p>
          </div>
        </div>
      )}

      {/* Checklist FASE 9 */}
      <div className="p-5 bg-gray-900/60 rounded-lg border border-gray-700">
        <h3 className="font-bold text-white mb-3">Checklist antes de retirar V3 (FASE 9)</h3>
        <ul className="space-y-2 text-sm">
          <ChecklistItem ok={metricas.inconsistenciasDetectadas === 0} label="Sin contradicciones internas" />
          <ChecklistItem ok={metricas.consistenciaOkPorcentaje >= 95} label={`Consistency Engine ≥95% (${metricas.consistenciaOkPorcentaje.toFixed(1)}%)`} />
          <ChecklistItem ok={metricas.coincidenciaGlobalV3V4 >= 70} label={`Coincidencia V3-V4 ≥70% (${metricas.coincidenciaGlobalV3V4.toFixed(1)}%)`} />
          <ChecklistItem ok={metricas.tiempoPromedioV4Ms < (metricas.tiempoPromedioV3Ms ?? 9999)} label="V4 no degrada rendimiento vs V3" />
          <ChecklistItem ok={metricas.totalAnalisis >= 100} label={`Dataset ≥100 análisis (${metricas.totalAnalisis})`} />
        </ul>
      </div>
    </div>
  );
}

function KPI({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`p-4 rounded-lg ${color} text-white`}>
      <p className="text-xs opacity-90 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={ok ? 'text-green-400' : 'text-red-400'}>{ok ? '✅' : '❌'}</span>
      <span className={ok ? 'text-gray-300' : 'text-red-300'}>{label}</span>
    </li>
  );
}
