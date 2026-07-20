'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { categoryToSlug } from '@/lib/types';
import AnalizadorPanel from '@/components/admin/AnalizadorPanel';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

type AuditorItem = {
  id: string;
  slug: string;
  titulo: string;
  score: number;
  nivel: string;
  palabras: number;
  relleno: number;
  transiciones_ia: number;
  fuentes_atribuidas: number;
  citas: number;
  problemas?: string[];
};

type NewsDoc = {
  id: string;
  titulo?: string;
  resumen?: string;
  contenido?: string;
  categoria?: string;
  departamento?: string;
  dateline?: string;
  autor?: string;
  slug?: string;
  keywords?: string;
  imagen?: string;
  imagenDestacada?: string;
  fechaActualizacion?: string;
};

function normalize(text: string) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

export default function CorreccionesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditorLoading, setAuditorLoading] = useState(false);
  const [auditorData, setAuditorData] = useState<AuditorItem[]>([]);
  const [db, setDb] = useState<ReturnType<typeof getFirestore> | null>(null);
  const [auth, setAuth] = useState<ReturnType<typeof getAuth> | null>(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedNews, setSelectedNews] = useState<NewsDoc | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const authInstance = getAuth(app);
    const firestore = getFirestore(app);
    setDb(firestore);
    setAuth(authInstance);
    const unsub = onAuthStateChanged(authInstance, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || auditorData.length > 0) return;
    (async () => {
      try {
        setAuditorLoading(true);
        const resp = await fetch('/api/auditor', { cache: 'no-store' });
        const data = await resp.json();
        const peligros = Array.isArray(data) 
          ? data.filter((item: AuditorItem) => item?.nivel?.includes('PELIGRO')) 
          : [];
        setAuditorData(peligros);
        setLog(prev => [...prev, `Cargadas ${peligros.length} noticias en peligro`]);
      } catch (error: any) {
        setLog(prev => [...prev, `Error: ${error?.message || String(error)}`]);
      } finally {
        setAuditorLoading(false);
      }
    })();
  }, [user, auditorData.length]);

  const filtered = useMemo(() => {
    const q = normalize(filter);
    return auditorData.filter((item) => {
      if (!q) return true;
      return normalize(item.titulo).includes(q) || normalize(item.slug).includes(q);
    });
  }, [auditorData, filter]);

  async function selectArticle(item: AuditorItem) {
    setLog(prev => [...prev, `🔍 Cargando contenido para análisis: ${item.titulo}`]);
    const article = await loadNewsBySlug(item.slug);
    if (article) {
      setSelectedNews(article);
      setLog(prev => [...prev, `✅ Artículo cargado: ${article.titulo}`]);
    } else {
      setLog(prev => [...prev, `❌ No se pudo cargar el artículo: ${item.slug}`]);
    }
  }

  async function loadNewsBySlug(slug: string): Promise<NewsDoc | null> {
    if (!db) return null;
    const snap = await getDocs(query(collection(db, 'noticias'), where('slug', '==', slug), limit(1)));
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as NewsDoc;
  }

  async function revalidateArticle(article: NewsDoc) {
    const categorySlug = categoryToSlug(article.categoria || 'General');
    const articleSlug = article.slug || '';
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/', categorySlug, articleSlug }),
    });
  }

  // Re-auditar noticia después de aplicar fix
  async function reauditNoticia(slug: string): Promise<{score: number; nivel: string; palabras: number} | null> {
    try {
      const resp = await fetch(`/api/auditor?slug=${encodeURIComponent(slug)}&recheck=true`, { cache: 'no-store' });
      if (!resp.ok) return null;
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        return { score: data[0].score, nivel: data[0].nivel, palabras: data[0].palabras };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async function applyFix(item: AuditorItem) {
    if (!db) return;
    try {
      const article = await loadNewsBySlug(item.slug);
      if (!article) {
        setLog(prev => [...prev, `❌ No encontrada: ${item.titulo}`]);
        return;
      }

      // Llamar a la API de pulir para mejorar el contenido
      const pulirResp = await fetch('/api/pulir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: article.titulo || '',
          contenido: article.contenido || '',
          meta_descripcion: article.resumen || '',
          categoria: article.categoria || 'General',
          score_actual: item.score,
          nivel_actual: item.nivel
        })
      });

      if (!pulirResp.ok) {
        throw new Error(`Error pulir: ${pulirResp.status}`);
      }

      const pulido = await pulirResp.json();
      
      if (!pulido.success || !pulido.version_pulida) {
        throw new Error('Respuesta inválida del pulidor');
      }

      const versionPulida = pulido.version_pulida;

      // Guardar cambios en Firestore
      await updateDoc(doc(db, 'noticias', article.id), {
        contenido: versionPulida.contenido,
        resumen: versionPulida.meta_descripcion,
        palabras: versionPulida.palabras,
        fechaActualizacion: serverTimestamp(),
      });

      await revalidateArticle({ ...article, slug: article.slug || '', categoria: article.categoria });
      
      // Verificar nuevo score
      const nuevoEstado = await reauditNoticia(item.slug);
      const scoreNuevo = nuevoEstado?.score || pulido.score_nuevo || item.score;
      const nivelNuevo = nuevoEstado?.nivel || pulido.nivel_nuevo || item.nivel;
      
      // Remover de la lista si ya no está en peligro
      if (!nivelNuevo.includes('PELIGRO')) {
        setAuditorData(prev => prev.filter(n => n.id !== item.id));
        setLog(prev => [...prev, `✅ ${item.titulo}: ${item.score} → ${scoreNuevo} (${nivelNuevo}) - REMOVIDA DE LISTA`]);
      } else {
        setAuditorData(prev => prev.map(n => n.id === item.id ? {...n, score: scoreNuevo, nivel: nivelNuevo} : n));
        setLog(prev => [...prev, `⚠️ ${item.titulo}: ${item.score} → ${scoreNuevo} - Sigue en peligro`]);
      }
      
      // Mostrar advertencias si hay
      if (versionPulida.advertencias_editor?.length > 0) {
        versionPulida.advertencias_editor.forEach((adv: string) => {
          setLog(prev => [...prev, `   ⚠️ ${adv}`]);
        });
      }
    } catch (e: any) {
      setLog(prev => [...prev, `❌ Error en ${item.titulo}: ${e?.message || String(e)}`]);
    }
  }

  async function applyAll() {
    if (running) return;
    if (!confirm(`Aplicar limpieza a ${filtered.length} noticias?`)) return;
    setRunning(true);
    setLog(prev => [...prev, `Iniciando correccion de ${filtered.length} noticias...`]);
    
    for (const item of filtered) {
      await applyFix(item);
      await new Promise(r => setTimeout(r, 800));
    }
    
    setRunning(false);
    setLog(prev => [...prev, 'Proceso completado']);
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>;

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ background: '#fff', padding: 40, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Acceso restringido</h1>
          <Link href="/admin/index.html" style={{ display: 'inline-block', padding: '12px 24px', background: '#4f46e5', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600, marginTop: 20 }}>
            Ir al Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Corrector Editorial - Noticias en Peligro</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/admin" style={{ padding: '8px 18px', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>Volver al Admin</Link>
          <span style={{ fontSize: 13, color: '#64748b' }}>{user.email}</span>
          <button onClick={() => auth && signOut(auth)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13 }}>Salir</button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Noticias en Peligro: {auditorData.length}</h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <input 
                type="text" 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)} 
                placeholder="Buscar..." 
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}
              />
              <button 
                onClick={applyAll} 
                disabled={running || auditorLoading || filtered.length === 0}
                style={{ 
                  padding: '8px 16px', 
                  background: running ? '#94a3b8' : '#dc2626', 
                  color: '#fff', 
                  borderRadius: 6, 
                  border: 'none',
                  cursor: running ? 'not-allowed' : 'pointer'
                }}
              >
                {running ? 'Procesando...' : `Corregir ${filtered.length}`}
              </button>
            </div>
          </div>

          {auditorLoading && <div>Cargando auditor...</div>}
          
          <div style={{ maxHeight: 400, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: 10, textAlign: 'left' }}>Título</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Score</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Problemas</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 10 }}>
                      <div style={{ fontWeight: 500 }}>{item.titulo}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{item.slug}</div>
                    </td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        background: item.score < 50 ? '#fee2e2' : '#fef3c7',
                        color: item.score < 50 ? '#dc2626' : '#d97706',
                        fontWeight: 600
                      }}>
                        {item.score}
                      </span>
                    </td>
                    <td style={{ padding: 10, textAlign: 'center', fontSize: 11 }}>
                      {item.relleno > 0 && <span style={{ color: '#dc2626' }}>Relleno: {item.relleno}</span>}
                      {item.transiciones_ia > 0 && <span style={{ color: '#d97706', marginLeft: 8 }}>IA: {item.transiciones_ia}</span>}
                      {item.fuentes_atribuidas === 0 && <span style={{ color: '#dc2626', marginLeft: 8 }}>Sin fuentes</span>}
                    </td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button 
                          onClick={() => selectArticle(item)}
                          disabled={running}
                          style={{ 
                            padding: '4px 10px', 
                            fontSize: 12,
                            background: '#7c3aed', 
                            color: '#fff', 
                            borderRadius: 4, 
                            border: 'none',
                            cursor: running ? 'not-allowed' : 'pointer'
                          }}
                        >
                          🤖 Analizar
                        </button>
                        <button 
                          onClick={() => applyFix(item)}
                          disabled={running}
                          style={{ 
                            padding: '4px 10px', 
                            fontSize: 12,
                            background: '#4f46e5', 
                            color: '#fff', 
                            borderRadius: 4, 
                            border: 'none',
                            cursor: running ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Corregir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !auditorLoading && (
                  <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Sin noticias en peligro</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Editor IA — Analizador de valor periodístico */}
        <div style={{ background: '#0f172a', borderRadius: 12, border: '1px solid #334155', padding: 20, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 18, color: '#e2e8f0', marginBottom: 8 }}>
            🤖 Editor IA — Nicaragua Informate
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
            Niveles 7-10 + Detectores Facebook, Google y EEAT Real. Selecciona una nota y presiona “Analizar”.
          </p>
          {selectedNews ? (
            <AnalizadorPanel
              noticia={{
                titulo: selectedNews.titulo || '',
                contenido: selectedNews.contenido || '',
                resumen: selectedNews.resumen || '',
                categoria: selectedNews.categoria || 'General',
                autor: selectedNews.autor || 'Redacción NI',
                slug: selectedNews.slug || '',
                fecha: new Date().toISOString(),
                fechaActualizacion: selectedNews.fechaActualizacion,
                keywords: selectedNews.keywords,
                imagen: selectedNews.imagen,
                imagenDestacada: selectedNews.imagenDestacada,
              }}
            />
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', border: '1px dashed #334155', borderRadius: 8 }}>
              Selecciona una nota de la tabla y presiona “🤖 Analizar” para ver el análisis editorial completo.
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Log de operaciones</h3>
          <div style={{ background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
            {log.length === 0 ? 'Esperando operaciones...' : log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </main>
    </div>
  );
}
