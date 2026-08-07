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

export default async function NiosPerformancePage() {
  const data = await getTelemetry();

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

      <section className="text-xs text-gray-500 mt-8">
        Snapshot: {data.date} · Guardado: {new Date(data.savedAt).toLocaleString('es-NI')}
      </section>
    </main>
  );
}
