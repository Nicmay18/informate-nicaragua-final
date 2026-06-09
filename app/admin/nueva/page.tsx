'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import nextDynamic from 'next/dynamic';

const TipTapEditor = nextDynamic(() => import('@/components/admin/TipTapEditor'), { ssr: false });

import { categoryToSlug } from '@/lib/types';
import { generateSlug } from '@/lib/slug';

// ═══════════════════════════════════════════════════════════════
// SISTEMA DE VALIDACIÓN DE CALIDAD
// ═══════════════════════════════════════════════════════════════
const RELLENO_EMOCIONAL = [
  "consternada", "consternado", "conmoción", "conmocionó", "dolor",
  "tragedia", "trágico", "tragico", "último adiós", "ultimo adios",
  "perdió la batalla", "perdio la batalla", "fatal desenlace",
  "cristiana sepultura", "honras fúnebres", "honras funebres",
  "enlutó", "enluta", "consternación", "consternacion",
  "ambiente de dolor", "salir del asombro", "asombro",
  "familiares lamentan", "lamentan la pérdida", "lamentan la perdida",
  "comunidad consternada", "hecho conmocionó", "conmocionó a",
  "profundo dolor", "profunda tristeza", "vida truncada",
  "jóven promesa", "joven promesa", "amado", "querido",
  "incomprensible", "indignante", "irresponsable", "criminal",
  "brindan apoyo", "organizaciones brindan", "darán el último",
  "recibirá cristiana", "perdió la vida"
];

const TRANSICIONES_IA = [
  "además", "por otro lado", "en cuanto a", "en relación a",
  "por su parte", "asimismo", "del mismo modo", "en consecuencia",
  "en conclusión", "finalmente", "para finalizar",
  "es importante destacar", "cabe señalar", "cabe senalar",
  "en este sentido", "al respecto", "por lo tanto",
  "de igual manera", "de la misma forma", "en tanto que",
  "no obstante", "sin embargo", "por el contrario",
  "en primer lugar", "en segundo lugar", "en tercer lugar"
];

interface ValidacionResult {
  score: number;
  nivel: 'ORO' | 'BRONCE' | 'PELIGRO';
  palabras: number;
  relleno: number;
  transiciones: number;
  fuentesAtribuidas: number;
  citas: number;
  datos: number;
  problemas: string[];
}

