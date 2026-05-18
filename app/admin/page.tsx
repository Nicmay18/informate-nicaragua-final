'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  LayoutDashboard, FileText, Newspaper, PlusCircle, Edit3, Trash2, Eye,
  Settings, LogOut, Search, Moon, Sun, TrendingUp, Activity,
  AlertTriangle, Star, Globe, Trophy, Cpu, Flag, ChevronRight,
  Copy, Check, Sparkles, BarChart3, Type, Image as ImageIcon, Upload,
  Send, RotateCcw, Zap, Hash, Award, BookOpen
} from 'lucide-react';
import './admin.css';

// ===================== TYPES =====================
interface NoticiaAdmin {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  contenido: string;
  categoria: string;
  imagen: string;
  fecha: string;
  autor: string;
  destacada: boolean;
  vistas: number;
  publicado: boolean;
}

interface ToastMsg {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface EvalResult {
  puntaje: number;
  calificacion: string;
  titulo: string;
  categoria: string;
  tiempo: string;
  seo: string;
}

// ===================== CONSTANTS =====================
const CATEGORIAS = ['Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos', 'Tecnología', 'Economía', 'Cultura'];

const CAT_META: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  Sucesos: { color: '#dc2626', bg: 'var(--bg-danger)', icon: <AlertTriangle size={18} /> },
  Nacionales: { color: '#2563eb', bg: 'var(--bg-info)', icon: <Flag size={18} /> },
  Deportes: { color: '#059669', bg: 'var(--bg-success)', icon: <Trophy size={18} /> },
  Internacionales: { color: '#0891b2', bg: 'var(--bg-info)', icon: <Globe size={18} /> },
  Espectáculos: { color: '#db2777', bg: 'var(--bg-danger)', icon: <Star size={18} /> },
  Tecnología: { color: '#0ea5e9', bg: 'var(--bg-info)', icon: <Cpu size={18} /> },
  Economía: { color: '#d97706', bg: 'var(--bg-warning)', icon: <TrendingUp size={18} /> },
  Cultura: { color: '#7c3aed', bg: 'var(--bg-success)', icon: <Sparkles size={18} /> },
};

// ===================== HELPERS =====================
function formatDate(fecha: string) {
  const d = new Date(fecha);
  return d.toLocaleDateString('es-NI', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripHtml(html: string) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(text: string) {
  return stripHtml(text).split(/\s+/).filter(Boolean).length;
}

function estimateReadTime(text: string) {
  const w = countWords(text);
  return Math.max(1, Math.ceil(w / 200));
}

async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

async function convertFileToWebP(file: File): Promise<{ base64: string; preview: string }> {
  const dataUrl = await readFileAsDataURL(file);
  const base64FromDataUrl = (url: string) => (url.includes(',') ? url.split(',')[1] ?? '' : url);

  if (file.type === 'image/webp' || typeof window === 'undefined') {
    return { base64: base64FromDataUrl(dataUrl), preview: dataUrl };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas no soportado');
        ctx.drawImage(img, 0, 0);
        const webpUrl = canvas.toDataURL('image/webp', 0.9);
        resolve({ base64: base64FromDataUrl(webpUrl), preview: webpUrl });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('No se pudo procesar la imagen'));
    img.src = dataUrl;
  });
}

// ===================== TOAST =====================
function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const idRef = useRef(0);

  const show = useCallback((type: ToastMsg['type'], title: string, message: string) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, show, remove };
}

