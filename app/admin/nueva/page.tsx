'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import nextDynamic from 'next/dynamic';

const TipTapEditor = nextDynamic(() => import('@/components/admin/TipTapEditor'), { ssr: false });

// Firebase imports (dynamic to avoid SSR issues)
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const CAT_COLORS: Record<string, string> = {
  Sucesos: '#dc2626',
  Nacionales: '#ea580c',
  Deportes: '#059669',
  Internacionales: '#0891b2',
  Espectáculos: '#db2777',
  Cultura: '#7c3aed',
  Economía: '#d97706',
  Tecnología: '#2563eb',
};

function generarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminNuevaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Form fields
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Sucesos');
  const [departamento, setDepartamento] = useState('Managua');
  const [dateline, setDateline] = useState('MANAGUA / NICARAGUA');
  const [resumen, setResumen] = useState('');
  const [contenido, setContenido] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [pieFoto, setPieFoto] = useState('');
  const [destacada, setDestacada] = useState(false);
  const [publicado, setPublicado] = useState(true);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [auth, setAuth] = useState<ReturnType<typeof getAuth> | null>(null);
  const [db, setDb] = useState<ReturnType<typeof getFirestore> | null>(null);
  const [storage, setStorage] = useState<ReturnType<typeof getStorage> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const authInstance = getAuth(app);
    const firestore = getFirestore(app);
    const storageInstance = getStorage(app);
    setAuth(authInstance);
    setDb(firestore);
    setStorage(storageInstance);

    const unsub = onAuthStateChanged(authInstance, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load existing article for editing
  useEffect(() => {
    if (!editId || !user) return;
    if (!db) return;
    (async () => {
      const snap = await getDoc(doc(db, 'noticias', editId));
      if (snap.exists()) {
        const d = snap.data();
        setTitulo(d.titulo || '');
        setCategoria(d.categoria || 'Sucesos');
        setDepartamento(d.departamento || 'Managua');
        setDateline(d.dateline || 'MANAGUA / NICARAGUA');
        setResumen(d.resumen || '');
        setContenido(d.contenido || '');
        setImagenUrl(d.imagen || '');
        setPieFoto(d.pieFoto || '');
        setDestacada(!!d.destacada);
        setPublicado(d.publicado !== false);
      }
    })();
  }, [editId, user, db]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setLoginError(err.message || 'Error de autenticación');
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file || !storage) return;
    // Upload to Firebase Storage
    const filename = `${generarSlug(titulo).substring(0, 30) || 'noticia'}-${Date.now()}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `noticias/${filename}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setImagenUrl(url);
    setPreviewUrl(url);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !categoria || !contenido || !imagenUrl) {
      setMsg('Completa todos los campos obligatorios');
      return;
    }
    const palabras = contenido.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    if (palabras < 350) {
      setMsg(`Contenido muy corto (${palabras} palabras). AdSense requiere mínimo 350.`);
      return;
    }

    if (!db) return;
    setSaving(true);
    setMsg('');
    try {
      const noticiaData = {
        titulo,
        categoria,
        departamento,
        dateline,
        resumen: resumen || contenido,
        contenido,
        imagen: imagenUrl,
        pieFoto,
        fecha: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        vistas: 0,
        autor: 'Directora Editorial',
        destacada,
        publicado,
        slug: editId ? undefined : generarSlug(titulo),
        palabras,
      };

      if (editId) {
        const updateData: any = { ...noticiaData };
        delete updateData.fecha;
        delete updateData.slug;
        delete updateData.vistas;
        await updateDoc(doc(db, 'noticias', editId), updateData);
        setMsg('Noticia actualizada');
      } else {
        await addDoc(collection(db, 'noticias'), noticiaData);
        setMsg('Noticia publicada');
        // Reset form
        setTitulo(''); setResumen(''); setContenido(''); setImagenUrl(''); setPieFoto('');
        setDestacada(false); setPublicado(true);
      }
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>;

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: 40, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#1e293b' }}>Panel Editorial</h1>
          {loginError && <div style={{ padding: 12, background: '#fee2e2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{loginError}</div>}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }} />
          </div>
          <button type="submit" style={{ width: '100%', padding: 12, background: '#4f46e5', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Ingresar</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Nicaragua Informate — Editor</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>{user.email}</span>
          <button onClick={() => auth && signOut(auth)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, cursor: 'pointer' }}>Salir</button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 64px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>{editId ? 'Editar Noticia' : 'Nueva Noticia'}</h1>
        <p style={{ color: '#64748b', marginBottom: 32, fontSize: 14 }}>Usa el editor profesional abajo. Cada Enter crea un párrafo nuevo. Usa H2 para subtítulos y la lista para viñetas.</p>

        {msg && (
          <div style={{ padding: 14, background: msg.includes('Error') ? '#fee2e2' : '#d1fae5', color: msg.includes('Error') ? '#dc2626' : '#059669', borderRadius: 10, marginBottom: 24, fontSize: 14, fontWeight: 500 }}>
            {msg}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Título */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Título *</label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required placeholder="Título de la noticia" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 16 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Categoría *</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}>
                {Object.keys(CAT_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Departamento</label>
              <select value={departamento} onChange={e => setDepartamento(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}>
                <option>Managua</option><option>Matagalpa</option><option>León</option><option>Granada</option>
                <option>Estelí</option><option>Jinotega</option><option>Chinandega</option><option>Masaya</option>
                <option>Carazo</option><option>Rivas</option><option>Boaco</option><option>Chontales</option>
                <option>Madriz</option><option>Nueva Segovia</option><option>Río San Juan</option><option>RAAN</option><option>RAAS</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Dateline</label>
              <input type="text" value={dateline} onChange={e => setDateline(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }} />
            </div>
          </div>

          {/* Resumen */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Resumen</label>
            <textarea value={resumen} onChange={e => setResumen(e.target.value)} placeholder="Resumen breve (opcional)" rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, resize: 'vertical' }} />
          </div>

          {/* TipTap Editor */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Contenido *</label>
            <TipTapEditor content={contenido} onChange={setContenido} placeholder="Escribe el cuerpo de la noticia. Usa H2 para subtítulos, la lista para viñetas, negrita para énfasis..." />
          </div>

          {/* Imagen */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Imagen destacada *</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <input type="text" value={imagenUrl} onChange={e => { setImagenUrl(e.target.value); setPreviewUrl(e.target.value); }} placeholder="URL de la imagen o súbela" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }} />
              </div>
              <div>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} style={{ display: 'none' }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>📁 Subir</button>
              </div>
            </div>
            {previewUrl && (
              <div style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', maxWidth: 400 }}>
                <img src={previewUrl} alt="preview" style={{ width: '100%', height: 'auto', display: 'block' }} onError={() => setPreviewUrl('')} />
              </div>
            )}
          </div>

          {/* Pie de foto */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Pie de foto</label>
            <input type="text" value={pieFoto} onChange={e => setPieFoto(e.target.value)} placeholder="Crédito o descripción de la imagen" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }} />
          </div>

          {/* Opciones */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 32, padding: 16, background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#475569' }}>
              <input type="checkbox" checked={destacada} onChange={e => setDestacada(e.target.checked)} />
              Destacada en homepage
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#475569' }}>
              <input type="checkbox" checked={publicado} onChange={e => setPublicado(e.target.checked)} />
              Publicada (visible en el sitio)
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => router.push('/admin')} style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : editId ? 'Actualizar Noticia' : 'Publicar Noticia'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
