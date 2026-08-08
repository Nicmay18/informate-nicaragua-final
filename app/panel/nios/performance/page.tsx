import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { getAdminDb } from '@/lib/firebase-admin';

export const metadata: Metadata = {
  title: { absolute: 'NIOS | Performance' },
};

interface TelemetryModule {
  name: string;
  durationMs: number;
  status: 'success' | 'error';
}

interface TelemetryHealth {
  score: number;
  level: string;
  warnings: string[];
  breakdown: Record<string, number>;
}

interface TelemetryData {
  date: string;
  savedAt: string;
  totalDuration: number;
  health: TelemetryHealth;
  firestore: { reads: number; writes: number };
  trafficMigration?: { dailySource: string; fallbackReads: number; migrationHealth: number };
  slowestModules: TelemetryModule[];
  failedModules: TelemetryModule[];
  healthSignals: string[];
  errors: string[];
}

interface ReliabilityData {
  date: string;
  reliabilityScore: number;
  pipeline: {
    success: boolean;
    durationMs: number;
    failedModules: string[];
    weeklyTrend: string;
  };
  trafficMigration: {
    health: number;
    fallbackReads: number;
    trafficDailyCoverage: number;
  };
  firestore: {
    estimatedReads: number;
    estimatedWrites: number;
    collectionGrowth: string;
  };
  warnings: string[];
}

interface NiosAlertData {
  date: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  resolved: boolean;
  createdAt: string;
}

function levelColor(level: string): string {
  switch (level) {
    case 'EXCELENTE': return 'bg-green-100 text-green-800';
    case 'MUY BUENO': return 'bg-emerald-100 text-emerald-800';
    case 'BUENO': return 'bg-blue-100 text-blue-800';
    case 'ACEPTABLE': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-red-100 text-red-800';
  }
}

const getTelemetry = unstable_cache(async (): Promise<TelemetryData | null> => {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection('nios_telemetry')
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    if (snap.empty) return null;

    const doc = snap.docs[0];
    const data = doc.data();
    return data as unknown as TelemetryData;
  } catch {
    return null;
  }
}, ['nios-telemetry-latest'], { revalidate: 300, tags: ['nios-telemetry'] });

const getReliability = unstable_cache(async (): Promise<ReliabilityData | null> => {
  try {
    const db = getAdminDb();
    const { buildReliabilitySnapshot } = await import('@/lib/nios/intelligence/reliability-monitor');
    const snapshot = await buildReliabilitySnapshot(db, 7);
    return snapshot as unknown as ReliabilityData;
  } catch {
    return null;
  }
}, ['nios-reliability-latest'], { revalidate: 300, tags: ['nios-telemetry'] });

const getActiveAlerts = unstable_cache(async (): Promise<NiosAlertData[]> => {
  try {
    const db = getAdminDb();
    const { getActiveAlerts: fetchAlerts } = await import('@/lib/nios/intelligence/alerts');
    return await fetchAlerts(db, 7) as unknown as NiosAlertData[];
  } catch {
    return [];
  }
}, ['nios-alerts-active'], { revalidate: 300, tags: ['nios-telemetry'] });

