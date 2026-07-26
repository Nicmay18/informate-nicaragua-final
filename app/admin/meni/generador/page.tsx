'use client';

import { useState } from 'react';
import { getAdminToken } from '@/hooks/useAdminFetch';
import type { MeniAutonomousResult } from '@/lib/meni/editor-autonomo/types';

export default function MeniGeneradorPage() {
  const [fuente, setFuente] = useState('');
  const [categoriaSugerida, setCategoriaSugerida] = useState('');
  const [url, setUrl] = useState('');
  const [idBorrador, setIdBorrador] = useState('');
  const [resultado, setResultado] = useState<MeniAutonomousResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const generar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMensaje(null);
    setResultado(null);
    try {
      const token = getAdminToken();
      const res = await fetch('/api/admin/meni/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ fuente, categoriaSugerida, url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setResultado(data.resultado as MeniAutonomousResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const publicar = async () => {
    if (!resultado || !idBorrador.trim()) return;
    setPublicando(true);
    setError(null);
    setMensaje(null);
    try {
      const token = getAdminToken();
      const res = await fetch('/api/admin/guardar-directo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          id: idBorrador.trim(),
          titulo: resultado.tituloSEO,
          contenido: resultado.articuloCompleto,
          resumen: resultado.metaDescripcion,
          categoria: resultado.categoria,
          departamento: resultado.departamento,
          slug: resultado.slug,
          palabrasClave: resultado.tags,
          imagen: '',
          publicado: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setMensaje(`Publicado: ${data.mensaje}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setPublicando(false);
    }
  };

  const colorScore = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <main className="max-w-5xl mx-auto p-6 text-gray-100 space-y-8">
      <h1 className="text-2xl font-bold text-white border-b border-gray-700 pb-2">MENI Editor Jefe Autónomo</h1>

      <form onSubmit={generar} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Noticia / comunicado / enlace en bruto</label>
          <textarea
            value={fuente}
            onChange={(e) => setFuente(e.target.value)}
            rows={8}
            className="w-full rounded bg-gray-900 border border-gray-700 p-3 text-sm"
            placeholder="Pegue aquí el texto o datos preliminares..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">URL de la fuente (opcional)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded bg-gray-900 border border-gray-700 p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Categoría sugerida (opcional)</label>
            <input
              value={categoriaSugerida}
              onChange={(e) => setCategoriaSugerida(e.target.value)}
              className="w-full rounded bg-gray-900 border border-gray-700 p-2 text-sm"
              placeholder="Ej: Nacionales"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold transition"
        >
          {loading ? 'Generando...' : 'Generar con MENI'}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded bg-red-900/20 border border-red-500/40 text-red-300">{error}</div>
      )}

      {mensaje && (
        <div className="p-4 rounded bg-green-900/20 border border-green-500/40 text-green-300">{mensaje}</div>
      )}

      {resultado && (
        <div className="space-y-8">
          <section className="p-4 rounded bg-gray-800/50 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-3">Diagnóstico MENI</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Score</p>
                <p className={`text-3xl font-bold ${colorScore(resultado.scoreMeni)}`}>{resultado.scoreMeni}</p>
              </div>
              <div>
                <p className="text-gray-400">Aprobado</p>
                <p className={resultado.aprobado ? 'text-green-400' : 'text-red-400'}>
                  {resultado.aprobado ? 'Sí' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Riesgo editorial</p>
                <p>{resultado.riesgoEditorial}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-300">{resultado.diagnosticoEditorial}</p>
            {resultado._error && <p className="mt-2 text-xs text-red-400">{resultado._error}</p>}
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Artículo generado</h2>
            <Fila label="Título SEO" value={resultado.tituloSEO} />
            <Fila label="Bajada" value={resultado.bajada} />
            <Fila label="Meta" value={resultado.metaDescripcion} />
            <Fila label="Slug" value={resultado.slug} />
            <Fila label="Categoría" value={resultado.categoria} />
            <Fila label="Departamento" value={resultado.departamento || '—'} />
            <Fila label="Tags" value={resultado.tags.join(', ')} />
            <div className="p-3 rounded bg-gray-900 border border-gray-700 prose prose-invert max-w-none text-sm">
              <div dangerouslySetInnerHTML={{ __html: resultado.articuloCompleto }} />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded bg-gray-900 border border-gray-700">
              <p className="text-gray-400">Facebook</p>
              <p className="mt-1 whitespace-pre-wrap">{resultado.copyFacebook}</p>
            </div>
            <div className="p-3 rounded bg-gray-900 border border-gray-700">
              <p className="text-gray-400">WhatsApp</p>
              <p className="mt-1 whitespace-pre-wrap">{resultado.copyWhatsApp}</p>
            </div>
            <div className="p-3 rounded bg-gray-900 border border-gray-700">
              <p className="text-gray-400">Telegram</p>
              <p className="mt-1 whitespace-pre-wrap">{resultado.copyTelegram}</p>
            </div>
            <div className="p-3 rounded bg-gray-900 border border-gray-700">
              <p className="text-gray-400">Prompt imagen</p>
              <p className="mt-1">{resultado.promptImagenIA}</p>
            </div>
          </section>

          {resultado.recomendaciones.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-2">Recomendaciones</h3>
              <ul className="space-y-1 text-yellow-200 text-sm">
                {resultado.recomendaciones.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </section>
          )}

          {resultado.aprobado && (
            <section className="p-4 rounded bg-green-900/20 border border-green-500/40">
              <h3 className="text-lg font-semibold text-white mb-2">Publicación condicional</h3>
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <input
                  value={idBorrador}
                  onChange={(e) => setIdBorrador(e.target.value)}
                  className="flex-1 rounded bg-gray-900 border border-gray-700 p-2 text-sm"
                  placeholder="ID del borrador en Firestore"
                />
                <button
                  type="button"
                  onClick={publicar}
                  disabled={publicando || !idBorrador.trim()}
                  className="px-5 py-2 rounded bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-semibold transition"
                >
                  {publicando ? 'Publicando...' : 'Publicar noticia'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Requiere un ID de borrador existente. La publicación está bloqueada si score &lt; 90.
              </p>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

function Fila({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between gap-1 border-b border-gray-800 py-2 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