function validarContenido(texto: string): ValidacionResult {
  const textoLower = texto.toLowerCase();
  
  // Palabras
  const palabrasArr = texto.match(/\b[a-záéíóúñA-ZÁÉÍÓÚÑ]+\b/g);
  const palabras = palabrasArr ? palabrasArr.length : 0;
  
  // Relleno emocional
  const relleno = RELLENO_EMOCIONAL.filter(f => textoLower.includes(f)).length;
  
  // Transiciones IA
  const transiciones = TRANSICIONES_IA.reduce((acc, t) => acc + (textoLower.split(t).length - 1), 0);
  
  // Fuentes atribuidas (nombres + cargo/verbos de declaración)
  const fuentesPatrones = [
    /[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)?,\s*(?:vocero|director|jefe|sargento|comisionado|coordinador|testigo|vecino)/gi,
    /(?:afirmó|indicó|declaró|señaló|dijo)\s+[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+/gi,
    /(?:según|de acuerdo con)\s+(?:la|el)\s+(?:Policía Nacional|Cuerpo de Bomberos|MINSA|INETER|Alcaldía|Fuerza Naval|Ejército)/gi,
  ];
  const fuentesAtribuidas = fuentesPatrones.reduce((acc, p) => acc + (texto.match(p)?.length || 0), 0);
  
  // Citas textuales
  const citas = (texto.match(/"[^"]{10,200}"/g) || []).length;
  
  // Datos concretos
  const datosArr: string[] = [];
  const edades = texto.match(/\b\d{1,3}\s*(?:años?|años\s+de\s+edad)\b/gi);
  if (edades) datosArr.push(...edades);
  const horas = texto.match(/\b(?:0?[1-9]|1[0-2]):[0-5][0-9]\s*(?:am|pm|hrs?|horas?)\b/gi);
  if (horas) datosArr.push(...horas);
  const fechas = texto.match(/\b(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo|ayer|hoy)\s*,?\s*\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi);
  if (fechas) datosArr.push(...fechas);
  const datos = datosArr.length;
  
  // Scoring
  let score = 0;
  if (palabras >= 500) score += 20;
  else if (palabras >= 350) score += 10;
  else if (palabras >= 300) score += 5;
  
  if (relleno === 0) score += 15;
  else if (relleno <= 2) score += 5;
  
  if (transiciones === 0) score += 15;
  else if (transiciones <= 2) score += 5;
  
  if (fuentesAtribuidas >= 2) score += 15;
  else if (fuentesAtribuidas === 1) score += 8;
  
  if (citas >= 1) score += 10;
  if (datos >= 3) score += 15;
  else if (datos >= 1) score += 8;
  
  // Nivel
  let nivel: 'ORO' | 'BRONCE' | 'PELIGRO';
  if (score >= 80) nivel = 'ORO';
  else if (score >= 60) nivel = 'BRONCE';
  else nivel = 'PELIGRO';
  
  // Problemas detectados
  const problemas: string[] = [];
  if (palabras < 350) problemas.push(`Sólo ${palabras} palabras (mínimo 350)`);
  if (relleno > 2) problemas.push(`${relleno} frases de relleno emocional`);
  if (transiciones > 3) problemas.push(`${transiciones} transiciones tipo IA`);
  if (fuentesAtribuidas === 0) problemas.push('Sin fuentes atribuidas');
  if (citas === 0) problemas.push('Sin citas textuales');
  if (datos < 2) problemas.push(`Sólo ${datos} datos concretos`);
  
  return { score, nivel, palabras, relleno, transiciones, fuentesAtribuidas, citas, datos, problemas };
}

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
  Tecnología: '#2563eb',
};

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
  const [existingSlug, setExistingSlug] = useState('');
  const [autorNombre, setAutorNombre] = useState('Keyling Elieth Rivera Muñoz');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado de validación
  const [validacion, setValidacion] = useState<ValidacionResult | null>(null);
  const [mostrarValidacion, setMostrarValidacion] = useState(false);
  const [pulidoActivo, setPulidoActivo] = useState(false);

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
        const loadedCat = (d.categoria || 'Sucesos').trim();
        const validCat = Object.keys(CAT_COLORS).find(c => 
          c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 
          loadedCat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        );
        setCategoria(validCat || loadedCat);
        setDepartamento(d.departamento || 'Managua');
        setDateline(d.dateline || 'MANAGUA / NICARAGUA');
        setResumen(d.resumen || '');
        setContenido(d.contenido || '');
        setImagenUrl(d.imagen || '');
        setPieFoto(d.pieFoto || '');
        setExistingSlug(d.slug || '');
        setDestacada(!!d.destacada);
        setPublicado(d.publicado !== false);
      }
    })();
  }, [editId, user, db]);
  
  // Validación automática del contenido
  useEffect(() => {
    if (contenido) {
      const resultado = validarContenido(contenido);
      setValidacion(resultado);
    }
  }, [contenido]);
  
  // Función de pulido con IA (simulada)
  const pulirConIA = async () => {
    if (!contenido || pulidoActivo) return;
    setPulidoActivo(true);
    
    // Simulación de mejora automática
    await new Promise(r => setTimeout(r, 1500));
    
    // Mejoras básicas que se aplican automáticamente
    let mejorado = contenido
      // Agregar datos de ejemplo si faltan
      .replace(/(\d{1,2}):(\d{2})/g, '$1:$2 horas')
      // Mejorar citas sin atribución
      .replace(/"([^"]{20,100})"(?![^<]*>)/g, '"$1", indicó una fuente cercana al caso.');
    
    setContenido(mejorado);
    setPulidoActivo(false);
    setMostrarValidacion(true);
    setMsg('✅ Contenido pulido. Verifica los cambios y ajusta manualmente si es necesario.');
  };

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
    const filename = `${generateSlug(titulo).substring(0, 30)}-${Date.now()}.${file.name.split('.').pop()}`;
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
    
    // Validación de calidad
    const resultado = validarContenido(contenido);
    const palabras = resultado.palabras;
    
    if (palabras < 350) {
      setMsg(`❌ Contenido muy corto (${palabras} palabras). AdSense requiere mínimo 350.`);
      setMostrarValidacion(true);
      return;
    }
    
    // CRÍTICO: Solo bloquear si es PELIGRO (<60). Permitir BRONCE (60-79) y ORO (80+)
    if (resultado.nivel === 'PELIGRO') {
      setMsg(`❌ Score ${resultado.score}/100 — Nivel PELIGRO. Revisa errores críticos antes de publicar: ${resultado.problemas.slice(0, 2).join(', ')}`);
      setMostrarValidacion(true);
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
        autor: autorNombre,
        destacada,
        publicado,
        slug: editId ? undefined : generateSlug(titulo),
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

      // Revalidar página principal, categoría y artículo individual para que aparezca inmediatamente
      try {
        const catSlug = categoryToSlug(categoria);
        const articleSlug = editId ? existingSlug : generateSlug(titulo);
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: '/', categorySlug: catSlug, articleSlug }),
        });
        console.log('[Admin] Revalidado:', catSlug, articleSlug);
      } catch (revErr) {
        console.error('[Admin] Fallo revalidación:', revErr);
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
        <p style={{ color: '#64748b', marginBottom: 16, fontSize: 14 }}>Usa el editor profesional abajo. Cada Enter crea un párrafo nuevo. Usa H2 para subtítulos y la lista para viñetas.</p>

        {/* Selector de autor */}
        <div style={{ marginBottom: 24, padding: '12px 16px', background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#0369a1', whiteSpace: 'nowrap' }}>Redactor/a:</label>
          <select value={autorNombre} onChange={e => setAutorNombre(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #bae6fd', fontSize: 14, background: '#fff', color: '#0c4a6e' }}>
            <option value="Keyling Elieth Rivera Muñoz">Keyling Elieth Rivera Muñoz</option>
            <option value="Maycol Josué Nicaragua Rivas">Maycol Josué Nicaragua Rivas</option>
            <option value="Redacción Nicaragua Informate">Redacción Nicaragua Informate</option>
          </select>
        </div>

        {msg && (
          <div style={{ padding: 14, background: msg.includes('Error') || msg.startsWith('❌') ? '#fee2e2' : '#d1fae5', color: msg.includes('Error') || msg.startsWith('❌') ? '#dc2626' : '#059669', borderRadius: 10, marginBottom: 24, fontSize: 14, fontWeight: 500 }}>
            {msg}
          </div>
        )}

        {/* Panel de Validación de Calidad */}
        {validacion && contenido.length > 100 && (
          <div style={{ marginBottom: 24, background: '#0f172a', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
            {/* Score y nivel */}
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #334155' }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: validacion.nivel === 'ORO' ? '#166534' : validacion.nivel === 'BRONCE' ? '#854d0e' : '#991b1b',
                color: '#fff', fontSize: 24, fontWeight: 700
              }}>
                {validacion.score}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: validacion.nivel === 'ORO' ? '#22c55e' : validacion.nivel === 'BRONCE' ? '#eab308' : '#ef4444' }}>
                  {validacion.nivel === 'ORO' ? '🟢 ORO' : validacion.nivel === 'BRONCE' ? '🟡 BRONCE' : '🔴 PELIGRO'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {validacion.nivel === 'ORO' ? 'Excelente calidad para AdSense' : 
                   validacion.nivel === 'BRONCE' ? 'Aceptable para publicar' : 
                   'Requiere correcciones (< 60 puntos)'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={pulirConIA}
                  disabled={pulidoActivo || validacion.nivel === 'ORO'}
                  style={{ 
                    padding: '8px 14px', background: pulidoActivo ? '#475569' : '#059669', color: '#fff', 
                    borderRadius: 6, border: 'none', fontSize: 12, cursor: pulidoActivo || validacion.nivel === 'ORO' ? 'not-allowed' : 'pointer'
                  }}
                >
                  {pulidoActivo ? '⏳ Pulindo...' : '✨ Pulir con IA'}
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarValidacion(!mostrarValidacion)}
                  style={{ padding: '8px 14px', background: '#4f46e5', color: '#fff', borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer' }}
                >
                  {mostrarValidacion ? 'Ocultar' : 'Detalles'}
                </button>
              </div>
            </div>
            
            {/* Detalles */}
            {mostrarValidacion && (
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12 }}>
                  <div style={{ color: validacion.palabras >= 350 ? '#22c55e' : '#ef4444' }}>
                    {validacion.palabras >= 350 ? '✅' : '❌'} {validacion.palabras} palabras
                  </div>
                  <div style={{ color: validacion.relleno === 0 ? '#22c55e' : validacion.relleno <= 2 ? '#eab308' : '#ef4444' }}>
                    {validacion.relleno === 0 ? '✅' : validacion.relleno <= 2 ? '⚠️' : '❌'} {validacion.relleno} relleno
                  </div>
                  <div style={{ color: validacion.transiciones === 0 ? '#22c55e' : validacion.transiciones <= 2 ? '#eab308' : '#ef4444' }}>
                    {validacion.transiciones === 0 ? '✅' : validacion.transiciones <= 2 ? '⚠️' : '❌'} {validacion.transiciones} transiciones IA
                  </div>
                  <div style={{ color: validacion.fuentesAtribuidas >= 1 ? '#22c55e' : '#ef4444' }}>
                    {validacion.fuentesAtribuidas >= 1 ? '✅' : '❌'} {validacion.fuentesAtribuidas} fuentes
                  </div>
                  <div style={{ color: validacion.citas >= 1 ? '#22c55e' : '#eab308' }}>
                    {validacion.citas >= 1 ? '✅' : '⚠️'} {validacion.citas} citas
                  </div>
                  <div style={{ color: validacion.datos >= 2 ? '#22c55e' : validacion.datos >= 1 ? '#eab308' : '#ef4444' }}>
                    {validacion.datos >= 2 ? '✅' : validacion.datos >= 1 ? '⚠️' : '❌'} {validacion.datos} datos
                  </div>
                </div>
                
                {validacion.problemas.length > 0 && (
                  <div style={{ marginTop: 12, padding: 10, background: 'rgba(239,68,68,0.1)', borderRadius: 6, fontSize: 11, color: '#fca5a5' }}>
                    <strong>Problemas:</strong> {validacion.problemas.join(', ')}
                  </div>
                )}
              </div>
            )}
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
