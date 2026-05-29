'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface NoticiaItem {
  id: string;
  titulo: string;
  categoria: string;
  publicado: boolean;
  destacada: boolean;
  fecha: any;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [noticias, setNoticias] = useState<NoticiaItem[]>([]);
  const [filter, setFilter] = useState('');
  const [db, setDb] = useState<ReturnType<typeof getFirestore> | null>(null);
  const [auth, setAuth] = useState<ReturnType<typeof getAuth> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const authInstance = getAuth(app);
    const firestore = getFirestore(app);
    setDb(firestore);
    setAuth(authInstance);

    const unsubAuth = onAuthStateChanged(authInstance, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'noticias'), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items: NoticiaItem[] = [];
      snap.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          titulo: data.titulo || '(sin título)',
          categoria: data.categoria || 'General',
          publicado: data.publicado !== false,
          destacada: !!data.destacada,
          fecha: data.fecha,
        });
      });
      setNoticias(items);
    });
    return () => unsub();
  }, [user, db]);

  const handleDelete = async (id: string) => {
    if (!db || !confirm('¿Eliminar esta noticia permanentemente?')) return;
    await deleteDoc(doc(db, 'noticias', id));
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>;

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ background: '#fff', padding: 40, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: '#1e293b' }}>Panel Editorial</h1>
          <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>Acceso restringido. Ingresa con tu cuenta autorizada.</p>
          <button onClick={() => router.push('/admin/nueva')} style={{ display: 'none' }} />
          <Link href="/admin/index.html" style={{ display: 'inline-block', padding: '12px 24px', background: '#4f46e5', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>
            Ir al Admin Original
          </Link>
        </div>
      </div>
    );
  }

  const filtered = noticias.filter((n) =>
    n.titulo.toLowerCase().includes(filter.toLowerCase()) ||
    n.categoria.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Nicaragua Informate — Admin</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/admin/nueva" style={{ padding: '8px 18px', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>+ Nueva Noticia</Link>
          <span style={{ fontSize: 13, color: '#64748b' }}>{user.email}</span>
          <button onClick={() => auth && signOut(auth)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, cursor: 'pointer' }}>Salir</button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b' }}>Noticias ({noticias.length})</h1>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar noticia..."
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, width: 280 }}
          />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Título</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background .15s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{n.titulo}</div>
                    {n.destacada && <span style={{ fontSize: 11, color: '#4f46e5', fontWeight: 600 }}>⭐ Destacada</span>}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748b' }}>{n.categoria}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: n.publicado ? '#d1fae5' : '#fee2e2', color: n.publicado ? '#059669' : '#dc2626' }}>
                      {n.publicado ? 'Publicada' : 'Borrador'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Link href={`/admin/nueva?edit=${n.id}`} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginRight: 6 }}>Editar</Link>
                    <button onClick={() => handleDelete(n.id)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', fontSize: 13, cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Sin noticias</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