export default async function NiosPerformancePage() {
  const [data, reliability, alerts] = await Promise.all([
    getTelemetry(),
    getReliability(),
    getActiveAlerts(),
  ]);

  if (!data) {
    return (
      <main className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Performance de NIOS</h1>
        <p className="text-gray-600">
          No hay telemetría disponible. Ejecuta el pipeline al menos una vez.
        </p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Performance de NIOS</h1>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={`rounded-lg p-4 border ${levelColor(data.health.level)}`}>
          <div className="text-sm font-medium uppercase opacity-70">Health Score</div>
          <div className="text-4xl font-bold">{data.health.score}</div>
          <div className="text-sm font-semibold">{data.health.level}</div>
        </div>

        <div className="rounded-lg p-4 border bg-white">
          <div className="text-sm font-medium uppercase text-gray-500">Duración pipeline</div>
          <div className="text-4xl font-bold text-gray-900">{(data.totalDuration / 1000).toFixed(1)}s</div>
          <div className="text-sm text-gray-600">{data.totalDuration} ms</div>
        </div>

        <div className="rounded-lg p-4 border bg-white">
          <div className="text-sm font-medium uppercase text-gray-500">Operaciones Firestore</div>
          <div className="text-4xl font-bold text-gray-900">{data.firestore.reads + data.firestore.writes}</div>
          <div className="text-sm text-gray-600">{data.firestore.reads} lecturas · {data.firestore.writes} escrituras</div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Módulos más lentos</h2>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">Módulo</th>
                <th className="text-right p-3">Tiempo (ms)</th>
                <th className="text-right p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.slowestModules.map((m) => (
                <tr key={m.name} className="border-t">
                  <td className="p-3 font-medium">{m.name}</td>
                  <td className="p-3 text-right">{m.durationMs}</td>
                  <td className={`p-3 text-right font-medium ${m.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                    {m.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {data.failedModules.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-red-700">Módulos con error</h2>
          <ul className="list-disc pl-5 text-red-700">
            {data.failedModules.map((m) => (
              <li key={m.name}>{m.name}</li>
            ))}
          </ul>
        </section>
      )}

      {data.health.warnings.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Alertas activas</h2>
          <ul className="list-disc pl-5 text-amber-700">
            {data.health.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      {data.trafficMigration && (
        <section className="mb-8 rounded border p-4 bg-white">
          <h2 className="text-lg font-semibold mb-3">Migración de tráfico</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Fuente</span>
              <div className="font-medium">{data.trafficMigration.dailySource}</div>
            </div>
            <div>
              <span className="text-gray-500">Fallback reads</span>
              <div className="font-medium">{data.trafficMigration.fallbackReads}</div>
            </div>
            <div>
              <span className="text-gray-500">Health</span>
              <div className={`font-medium ${data.trafficMigration.migrationHealth === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                {data.trafficMigration.migrationHealth}%
              </div>
            </div>
          </div>
        </section>
      )}

      {reliability && (
        <section className="mb-8 rounded border p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-3">Production Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Reliability Score</span>
              <div className={`text-2xl font-bold ${reliability.reliabilityScore >= 90 ? 'text-green-600' : reliability.reliabilityScore >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                {reliability.reliabilityScore}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tendencia 7d</span>
              <div className="font-medium capitalize">{reliability.pipeline.weeklyTrend}</div>
            </div>
            <div>
              <span className="text-gray-500">Última ejecución</span>
              <div className="font-medium">{reliability.pipeline.success ? '✓ OK' : '✗ Falló'}</div>
              <div className="text-xs text-gray-500">{reliability.date}</div>
            </div>
            <div>
              <span className="text-gray-500">Traffic daily coverage</span>
              <div className={`font-medium ${reliability.trafficMigration.trafficDailyCoverage >= 95 ? 'text-green-600' : 'text-amber-600'}`}>
                {reliability.trafficMigration.trafficDailyCoverage}%
              </div>
            </div>
          </div>
          {reliability.warnings.length > 0 && (
            <div className="mt-3">
              <span className="text-xs font-medium text-gray-500 uppercase">Reliability warnings</span>
              <ul className="list-disc pl-5 text-sm text-amber-700 mt-1">
                {reliability.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {alerts.length > 0 && (
        <section className="mb-8 rounded border p-4 bg-red-50">
          <h2 className="text-lg font-semibold mb-3 text-red-800">Alertas activas ({alerts.length})</h2>
          <ul className="space-y-2">
            {alerts.map((a, i) => (
              <li key={i} className={`text-sm p-2 rounded ${a.severity === 'critical' ? 'bg-red-100 text-red-800' : a.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                <span className="font-medium uppercase text-xs">[{a.severity}] {a.category}</span>
                <div>{a.message}</div>
                <div className="text-xs opacity-60">{new Date(a.createdAt).toLocaleString('es-NI')}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="text-xs text-gray-500 mt-8">
        Snapshot: {data.date} · Guardado: {new Date(data.savedAt).toLocaleString('es-NI')}
      </section>
    </main>
  );
}