function ToastContainer({ toasts, onRemove }: { toasts: ToastMsg[]; onRemove: (id: number) => void }) {
  return (
    <div className="admin-toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`admin-toast ${t.type}`}>
          <div className="admin-toast__icon">{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '!' : 'ℹ'}</div>
          <div className="admin-toast__content">
            <div className="admin-toast__title">{t.title}</div>
            <div className="admin-toast__message">{t.message}</div>
          </div>
          <button className="admin-toast__close" onClick={() => onRemove(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

// ===================== MAIN COMPONENT =====================
export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [news, setNews] = useState<NoticiaAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    titulo: '',
    resumen: '',
    contenido: '',
    categoria: 'Nacionales',
    imagen: '',
    autor: 'Nicaragua Informate',
    destacada: false,
    publicado: true,
    notificarTelegram: true,
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('periodistico');
  const [aiResults, setAiResults] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const [evalUrl, setEvalUrl] = useState('');
  const [evalResults, setEvalResults] = useState<EvalResult[]>([]);
  const [evalLoading, setEvalLoading] = useState(false);

  // Config tokens (persisted in localStorage like old admin)
  const [config, setConfig] = useState({
    tgToken: '',
    tgChat: '',
    githubToken: '',
    githubOwner: 'Nicmay18',
    githubRepo: 'informate-images',
    githubPath: 'images/',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ni_admin_config');
      if (saved) setConfig((c) => ({ ...c, ...JSON.parse(saved) }));
    } catch { /* ignore */ }
  }, []);

  const saveConfig = (patch: Partial<typeof config>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem('ni_admin_config', JSON.stringify(next));
      return next;
    });
  };

  const { toasts, show, remove } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [darkMode]);

  // Load news
  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/news', { headers: { 'x-admin-key': adminKey } });
      const data = await res.json();
      if (data.success) {
        setNews(data.news);
      }
    } catch (err) {
      console.error('[fetchNews]', err);
    }
  }, [adminKey]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: { 'x-admin-key': adminKey } });
      const data = await res.json();
      if (data.success) {
        setRealStats(data.stats);
      }
    } catch (err) {
      console.error('[fetchStats]', err);
    }
  }, [adminKey]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchNews();
      fetchStats();
    }
  }, [isLoggedIn, fetchNews, fetchStats]);

  const filteredNews = useMemo(() => {
    let list = news;
    if (categoryFilter !== 'Todas') {
      list = list.filter((n) => n.categoria === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((n) => n.titulo.toLowerCase().includes(q) || n.resumen.toLowerCase().includes(q));
    }
    return list;
  }, [news, categoryFilter, searchQuery]);

  // Real stats from Firebase
  const [realStats, setRealStats] = useState({
    total: 0, vistas: 0, publicadas: 0, destacadas: 0,
    topCategories: [] as [string, number][], monthly: [] as [string, number][]
  });

  const stats = useMemo(() => ({
    total: realStats.publicadas || news.length,
    vistas: realStats.vistas || news.reduce((s, n) => s + (n.vistas || 0), 0),
    destacadas: realStats.destacadas || news.filter((n) => n.destacada).length,
    cats: new Set(news.map((n) => n.categoria)).size,
  }), [news, realStats]);

  // Auth — verifica contra servidor (x-admin-key)
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/news', { headers: { 'x-admin-key': password } });
      if (res.ok) {
        setAdminKey(password);
        setIsLoggedIn(true);
        setPassword('');
        show('success', 'Bienvenido', 'Panel Editorial Pro v6.1 activado');
      } else {
        setLoginError('Contraseña incorrecta');
        show('error', 'Acceso denegado', 'Verifique su contraseña');
      }
    } catch {
      setLoginError('Error de conexión');
    }
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setAdminKey('');
    setPassword('');
    setActiveTab('dashboard');
    show('info', 'Sesión cerrada', 'Hasta pronto');
  }

  // Editor
  function openEditor(noticia?: NoticiaAdmin) {
    if (noticia) {
      setEditingId(noticia.id);
      setForm({
        titulo: noticia.titulo,
        resumen: noticia.resumen,
        contenido: noticia.contenido,
        categoria: noticia.categoria,
        imagen: noticia.imagen,
        autor: noticia.autor || 'Nicaragua Informate',
        destacada: noticia.destacada,
        publicado: noticia.publicado,
        notificarTelegram: false,
      });
      setImagePreview(noticia.imagen);
    } else {
      setEditingId(null);
      setForm({
        titulo: '',
        resumen: '',
        contenido: '',
        categoria: 'Nacionales',
        imagen: '',
        autor: 'Nicaragua Informate',
        destacada: false,
        publicado: true,
        notificarTelegram: true,
      });
      setImagePreview('');
    }
    setEditorOpen(true);
  }

  async function handleSave() {
    if (!form.titulo || !form.resumen || !form.contenido) {
      show('warning', 'Campos incompletos', 'Complete título, resumen y contenido');
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/news/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.success) {
          show('success', 'Noticia actualizada', 'Los cambios se guardaron correctamente');
          setEditorOpen(false);
          fetchNews();
        } else {
          show('error', 'Error', data.error || 'No se pudo actualizar');
        }
      } else {
        const res = await fetch('/api/admin/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify({
            ...form,
            notificarTelegram: form.notificarTelegram,
            telegramToken: config.tgToken,
            telegramChat: config.tgChat,
          }),
        });
        const data = await res.json();
        if (data.success) {
          show('success', 'Noticia publicada', `Slug: ${data.slug}`);
          setEditorOpen(false);
          fetchNews();
        } else {
          show('error', 'Error', data.error || 'No se pudo crear');
        }
      }
    } catch (err) {
      show('error', 'Error de red', String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta noticia permanentemente?')) return;
    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
      const data = await res.json();
      if (data.success) {
        show('success', 'Eliminado', 'Noticia eliminada correctamente');
        fetchNews();
      } else {
        show('error', 'Error', data.error || 'No se pudo eliminar');
      }
    } catch (err) {
      show('error', 'Error de red', String(err));
    }
  }

  // Image upload
  async function handleImageUpload(file: File) {
    if (!file) return;
    setUploadingImage(true);
    try {
      const { base64, preview } = await convertFileToWebP(file);
      setImagePreview(preview);

      const filename = `noticia-${Date.now()}.webp`;
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          image: base64,
          filename,
          token: config.githubToken,
          owner: config.githubOwner,
          repo: config.githubRepo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setForm((f) => ({ ...f, imagen: data.url }));
        setImagePreview(data.url);
        show('success', 'Imagen subida', data.url);
      } else {
        show('error', 'Error subiendo imagen', data.error || 'Error desconocido');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      show('error', 'Error', message);
    } finally {
      setUploadingImage(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImageUpload(file);
  }

  // AI Tools (client-side heuristics)
  function generateTitles() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setTimeout(() => {
      const p = aiPrompt.trim();
      const templates: Record<string, string[]> = {
        periodistico: [
          `${p}: Lo que debes saber este ${new Date().toLocaleDateString('es-NI', { weekday: 'long' })}`,
          `Confirman ${p} en Nicaragua; autoridades investigan`,
          `Impacto de ${p} en la economía nacional`,
        ],
        viral: [
          `🔴 ¡URGENTE! ${p} — Esto cambia TODO`,
          `¿Te enteraste? ${p} y las redes EXPLOTAN 💥`,
          `${p}: El secreto que nadie te contó 😱`,
        ],
        serio: [
          `Análisis profundo: ${p} y sus consecuencias`,
          `${p}: Datos, cifras y proyecciones oficiales`,
          `Expertos alertan sobre ${p}`,
        ],
        emotivo: [
          `La historia de ${p} que conmueve a Nicaragua`,
          `${p}: Un ejemplo de perseverancia y esperanza`,
          `Conmovedor: ${p} y su impacto en las familias`,
        ],
      };
      const selected = templates[aiTone] || templates.periodistico;
      setAiResults(selected.map((t) => t.charAt(0).toUpperCase() + t.slice(1)));
      setAiLoading(false);
    }, 1200);
  }

  // SEO Evaluator
  function evaluateSeo() {
    if (!evalUrl.trim() && news.length === 0) {
      show('warning', 'Sin datos', 'Ingrese URL o tenga noticias guardadas');
      return;
    }
    setEvalLoading(true);
    setTimeout(() => {
      const items: EvalResult[] = (evalUrl.trim() ? [{ titulo: evalUrl, resumen: '', contenido: '', categoria: 'General', fecha: new Date().toISOString(), vistas: 0, imagen: '' }] : news.slice(0, 10)).map((n) => {
        const wordCount = countWords(n.contenido || n.resumen || '');
        let puntaje = 50;
        if (n.titulo.length >= 40 && n.titulo.length <= 70) puntaje += 15;
        if (n.resumen && n.resumen.length >= 120 && n.resumen.length <= 160) puntaje += 15;
        if (wordCount >= 300) puntaje += 10;
        if ((n.contenido || '').includes('<h2>') || (n.contenido || '').includes('<h3>')) puntaje += 10;
        if (n.imagen) puntaje += 5;
        puntaje = Math.min(100, puntaje);
        let calificacion = 'Bajo';
        if (puntaje >= 90) calificacion = 'Excelente';
        else if (puntaje >= 75) calificacion = 'Bueno';
        else if (puntaje >= 60) calificacion = 'Medio';
        return {
          puntaje,
          calificacion,
          titulo: n.titulo,
          categoria: n.categoria,
          tiempo: `${estimateReadTime(n.contenido || n.resumen || '')} min`,
          seo: puntaje >= 75 ? 'Optimizado' : 'Requiere mejoras',
        };
      });
      setEvalResults(items);
      setEvalLoading(false);
    }, 900);
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
    show('success', 'Copiado', `${label} al portapapeles`);
  }

  // ===================== LOGIN =====================
  if (!isLoggedIn) {
    return (
      <div className="admin-login" data-theme={darkMode ? 'dark' : 'light'}>
        <div className="admin-login__grid" />
        <div className="admin-login__box">
          <div className="admin-login__brand">
            <div className="admin-login__icon">🗞️</div>
            <h1>Panel Editorial</h1>
            <p>Nicaragua Informate — Pro v6.1</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="admin-input-group">
              <label>Contraseña</label>
              <div className="admin-input-wrap">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                  placeholder="Ingrese contraseña"
                  style={{ paddingLeft: 14 }}
                />
              </div>
              {loginError && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{loginError}</p>}
            </div>
            <button type="submit" className="admin-btn admin-btn--primary admin-btn--lg" style={{ width: '100%' }}>
              <Sparkles size={18} /> Acceder al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===================== DASHBOARD =====================
  return (
    <div className={`admin-panel ${darkMode ? 'dark' : ''}`} data-theme={darkMode ? 'dark' : 'light'}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <div className="admin-sidebar__logo">NI</div>
          <div className="admin-sidebar__brand">
            <h2>Panel Editorial</h2>
            <span>Pro v6.1</span>
          </div>
        </div>

        <nav className="admin-nav__section">
          <div className="admin-nav__label">Principal</div>
          <ul className="admin-nav__menu">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
              { id: 'news', label: 'Noticias', icon: <Newspaper size={18} />, badge: news.length },
              { id: 'create', label: 'Nueva Noticia', icon: <PlusCircle size={18} /> },
              { id: 'ai', label: 'Herramientas AI', icon: <Sparkles size={18} /> },
              { id: 'seo', label: 'Evaluador SEO', icon: <BarChart3 size={18} /> },
              { id: 'config', label: 'Configuración', icon: <Settings size={18} /> },
            ].map((item) => (
              <li key={item.id} className="admin-nav__item">
                <a
                  className={`admin-nav__link ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => { setActiveTab(item.id); if (item.id === 'create') openEditor(); }}
                >
                  {item.icon}
                  {item.label}
                  {item.badge ? <span className="admin-nav__badge">{item.badge}</span> : null}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="admin-nav__section">
          <div className="admin-nav__label">Sistema</div>
          <ul className="admin-nav__menu">
            <li className="admin-nav__item">
              <a className="admin-nav__link" onClick={() => { setDarkMode(!darkMode); }}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
              </a>
            </li>
            <li className="admin-nav__item">
              <a className="admin-nav__link" onClick={handleLogout}>
                <LogOut size={18} /> Cerrar Sesión
              </a>
            </li>
          </ul>
        </nav>

        <div className="admin-user-card">
          <div className="admin-user__avatar">E</div>
          <div className="admin-user__info">
            <h4>Editor Principal</h4>
            <p>En línea</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="admin-tab active">
            <div className="admin-page__header">
              <div className="admin-page__title">
                <h1>Dashboard</h1>
                <p>Resumen del estado editorial en tiempo real</p>
              </div>
              <button className="admin-btn admin-btn--primary" onClick={() => { setActiveTab('create'); openEditor(); }}>
                <PlusCircle size={16} /> Nueva Noticia
              </button>
            </div>

            <div className="admin-stats">
              <div className="admin-stat">
                <div className="admin-stat__header">
                  <div>
                    <div className="admin-stat__value">{stats.total}</div>
                    <div className="admin-stat__label">Noticias publicadas</div>
                  </div>
                  <div className="admin-stat__icon admin-stat__icon--blue"><FileText size={22} /></div>
                </div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__header">
                  <div>
                    <div className="admin-stat__value">{stats.vistas.toLocaleString('es-NI')}</div>
                    <div className="admin-stat__label">Total de lecturas</div>
                  </div>
                  <div className="admin-stat__icon admin-stat__icon--green"><Eye size={22} /></div>
                </div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__header">
                  <div>
                    <div className="admin-stat__value">{stats.destacadas}</div>
                    <div className="admin-stat__label">Destacadas</div>
                  </div>
                  <div className="admin-stat__icon admin-stat__icon--orange"><Star size={22} /></div>
                </div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat__header">
                  <div>
                    <div className="admin-stat__value">{stats.cats}</div>
                    <div className="admin-stat__label">Categorías activas</div>
                  </div>
                  <div className="admin-stat__icon admin-stat__icon--purple"><Hash size={22} /></div>
                </div>
              </div>
            </div>

            <div className="admin-categories">
              {CATEGORIAS.map((cat) => {
                const count = news.filter((n) => n.categoria === cat).length;
                const meta = CAT_META[cat] || CAT_META.Nacionales;
                return (
                  <div key={cat} className="admin-category" onClick={() => { setCategoryFilter(cat); setActiveTab('news'); }}>
                    <div className="admin-category__icon" style={{ background: meta.bg, color: meta.color }}>{meta.icon}</div>
                    <div className="admin-category__info">
                      <h4>{cat}</h4>
                      <span>{count} noticias</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="admin-content-grid">
              <div className="admin-card">
                <div className="admin-card__header">
                  <div className="admin-card__title"><TrendingUp size={18} /> Últimas Noticias</div>
                  <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setActiveTab('news')}>Ver todas <ChevronRight size={14} /></button>
                </div>
                <div className="admin-card__body" style={{ padding: 0 }}>
                  {news.slice(0, 5).map((n) => (
                    <div key={n.id} className="admin-news-item">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={n.imagen || '/logo.png'} alt="" className="admin-news-item__thumb" loading="lazy" />
                      <div className="admin-news-item__content">
                        <div className="admin-news-item__title">{n.titulo}</div>
                        <div className="admin-news-item__meta">
                          <span style={{ color: CAT_META[n.categoria]?.color }}>{n.categoria}</span>
                          <span>•</span>
                          <span>{formatDate(n.fecha)}</span>
                          <span>•</span>
                          <span>{n.vistas || 0} lecturas</span>
                        </div>
                      </div>
                      <div className="admin-news-item__actions">
                        <button className="admin-news-item__btn" onClick={() => openEditor(n)} title="Editar"><Edit3 size={14} /></button>
                        <button className="admin-news-item__btn" onClick={() => handleDelete(n.id)} title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  {news.length === 0 && (
                    <div className="admin-empty">
                      <div className="admin-empty__icon"><Newspaper size={28} /></div>
                      <h3>Sin noticias</h3>
                      <p>Cree su primera noticia para comenzar</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card__header">
                  <div className="admin-card__title"><Activity size={18} /> Actividad Reciente</div>
                </div>
                <div className="admin-card__body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {news.slice(0, 6).map((n) => (
                      <div key={n.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_META[n.categoria]?.color || '#94a3b8', marginTop: 6, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.titulo}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{formatDate(n.fecha)} • {n.vistas || 0} lecturas</p>
                        </div>
                      </div>
                    ))}
                    {news.length === 0 && <p style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>Sin actividad reciente</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card" style={{ marginTop: 24 }}>
              <div className="admin-card__header">
                <div className="admin-card__title"><BarChart3 size={16} /> Analytics del Sitio</div>
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--ghost admin-btn--sm">Abrir Search Console ↗</a>
              </div>
              <div className="admin-card__body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>Noticias por mes</h4>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
                      {realStats.monthly.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Sin datos</span>}
                      {realStats.monthly.map(([month, count]) => {
                        const max = Math.max(...realStats.monthly.map((m) => m[1]), 1);
                        const pct = (count / max) * 100;
                        return (
                          <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: '100%', height: `${pct}%`, background: 'linear-gradient(180deg, #6366f1, #4338ca)', borderRadius: '4px 4px 0 0', minHeight: 4 }} />
                            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{month.slice(5)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>Top Categorías</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {realStats.topCategories.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Sin datos</span>}
                      {realStats.topCategories.map(([cat, count]) => {
                        const max = Math.max(...realStats.topCategories.map((c) => c[1]), 1);
                        const pct = (count / max) * 100;
                        const meta = CAT_META[cat];
                        return (
                          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, width: 110, color: meta?.color || 'var(--text-primary)' }}>{cat}</span>
                            <div className="admin-progress" style={{ flex: 1, height: 6, marginTop: 0 }}>
                              <div className="admin-progress__fill" style={{ width: `${pct}%`, background: meta?.color || '#6366f1' }} />
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', width: 30, textAlign: 'right' }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="admin-tab active">
            <div className="admin-page__header">
              <div className="admin-page__title">
                <h1>Gestión de Noticias</h1>
                <p>{filteredNews.length} noticias encontradas</p>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="Buscar noticias..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '10px 14px 10px 38px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--bg-body)', color: 'var(--text-primary)', width: 260 }}
                  />
                </div>
                <button className="admin-btn admin-btn--primary" onClick={() => { setActiveTab('create'); openEditor(); }}>
                  <PlusCircle size={16} /> Nueva
                </button>
              </div>
            </div>

            <div className="admin-filter">
              {['Todas', ...CATEGORIAS].map((cat) => (
                <button key={cat} className={`admin-filter__btn ${categoryFilter === cat ? 'active' : ''}`} onClick={() => setCategoryFilter(cat)}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="admin-card">
              <div className="admin-card__body" style={{ padding: 0 }}>
                {filteredNews.map((n) => (
                  <div key={n.id} className="admin-news-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.imagen || '/logo.png'} alt="" className="admin-news-item__thumb" loading="lazy" />
                    <div className="admin-news-item__content">
                      <div className="admin-news-item__title">{n.titulo}</div>
                      <div className="admin-news-item__meta">
                        <span style={{ color: CAT_META[n.categoria]?.color, fontWeight: 600 }}>{n.categoria}</span>
                        <span>•</span>
                        <span>{formatDate(n.fecha)}</span>
                        <span>•</span>
                        <span>{n.vistas || 0} lecturas</span>
                        {n.destacada && <span style={{ background: 'var(--bg-warning)', color: 'var(--warning)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 700 }}>DESTACADA</span>}
                      </div>
                    </div>
                    <div className="admin-news-item__actions">
                      <button className="admin-news-item__btn" onClick={() => openEditor(n)} title="Editar"><Edit3 size={14} /></button>
                      <button className="admin-news-item__btn" onClick={() => handleDelete(n.id)} title="Eliminar"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {filteredNews.length === 0 && (
                  <div className="admin-empty">
                    <div className="admin-empty__icon"><Search size={28} /></div>
                    <h3>Sin resultados</h3>
                    <p>Pruebe con otros filtros o cree una nueva noticia</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Tab */}
        {activeTab === 'create' && editorOpen && (
          <div className="admin-tab active">
            <div className="admin-page__header">
              <div className="admin-page__title">
                <h1>{editingId ? 'Editar Noticia' : 'Nueva Noticia'}</h1>
                <p>{editingId ? 'Modifique los campos y guarde los cambios' : 'Complete todos los campos para publicar'}</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="admin-btn admin-btn--ghost" onClick={() => setShowPreview((p) => !p)}>
                  <Eye size={16} /> {showPreview ? 'Ocultar' : 'Vista Previa'}
                </button>
                <button className="admin-btn admin-btn--secondary" onClick={() => { setEditorOpen(false); setActiveTab('news'); setShowPreview(false); }}>Cancelar</button>
                <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={loading}>
                  {loading ? 'Guardando...' : <><Send size={16} /> {editingId ? 'Actualizar' : 'Publicar'}</>}
                </button>
              </div>
            </div>

            <div className="admin-content-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
              <div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Título <span className="required">*</span></label>
                  <input className="admin-form-input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título atractivo y descriptivo" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Resumen / Extracto <span className="required">*</span></label>
                  <textarea className="admin-form-input" rows={3} value={form.resumen} onChange={(e) => setForm({ ...form, resumen: e.target.value })} placeholder="Resumen breve (120-160 caracteres ideal para SEO)" style={{ resize: 'vertical' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{form.resumen.length} caracteres</span>
                    <span style={{ fontSize: 12, color: form.resumen.length >= 120 && form.resumen.length <= 160 ? 'var(--success)' : 'var(--warning)' }}>
                      {form.resumen.length >= 120 && form.resumen.length <= 160 ? '✓ SEO óptimo' : 'Meta: 120-160 chars'}
                    </span>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Contenido <span className="required">*</span></label>
                  <div className="admin-editor__toolbar">
                    {['Negrita', 'Cursiva', 'H2', 'H3', 'Lista', 'Enlace', 'Cita'].map((tool) => (
                      <button key={tool} type="button" onClick={() => {
                        const ta = document.getElementById('content-ta') as HTMLTextAreaElement;
                        if (!ta) return;
                        const s = ta.selectionStart;
                        const e = ta.selectionEnd;
                        const val = ta.value;
                        const sel = val.substring(s, e);
                        let wrap = sel;
                        if (tool === 'Negrita') wrap = `<strong>${sel || 'texto'}</strong>`;
                        if (tool === 'Cursiva') wrap = `<em>${sel || 'texto'}</em>`;
                        if (tool === 'H2') wrap = `<h2>${sel || 'Título'}</h2>`;
                        if (tool === 'H3') wrap = `<h3>${sel || 'Subtítulo'}</h3>`;
                        if (tool === 'Lista') wrap = `<ul>\n  <li>${sel || 'Item'}</li>\n</ul>`;
                        if (tool === 'Enlace') wrap = `<a href="https://">${sel || 'enlace'}</a>`;
                        if (tool === 'Cita') wrap = `<blockquote>${sel || 'Cita'}</blockquote>`;
                        const newVal = val.substring(0, s) + wrap + val.substring(e);
                        setForm((f) => ({ ...f, contenido: newVal }));
                        setTimeout(() => { ta.focus(); ta.setSelectionRange(s + wrap.length, s + wrap.length); }, 0);
                      }}>{tool}</button>
                    ))}
                  </div>
                  <textarea id="content-ta" className="admin-editor__textarea" value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} placeholder="Escriba el contenido de la noticia aquí..." />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                    <span>{countWords(form.contenido)} palabras • ~{estimateReadTime(form.contenido)} min lectura</span>
                    <span>Soporta HTML</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="admin-card" style={{ marginBottom: 24 }}>
                  <div className="admin-card__header">
                    <div className="admin-card__title"><Settings size={16} /> Configuración</div>
                  </div>
                  <div className="admin-card__body">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Categoría</label>
                      <select className="admin-form-select" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                        {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Autor</label>
                      <input className="admin-form-input" value={form.autor} onChange={(e) => setForm({ ...form, autor: e.target.value })} />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.destacada} onChange={(e) => setForm({ ...form, destacada: e.target.checked })} style={{ width: 18, height: 18 }} />
                        Destacar en portada
                      </label>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.publicado} onChange={(e) => setForm({ ...form, publicado: e.target.checked })} style={{ width: 18, height: 18 }} />
                        Publicar inmediatamente
                      </label>
                    </div>
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card__header">
                    <div className="admin-card__title"><ImageIcon size={16} /> Imagen Destacada</div>
                  </div>
                  <div className="admin-card__body">
                    <div
                      className="admin-upload"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                      <div className="admin-upload__icon">{uploadingImage ? <div className="admin-spinner" style={{ width: 28, height: 28, borderWidth: 2 }} /> : <Upload size={24} />}</div>
                      <div className="admin-upload__text">{uploadingImage ? 'Subiendo...' : 'Arrastre o haga clic'}</div>
                      <div className="admin-upload__subtext">WEBP recomendado, máx 2MB</div>
                    </div>
                    {imagePreview && (
                      <div className="admin-image-preview">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="Preview" />
                        <div className="admin-image-preview__overlay">
                          <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => { setImagePreview(''); setForm((f) => ({ ...f, imagen: '' })); }}>
                            <Trash2 size={14} /> Quitar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-card" style={{ marginTop: 24 }}>
                  <div className="admin-card__header">
                    <div className="admin-card__title"><Eye size={16} /> Previsualización SEO</div>
                  </div>
                  <div className="admin-card__body">
                    <div className="admin-seo">
                      <div className="admin-seo__url">nicaraguainformate.com/noticias/{slugify(form.titulo) || 'slug'}</div>
                      <div className="admin-seo__title">{form.titulo || 'Título de la noticia'}</div>
                      <div className="admin-seo__desc">{form.resumen || 'Resumen de la noticia que aparecerá en los resultados de búsqueda...'}</div>
                    </div>
                  </div>
                </div>

                {/* Textos listos para copiar en redes */}
                <div className="admin-card" style={{ marginTop: 24 }}>
                  <div className="admin-card__header">
                    <div className="admin-card__title"><Send size={16} /> Textos para Redes Sociales</div>
                    <button
                      className="admin-btn admin-btn--ghost admin-btn--sm"
                      onClick={() => setForm((f) => ({ ...f, titulo: '', resumen: '', contenido: '', imagen: '', notificarTelegram: true }))}
                    >
                      <RotateCcw size={13} /> Limpiar todo
                    </button>
                  </div>
                  <div className="admin-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {(() => {
                      const slug = form.titulo ? slugify(form.titulo) : 'slug-noticia';
                      const url = `https://nicaraguainformate.com/noticias/${slug}/`;
                      const catEmoji = ({ Sucesos: '🚨', Nacionales: '🇳🇮', Deportes: '⚽', Internacionales: '🌍', Espectáculos: '🎬', Tecnología: '💻', Economía: '📈', Cultura: '🎭' } as Record<string,string>)[form.categoria] || '📰';
                      const titulo = form.titulo || 'Título de la noticia';
                      const resumen = form.resumen || 'Resumen de la noticia...';

                      const textos = [
                        {
                          red: 'Telegram',
                          color: '#0088cc',
                          sigla: 'T',
                          texto: `${catEmoji} *${titulo}*\n\n${resumen}\n\n🔗 Leer noticia completa: ${url}`,
                        },
                        {
                          red: 'WhatsApp',
                          color: '#25d366',
                          sigla: 'W',
                          texto: `${catEmoji} *${titulo}*\n\n${resumen}\n\n👉 ${url}`,
                        },
                        {
                          red: 'Facebook',
                          color: '#1877f2',
                          sigla: 'f',
                          texto: `${titulo}\n\n${resumen}\n\nLee la noticia completa aquí 👇\n${url}\n\n#Nicaragua #Noticias #NicaraguaInformate`,
                        },
                      ];

                      return textos.map(({ red, color, sigla, texto }) => (
                        <div key={red}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 18, height: 18, background: color, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 900 }}>{sigla}</span>
                            {red}
                          </div>
                          <div style={{ position: 'relative' }}>
                            <textarea
                              readOnly
                              value={texto}
                              rows={4}
                              style={{ width: '100%', resize: 'none', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5, padding: '10px 80px 10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}
                            />
                            <button
                              onClick={() => copyToClipboard(texto, `${red}`)}
                              style={{ position: 'absolute', top: 8, right: 8, padding: '5px 12px', borderRadius: 6, border: 'none', background: color, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              {copiedField === red ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                            </button>
                          </div>
                        </div>
                      ));
                    })()}

                    {/* Telegram auto-notify toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                      <input
                        type="checkbox"
                        checked={form.notificarTelegram}
                        onChange={(e) => setForm({ ...form, notificarTelegram: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#0088cc' }}
                      />
                      <span style={{ color: form.notificarTelegram ? '#0088cc' : 'var(--text-tertiary)' }}>
                        {form.notificarTelegram ? '✅ Enviar automáticamente al canal de Telegram al publicar' : '⬜ No enviar a Telegram automáticamente'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Article Preview */}
            {showPreview && (
              <div className="admin-card" style={{ marginTop: 24 }}>
                <div className="admin-card__header">
                  <div className="admin-card__title"><Eye size={16} /> Vista Previa de la Noticia</div>
                </div>
                <div className="admin-card__body" style={{ padding: 0 }}>
                  <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 28px', background: '#ffffff', color: '#111827' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#dc2626', marginBottom: 12, letterSpacing: '0.8px' }}>{form.categoria}</div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.25, marginBottom: 16, color: '#0f172a' }}>{form.titulo || 'Título de la noticia'}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, color: '#64748b', fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{form.autor || 'Nicaragua Informate'}</span>
                      <span>•</span>
                      <span>{new Date().toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      <span>•</span>
                      <span>{estimateReadTime(form.contenido)} min de lectura</span>
                    </div>
                    {form.imagen && (
                      <div style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.imagen} alt={form.titulo} style={{ width: '100%', height: 'auto', display: 'block' }} />
                      </div>
                    )}
                    <p style={{ fontSize: 17, lineHeight: 1.7, color: '#374151', marginBottom: 20, fontWeight: 500 }}>{form.resumen}</p>
                    <div
                      style={{ fontSize: 16, lineHeight: 1.8, color: '#374151' }}
                      dangerouslySetInnerHTML={{ __html: form.contenido }}
                    />
                    <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {['Nicaragua', form.categoria, 'Noticias'].map((tag) => (
                          <span key={tag} style={{ background: '#f3f4f6', color: '#4b5563', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 20 }}>#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Tools Tab */}
        {activeTab === 'ai' && (
          <div className="admin-tab active">
            <div className="admin-page__header">
              <div className="admin-page__title">
                <h1>Herramientas AI</h1>
                <p>Genere títulos, resúmenes y más con asistencia inteligente</p>
              </div>
            </div>

            <div className="admin-ai">
              <h3><Zap size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} /> Generador de Títulos</h3>
              <p>Ingrese un tema o palabras clave para recibir sugerencias de títulos optimizados</p>
              <div className="admin-ai__controls" style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}>
                <input
                  type="text"
                  placeholder="Ej: economía Nicaragua, festival cultural, nuevo hospital..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && generateTitles()}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '11px 14px', borderRadius: 'var(--radius-md)', fontSize: 14 }}
                />
                <select className="admin-ai__select" value={aiTone} onChange={(e) => setAiTone(e.target.value)}>
                  <option value="periodistico">Periodístico</option>
                  <option value="viral">Viral</option>
                  <option value="serio">Serio</option>
                  <option value="emotivo">Emotivo</option>
                </select>
                <select className="admin-ai__select">
                  <option>Español (NI)</option>
                </select>
                <button className="admin-ai__btn" onClick={generateTitles} disabled={aiLoading}>
                  {aiLoading ? '...' : <><Sparkles size={16} /> Generar</>}
                </button>
              </div>
            </div>

            {aiResults.length > 0 && (
              <div className="admin-card" style={{ marginBottom: 24 }}>
                <div className="admin-card__header">
                  <div className="admin-card__title"><Award size={16} /> Resultados</div>
                  <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setAiResults([])}><RotateCcw size={14} /> Limpiar</button>
                </div>
                <div className="admin-card__body">
                  {aiResults.map((t, i) => (
                    <div key={i} className="admin-copy__section">
                      <div className="admin-copy__label">Opción {i + 1}</div>
                      <div className="admin-copy__box" onClick={() => copyToClipboard(t, `Título ${i + 1}`)}>
                        {t}
                        <button className="admin-copy__btn" onClick={(e) => { e.stopPropagation(); copyToClipboard(t, `Título ${i + 1}`); }}>
                          {copiedField === `Título ${i + 1}` ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-content-grid">
              <div className="admin-card">
                <div className="admin-card__header">
                  <div className="admin-card__title"><Type size={16} /> Extracto Automático</div>
                </div>
                <div className="admin-card__body">
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Pegue el contenido completo de la noticia para generar un resumen optimizado para SEO.</p>
                  <textarea
                    className="admin-form-input"
                    rows={4}
                    placeholder="Pegue el contenido aquí..."
                    onBlur={(e) => {
                      const text = e.target.value;
                      if (!text || form.resumen) return;
                      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
                      const summary = sentences.slice(0, 2).join(' ').trim();
                      if (summary.length > 50) {
                        setForm((f) => ({ ...f, resumen: summary.substring(0, 160) }));
                        show('success', 'Resumen generado', 'Se ha creado un extracto automático');
                      }
                    }}
                  />
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card__header">
                  <div className="admin-card__title"><Hash size={16} /> Palabras Clave</div>
                </div>
                <div className="admin-card__body">
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Ingrese un texto para extraer las palabras clave más relevantes.</p>
                  <textarea
                    className="admin-form-input"
                    rows={4}
                    placeholder="Pegue el texto aquí..."
                    onBlur={(e) => {
                      const text = e.target.value.toLowerCase();
                      if (!text) return;
                      const words = text.split(/\s+/).filter((w) => w.length > 4);
                      const freq: Record<string, number> = {};
                      words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
                      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
                      if (sorted.length > 0) {
                        show('info', 'Palabras clave', sorted.join(', '));
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEO Evaluator Tab */}
        {activeTab === 'seo' && (
          <div className="admin-tab active">
            <div className="admin-page__header">
              <div className="admin-page__title">
                <h1>Evaluador SEO</h1>
                <p>Analice la optimización de sus noticias para motores de búsqueda</p>
              </div>
            </div>

            {/* Guía SEO para Periodistas */}
            <div className="admin-card" style={{ marginBottom: 24 }}>
              <div className="admin-card__header">
                <div className="admin-card__title"><BookOpen size={16} /> Guía SEO + Google Discover</div>
              </div>
              <div className="admin-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8, letterSpacing: '0.5px' }}>TITULAR PERFECTO</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--text)' }}>Fórmula:</strong> [Hecho principal] + [impacto] + [lugar]<br/>
                    <strong>Ejemplo correcto:</strong> <em>KFC abre sus primeros locales en Managua este año</em>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: 8 }}>Reglas Obligatorias</div>
                    <ul style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
                      <li>45–60 caracteres</li>
                      <li>Verbo en presente</li>
                      <li>Palabra clave al inicio</li>
                      <li>Máximo 2 nombres propios</li>
                      <li>Contexto geográfico si aplica</li>
                      <li>Dato concreto cuando sea posible</li>
                    </ul>
                  </div>
                  <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', marginBottom: 8 }}>Prohibido</div>
                    <ul style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
                      <li>Clickbait</li>
                      <li>"Increíble", "impactante", "escándalo"</li>
                      <li>MAYÚSCULAS excesivas</li>
                      <li>Emojis</li>
                      <li>Signos de exclamación</li>
                      <li>Puntos suspensivos</li>
                    </ul>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8, letterSpacing: '0.5px' }}>META DESCRIPTION & IMAGEN</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><strong style={{ color: 'var(--text)' }}>Meta description:</strong> 150–160 caracteres. Resumen claro con contexto y palabra clave.</div>
                    <div><strong style={{ color: 'var(--text)' }}>Imagen Discover:</strong> 1200x628 px. Sin texto encima. Rostros o acción real. Alta calidad.</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8, letterSpacing: '0.5px' }}>INDEXACIÓN RÁPIDA</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Para noticias urgentes: publicar → actualizar sitemap → compartir en redes → enlazar desde home → solicitar indexación en Google Search Console.
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8, letterSpacing: '0.5px' }}>CHECKLIST FINAL</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span>✅ Título validado</span>
                    <span>✅ Imagen optimizada</span>
                    <span>✅ Categoría correcta</span>
                    <span>✅ Meta description lista</span>
                    <span>✅ Enlace interno agregado</span>
                    <span>✅ SEO Title &lt; 60 caracteres</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card" style={{ marginBottom: 24 }}>
              <div className="admin-card__body">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    className="admin-form-input"
                    placeholder="https://... (opcional)"
                    value={evalUrl}
                    onChange={(e) => setEvalUrl(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="admin-btn admin-btn--primary" onClick={evaluateSeo} disabled={evalLoading}>
                    {evalLoading ? 'Analizando...' : <><BarChart3 size={16} /> Evaluar noticias</>}
                  </button>
                </div>
              </div>
            </div>

            {evalResults.length > 0 && (
              <div className="admin-card">
                <div className="admin-card__header">
                  <div className="admin-card__title"><BarChart3 size={16} /> Resultados del Análisis</div>
                </div>
                <div className="admin-card__body" style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Categoría</th>
                        <th>Tiempo lectura</th>
                        <th>Puntaje SEO</th>
                        <th>Calificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evalResults.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titulo}</td>
                          <td><span style={{ color: CAT_META[r.categoria]?.color, fontWeight: 700 }}>{r.categoria}</span></td>
                          <td>{r.tiempo}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="admin-progress" style={{ width: 80, marginTop: 0 }}>
                                <div className="admin-progress__fill" style={{ width: `${r.puntaje}%`, background: r.puntaje >= 75 ? 'var(--success)' : r.puntaje >= 60 ? 'var(--warning)' : 'var(--danger)' }} />
                              </div>
                              <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{r.puntaje}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`admin-score admin-score--${r.calificacion.toLowerCase()}`}>
                              {r.calificacion}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="admin-tab active">
            <div className="admin-page__header">
              <div className="admin-page__title">
                <h1>Configuración</h1>
                <p>Integraciones y tokens del sistema</p>
              </div>
            </div>

            <div className="admin-content-grid">
              <div className="admin-card">
                <div className="admin-card__header">
                  <div className="admin-card__title"><Settings size={16} /> Telegram Bot</div>
                </div>
                <div className="admin-card__body">
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>Configura el bot de Telegram para notificaciones automáticas al publicar.</p>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Bot Token</label>
                    <input
                      type="password"
                      className="admin-form-input"
                      placeholder="1234567890:ABC..."
                      value={config.tgToken}
                      onChange={(e) => saveConfig({ tgToken: e.target.value })}
                      style={{ fontFamily: 'monospace', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Chat ID</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="-100..."
                      value={config.tgChat}
                      onChange={(e) => saveConfig({ tgChat: e.target.value })}
                      style={{ fontFamily: 'monospace', fontSize: 13 }}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card__header">
                  <div className="admin-card__title"><ImageIcon size={16} /> GitHub - Subida de Imágenes</div>
                </div>
                <div className="admin-card__body">
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>Token para subir imágenes al repo de GitHub (CDN jsDelivr).</p>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Personal Access Token</label>
                    <input
                      type="password"
                      className="admin-form-input"
                      placeholder="ghp_xxxxxxxxxxxx"
                      value={config.githubToken}
                      onChange={(e) => saveConfig({ githubToken: e.target.value })}
                      style={{ fontFamily: 'monospace', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Owner</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Nicmay18"
                      value={config.githubOwner}
                      onChange={(e) => saveConfig({ githubOwner: e.target.value })}
                      style={{ fontFamily: 'monospace', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Repo</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="informate-images"
                      value={config.githubRepo}
                      onChange={(e) => saveConfig({ githubRepo: e.target.value })}
                      style={{ fontFamily: 'monospace', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Ruta imágenes</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="images/"
                      value={config.githubPath}
                      onChange={(e) => saveConfig({ githubPath: e.target.value })}
                      style={{ fontFamily: 'monospace', fontSize: 13 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card" style={{ marginTop: 20 }}>
              <div className="admin-card__header">
                <div className="admin-card__title"><Activity size={16} /> Estado del Sistema</div>
              </div>
              <div className="admin-card__body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div style={{ padding: 14, background: config.tgToken ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)', borderRadius: 8, border: `1px solid ${config.tgToken ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}` }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: config.tgToken ? '#059669' : '#dc2626' }}>Telegram</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{config.tgToken ? 'Configurado ✅' : 'No configurado ❌'}</div>
                  </div>
                  <div style={{ padding: 14, background: config.githubToken ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)', borderRadius: 8, border: `1px solid ${config.githubToken ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}` }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: config.githubToken ? '#059669' : '#dc2626' }}>GitHub</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{config.githubToken ? 'Configurado ✅' : 'No configurado ❌'}</div>
                  </div>
                  <div style={{ padding: 14, background: adminKey ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)', borderRadius: 8, border: `1px solid ${adminKey ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}` }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: adminKey ? '#059669' : '#dc2626' }}>Admin Key</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{adminKey ? 'Autenticado ✅' : 'No autenticado ❌'}</div>
                  </div>
                  <div style={{ padding: 14, background: 'rgba(8,145,178,0.08)', borderRadius: 8, border: '1px solid rgba(8,145,178,0.2)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0891b2' }}>Noticias</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{news.length} publicadas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onRemove={remove} />

      {loading && (
        <div className="admin-loading show">
          <div className="admin-spinner" />
          <div className="admin-loading__text">Procesando...</div>
        </div>
      )}
    </div>
  );
}
