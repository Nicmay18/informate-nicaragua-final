'use client';

import { useEffect, useState } from 'react';

interface Metricas {
  totalNoticias: number;
  promedioPalabras: number;
  thinContent: { count: number; porcentaje: number; ids: string[] };
  conNoindex: number;
  sinImagen: number;
  sinAutor: number;
  sinFechaActualizacion: number;
  promedioStrong: number;
  promedioBlockquotes: number;
  distribucionCategorias: Record<string, number>;
  scoreDominio: number;
  alertas: string[];
}

export default function DashboardCalidad() {
  const [data, setData] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard-calidad')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-white">Cargando metricas...</div>;
  if (!data) return <div className="p-6 text-red-400">Error cargando dashboard</div>;

  const colorScore =
    data.scoreDominio >= 85
      ? 'text-green-400'
      : data.scoreDominio >= 70
        ? 'text-yellow-400'
        : 'text-red-400';

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white">Dashboard de Calidad del Dominio</h2>

      {/* Score principal */}
      <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Score de Dominio</p>
            <p className={`text-5xl font-bold ${colorScore}`}>{data.scoreDominio}/100</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Total Noticias</p>
            <p className="text-3xl font-bold text-white">{data.totalNoticias}</p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {data.alertas.length > 0 && (
        <div className="space-y-2">
          {data.alertas.map((alerta, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-sm ${
                alerta.includes('bloquea') || alerta.includes('No solicites')
                  ? 'bg-red-900/30 border border-red-500 text-red-300'
                  : alerta.includes('comprometido') || alerta.includes('requiere')
                    ? 'bg-yellow-900/30 border border-yellow-500 text-yellow-300'
                    : 'bg-green-900/30 border border-green-500 text-green-300'
              }`}
            >
              {alerta}
            </div>
          ))}
        </div>
      )}

      {/* Metricas grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard titulo="Promedio Palabras" valor={data.promedioPalabras} meta="Meta: 500+" />
        <MetricCard
          titulo="Thin Content"
          valor={`${data.thinContent.porcentaje}%`}
          meta={`${data.thinContent.count} articulos`}
          alerta={data.thinContent.count > 0}
        />
        <MetricCard titulo="Sin Imagen" valor={data.sinImagen} alerta={data.sinImagen > 5} />
        <MetricCard titulo="Sin Autor" valor={data.sinAutor} alerta={data.sinAutor > 0} />
        <MetricCard
          titulo="Sin Fecha Act."
          valor={data.sinFechaActualizacion}
          alerta={data.sinFechaActualizacion > 10}
        />
        <MetricCard titulo="Con Noindex" valor={data.conNoindex} />
        <MetricCard
          titulo="Avg Strong"
          valor={data.promedioStrong}
          meta="Meta: 15+"
          alerta={data.promedioStrong < 10}
        />
        <MetricCard
          titulo="Avg Blockquotes"
          valor={data.promedioBlockquotes}
          meta="Meta: 2+"
          alerta={data.promedioBlockquotes < 2}
        />
      </div>

      {/* Distribucion categorias */}
      <div className="p-4 bg-gray-800 rounded-lg">
        <h3 className="font-bold text-white mb-3">Distribucion por Categoria</h3>
        <div className="space-y-2">
          {Object.entries(data.distribucionCategorias).map(([cat, count]) => (
            <div key={cat} className="flex items-center">
              <span className="text-gray-300 text-sm w-32">{cat}</span>
              <div className="flex-1 h-4 bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded"
                  style={{ width: `${(count / data.totalNoticias) * 100}%` }}
                />
              </div>
              <span className="text-gray-400 text-sm ml-2 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  titulo,
  valor,
  meta,
  alerta,
}: {
  titulo: string;
  valor: string | number;
  meta?: string;
  alerta?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-lg border ${alerta ? 'bg-red-900/20 border-red-500' : 'bg-gray-800 border-gray-700'}`}
    >
      <p className="text-gray-400 text-xs uppercase">{titulo}</p>
      <p className={`text-2xl font-bold ${alerta ? 'text-red-400' : 'text-white'}`}>{valor}</p>
      {meta && <p className="text-gray-500 text-xs">{meta}</p>}
    </div>
  );
}
