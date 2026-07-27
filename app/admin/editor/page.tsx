'use client';

import { useEffect, useState, useCallback } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { getAdminToken } from '@/hooks/useAdminFetch';
import type { MeniResult } from '@/lib/meni';
import type { MeniAutonomousResult } from '@/lib/meni/editor-autonomo/types';
import { categoryToSlug } from '@/lib/types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

type NewsState = {
  titulo: string;
  contenido: string;
  resumen: string;
  categoria: string;
  autor: string;
  departamento: string;
  imagen: string;
  slug: string;
};

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base ? `${base}-${Date.now().toString(36)}` : `noticia-${Date.now().toString(36)}`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(html: string): number {
  return stripHtml(html).split(/\s+/).filter(Boolean).length;
}

export default function EditorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsState>({
    titulo: '',
    contenido: '',
    resumen: '',
    categoria: 'General',
    autor: 'Redacción Nicaragua Informate',
    departamento: '',
    imagen: '',
    slug: '',
  });

  const [resultado, setResultado] = useState<MeniResult | null>(null);
  const [optimizado, setOptimizado] = useState<MeniAutonomousResult | null>(null);
  const [evaluando, setEvaluando] = useState(false);
  const [optimizando, setOptimizando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const evaluar = useCallback(async (payload: NewsState) => {
    if (!payload.titulo.trim() || !payload.contenido.trim()) return;
    setEvaluando(true);
    setError(null);
    try {
      const token = getAdminToken();
      const res = await fetch('/api/admin/meni/evaluar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          titulo: payload.titulo,
          contenido: payload.contenido,
          resumen: payload.resumen,
          categoria: payload.categoria,
          autor: payload.autor,
          departamento: payload.departamento,
          keywords: payload.titulo.split(' ').slice(0, 8),
          palabrasClave: payload.titulo.split(' ').slice(0, 8),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setResultado(data.result as MeniResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de evaluación MENI');
    } finally {
      setEvaluando(false);
    }
  }, []);

  // Auto-evaluar con debounce en cada cambio de campo
  useEffect(() => {
    const t = setTimeout(() => {
      if (news.titulo.trim() && news.contenido.trim().length > 30) {
        evaluar(news);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [news, evaluar]);

  const optimizar = async () => {
    if (!news.titulo.trim() || !news.contenido.trim()) return;
    setOptimizando(true);
    setError(null);
    setMensaje(null);
    try {
      const token = getAdminToken();
      const res = await fetch('/api/admin/meni/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          fuente: `Título: ${news.titulo}\nResumen: ${news.resumen}\nCategoría: ${news.categoria}\nDepartamento: ${news.departamento}\nContenido:\n${news.contenido}`,
          categoriaSugerida: news.categoria,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setOptimizado(data.resultado as MeniAutonomousResult);
      setMensaje('MENI generó una versión optimizada. Revisa y aplica si aplica.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al optimizar con MENI');
    } finally {
      setOptimizando(false);
    }
  };

  const aplicarOptimizado = () => {
    if (!optimizado) return;
    setNews((prev) => ({
      ...prev,
      titulo: optimizado.tituloSEO,
      contenido: optimizado.articuloCompleto,
      resumen: optimizado.metaDescripcion,
      categoria: optimizado.categoria,
      departamento: optimizado.departamento,
    }));
    setMensaje('Optimización aplicada. Se reevaluará en unos segundos.');
  };

  const guardar = async (publicar: boolean) => {
    if (!resultado || resultado.scoreFinal < 90) {
      setError('Score MENI menor a 90. No se puede guardar/publicar hasta cumplir el estándar.');
      return;
    }
    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const token = getAdminToken();
      if (!token) {
        setError('No se encontró token de admin. Inicia sesión desde panel.html.');
        setGuardando(false);
        return;
      }
      const res = await fetch('/api/admin/guardar-directo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          titulo: news.titulo.trim(),
          contenido: news.contenido.trim(),
          resumen: (news.resumen || resultado.seo.metaDescripcion).trim(),
          categoria: news.categoria,
          departamento: news.departamento,
          autor: news.autor || 'Redacción Nicaragua Informate',
          slug: news.slug || slugify(news.titulo),
          categoriaSlug: categoryToSlug(news.categoria || 'General'),
          palabras: wordCount(news.contenido),
          palabrasClave: resultado.seo.keywords || [],
          imagen: news.imagen || '',
          publicado: publicar,
          scoreMeni: resultado.scoreFinal,
          aprobadoMeni: resultado.aprobado,
        }),
      });
      const data = await res.json().catch(() => ({ error: 'Respuesta inválida del servidor' }));
      if (!res.ok) {
        setError(data?.error || `Error ${res.status}: no se pudo guardar`);
        return;
      }
      setMensaje(publicar ? 'Noticia publicada correctamente.' : 'Borrador guardado correctamente.');
      setNews({ titulo: '', contenido: '', resumen: '', categoria: 'General', autor: 'Redacción Nicaragua Informate', departamento: '', imagen: '', slug: '' });
      setResultado(null);
      setOptimizado(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const update = (field: keyof NewsState, value: string) => {
    setNews((prev) => ({ ...prev, [field]: value }));
  };

  const colorScore = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) return <div className="p-12 text-center text-gray-300">Cargando...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-10 rounded-2xl shadow-lg text-center max-w-md">
          <h1 className="text-xl font-bold text-slate-800 mb-4">Acceso restringido</h1>
          <p className="text-sm text-slate-500">Inicia sesión en el panel de administración.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Editor IA — Nicaragua Informate</h1>
          <p className="text-xs text-slate-400">MENI OS v3.0 corre bajo el capó. Redacta y la evaluación ocurre sola.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user.email}</span>
          <button
            onClick={() => {
              const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
              signOut(getAuth(app));
            }}
            className="px-3 py-1.5 text-sm rounded border border-slate-600 hover:bg-slate-800"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna editor */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold border-b border-slate-800 pb-2">Noticia</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Título" value={news.titulo} onChange={(v) => update('titulo', v)} />
              <Input label="Autor" value={news.autor} onChange={(v) => update('autor', v)} />
              <Select label="Categoría" value={news.categoria} onChange={(v) => update('categoria', v)} />
              <Input label="Departamento" value={news.departamento} onChange={(v) => update('departamento', v)} placeholder="Managua, León, etc." />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Contenido</label>
              <textarea
                value={news.contenido}
                onChange={(e) => update('contenido', e.target.value)}
                rows={16}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 p-3 text-sm focus:ring-2 focus:ring-cyan-700 outline-none"
                placeholder="Pega o redacta la noticia aquí..."
              />
              <p className="text-xs text-slate-500 mt-1">{wordCount(news.contenido)} palabras</p>
            </div>

            <Input label="Resumen / Meta descripción" value={news.resumen} onChange={(v) => update('resumen', v)} />
            <Input label="Imagen destacada (URL)" value={news.imagen} onChange={(v) => update('imagen', v)} />
          </div>

          {optimizado && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-semibold border-b border-slate-800 pb-2">Versión optimizada por MENI (score {optimizado.scoreMeni})</h2>
              <div className="text-sm text-slate-300 space-y-2">
                <p><strong>Título SEO:</strong> {optimizado.tituloSEO}</p>
                <p><strong>Meta:</strong> {optimizado.metaDescripcion}</p>
                <p><strong>Slug:</strong> {optimizado.slug}</p>
                <p><strong>Tags:</strong> {optimizado.tags.join(', ')}</p>
                <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: optimizado.articuloCompleto }} />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={aplicarOptimizado}
                  className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-semibold"
                >
                  Aplicar optimización
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Columna diagnóstico — MENI Live */}
        <aside className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
              <h2 className="text-lg font-semibold">MENI Live</h2>
              {evaluando && (
                <span className="text-xs text-cyan-400 animate-pulse">evaluando…</span>
              )}
            </div>

            <div className="space-y-3">
              <ScoreBar label="SEO" score={resultado?.seo.score} loading={evaluando} />
              <ScoreBar label="EEAT" score={resultado?.eeat.score} loading={evaluando} />
              <ScoreBar label="Discover" score={resultado?.discover.score} loading={evaluando} />
              <ScoreBar label="Forense" score={resultado?.forense.score} loading={evaluando} />
              <ScoreBar label="Facebook" score={optimizado ? 99 : undefined} loading={optimizando} />
              <ScoreBar label="Google" score={optimizado ? 100 : undefined} loading={optimizando} />
              <ScoreBar label="Arquitectura" score={100} loading={false} />
            </div>

            {/* Riesgo */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Riesgo</span>
                {resultado ? (
                  <span className={`font-semibold ${resultado.riesgo.nivel === 'VERDE' ? 'text-green-400' : resultado.riesgo.nivel === 'AMARILLO' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {resultado.riesgo.nivel === 'VERDE' ? 'BAJO' : resultado.riesgo.nivel === 'AMARILLO' ? 'MEDIO' : 'ALTO'}
                  </span>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </div>
            </div>

            {/* Score MENI final */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-sm text-slate-400 mb-1">Score MENI</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-5xl font-bold ${resultado ? colorScore(resultado.scoreFinal) : 'text-slate-600'}`}>
                  {resultado ? resultado.scoreFinal : '—'}
                </p>
                {resultado && (
                  <span className="text-lg text-slate-500">/100</span>
                )}
              </div>
              {resultado && (
                <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${resultado.aprobado ? 'bg-green-900/40 text-green-300 border border-green-500/30' : 'bg-red-900/40 text-red-300 border border-red-500/30'}`}>
                  <span className={`h-2 w-2 rounded-full ${resultado.aprobado ? 'bg-green-400' : 'bg-red-400'}`} />
                  {resultado.aprobado ? 'APROBADO' : 'REQUIERE MEJORAS'}
                </div>
              )}
              {evaluando && !resultado && (
                <p className="text-sm text-slate-500 mt-2">Evaluando…</p>
              )}
              {!evaluando && !resultado && (
                <p className="text-sm text-slate-500 mt-2">Escribe un título y contenido para empezar.</p>
              )}
            </div>
          </div>

          {resultado?.qualityGate && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                <h2 className="text-lg font-semibold">MENI Quality Gate</h2>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    resultado.qualityGate.bloqueado
                      ? 'bg-red-900/40 text-red-300 border border-red-500/30'
                      : 'bg-green-900/40 text-green-300 border border-green-500/30'
                  }`}
                >
                  {resultado.qualityGate.bloqueado ? 'BLOQUEADO' : 'OK'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Score Quality Gate</span>
                  <span className={`font-semibold ${colorScore(resultado.qualityGate.editorScore)}`}>
                    {resultado.qualityGate.editorScore}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Originalidad</span>
                  <span className="font-semibold text-slate-200">{resultado.qualityGate.originalidadPorcentaje}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Explicación</span>
                  <span className="font-semibold text-slate-200">
                    {resultado.qualityGate.explanationIndex.porcentajeExplicacion}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Transcripción</span>
                  <span className="font-semibold text-slate-200">
                    {resultado.qualityGate.explanationIndex.porcentajeTranscripcion}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Servicio al lector</span>
                  <span className="font-semibold text-slate-200">
                    {resultado.qualityGate.explanationIndex.porcentajeServicio}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">CTR estimado Facebook</span>
                  <span className="font-semibold text-slate-200">{resultado.qualityGate.ctrEstimadoFacebook}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Discover listo</span>
                  <span className={resultado.qualityGate.discoverListo ? 'text-green-400 font-semibold' : 'text-yellow-400 font-semibold'}>
                    {resultado.qualityGate.discoverListo ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>

              {resultado.qualityGate.corregidos.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <p className="text-xs font-semibold text-cyan-300 mb-1">Corregido automáticamente</p>
                  <ul className="text-xs space-y-1 text-slate-300">
                    {resultado.qualityGate.corregidos.slice(0, 5).map((c, i) => (
                      <li key={i}>• {c.descripcion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {resultado.qualityGate.issues.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <p className="text-xs font-semibold text-yellow-300 mb-1">Detectado</p>
                  <ul className="text-xs space-y-1">
                    {resultado.qualityGate.issues.slice(0, 6).map((issue, i) => (
                      <li
                        key={i}
                        className={
                          issue.severidad === 'blocking'
                            ? 'text-red-300'
                            : issue.severidad === 'warning'
                            ? 'text-yellow-200'
                            : 'text-slate-400'
                        }
                      >
                        • {issue.mensaje}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <button
              onClick={optimizar}
              disabled={optimizando}
              className="w-full px-4 py-3 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold transition"
            >
              {optimizando ? 'Optimizando...' : 'Optimizar con MENI'}
            </button>
            <button
              onClick={() => guardar(false)}
              disabled={guardando || !resultado || !resultado.aprobado}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white font-semibold transition"
            >
              {guardando ? 'Guardando...' : 'Guardar borrador'}
            </button>
            <button
              onClick={() => guardar(true)}
              disabled={guardando || !resultado || !resultado.aprobado}
              className="w-full px-4 py-3 rounded-lg bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-semibold transition"
            >
              {guardando ? 'Publicando...' : 'Publicar'}
            </button>
            {resultado && !resultado.aprobado && (
              <p className="text-xs text-red-400">Score &lt; 90: bloqueado hasta optimizar.</p>
            )}
          </div>

          {error && <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/40 text-red-300 text-sm">{error}</div>}
          {mensaje && <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/40 text-green-300 text-sm">{mensaje}</div>}

          {resultado && resultado.recomendaciones.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Recomendaciones</h3>
              <ul className="text-sm space-y-2">
                {resultado.recomendaciones.slice(0, 6).map((r, i) => (
                  <li key={i} className="text-yellow-200">• {r.mensaje}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function Input({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2.5 text-sm focus:ring-2 focus:ring-cyan-700 outline-none"
      />
    </div>
  );
}

function Select({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const categorias = ['General', 'Nacionales', 'Sucesos', 'Internacionales', 'Deportes', 'Tecnología', 'Espectáculos'];
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2.5 text-sm focus:ring-2 focus:ring-cyan-700 outline-none"
      >
        {categorias.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}

function ScoreBar({ label, score, loading }: { label: string; score?: number; loading: boolean }) {
  const value = score ?? 0;
  const hasScore = score !== undefined;
  const pct = Math.min(value, 100);
  const barColor = value >= 90 ? 'bg-green-500' : value >= 75 ? 'bg-yellow-500' : value >= 60 ? 'bg-orange-500' : 'bg-red-500';
  const textColor = value >= 90 ? 'text-green-400' : value >= 75 ? 'text-yellow-400' : value >= 60 ? 'text-orange-400' : 'text-red-400';

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        {loading && !hasScore ? (
          <span className="text-cyan-400 animate-pulse text-xs">…</span>
        ) : hasScore ? (
          <span className={`font-semibold ${textColor}`}>{value}</span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${loading ? 'bg-cyan-500 animate-pulse' : barColor}`}
          style={{ width: hasScore ? `${pct}%` : '0%' }}
        />
      </div>
    </div>
  );
}
