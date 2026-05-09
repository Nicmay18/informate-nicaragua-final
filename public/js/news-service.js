import { initFirebase, getFirebaseError, resetFirebase, ERROR_CODES } from './firebase-loader.js';
const CACHE_KEY = 'ni_news_cache_v10';
const CACHE_META_KEY = 'ni_news_cache_meta_v10';
const CACHE_MAX_AGE_MS = 300000; // 5 minutos

class NewsService {
  constructor() {
    this.listeners = [];
    this.unsubscribe = null;
  }
  async loadNews(opts = {}) {
    const { useCache = true, useRealtime = true, limit = 50 } = opts;

    // 1. Revisar cache solo si es válida y NO contiene demo
    if (useCache) {
      const c = this._fromCache();
      if (c.length && !this._hasDemoData(c)) {
        // Cache válida: mostrar inmediatamente, refrescar en background
        this._fetchFB(limit, useRealtime);
        return { data: c, source: 'cache', stale: this._isStale() };
      }
      // Si tiene demo, limpiar y continuar a Firebase
      if (c.length) {
        console.warn('[NewsService] Cache con datos demo detectado. Ignorando.');
        this._clearCache();
      }
    }

    // 2. Cargar directamente desde Firebase (esperar resultado)
    const r = await this._fetchFB(limit, useRealtime);
    if (r.data.length) {
      this._saveCache(r.data);
      return { data: r.data, source: 'firebase', stale: false };
    }
    return { data: [], source: 'empty', stale: false };
  }
  async refresh(limit = 50) {
    resetFirebase();
    const r = await this._fetchFB(limit, true);
    if (r.data.length) this._saveCache(r.data);
    return r;
  }
  async getBySlug(slug) {
    const cached = this._fromCache();
    const found = cached.find(n => n.slug === slug);
    if (found) return { data: found, source: 'cache' };

    const { collection, query, where, getDocs, limit } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const { db } = await initFirebase();
    if (!db) return { data: null, source: 'error', error: getFirebaseError() };

    const q = query(collection(db, 'noticias'), where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return { data: this._norm(snap.docs[0]), source: 'firebase' };
    return { data: null, source: 'not_found' };
  }
  detach() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
  async _fetchFB(limitCount, useRealtime) {
    const { db, ready, error } = await initFirebase();
    if (!ready) return { data: [], error, source: 'firebase_error' };

    try {
      const { collection, query, orderBy, limit, onSnapshot, getDocs } =
        await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

      const q = query(collection(db, 'noticias'), orderBy('fecha', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      const arr = [];
      let demoCount = 0;

      snap.forEach(d => {
        const id = d.id;
        // RECHAZAR IDs de demo
        if (this._isDemoId(id)) {
          console.warn('[NewsService] IGNORANDO documento demo por ID:', id);
          demoCount++;
          return;
        }
        const data = this._norm(d);
        // RECHAZAR contenido demo
        if (this._isDemoContent(data)) {
          console.warn('[NewsService] IGNORANDO documento demo por contenido:', id);
          demoCount++;
          return;
        }
        arr.push(data);
      });

      console.log(`[NewsService] Procesados: ${arr.length} reales, ${demoCount} demo ignorados`);

      if (useRealtime && arr.length && !this.unsubscribe) {
        this.unsubscribe = onSnapshot(q, s => {
          const u = [];
          s.forEach(d => {
            if (this._isDemoId(d.id)) return;
            const normed = this._norm(d);
            if (this._isDemoContent(normed)) return;
            u.push(normed);
          });
          this._saveCache(u);
          this._notify(u);
        }, e => console.error('[NS] Realtime error:', e));
      }

      return { data: arr, source: 'firebase' };
    } catch (err) {
      console.error('[NewsService] Error Firestore:', err);
      return { data: [], error: err.message, source: 'firebase_error' };
    }
  }
  _isDemoId(id) {
    if (!id) return true;
    const demoPatterns = ['fb-', 'demo-', 'test-', 'example-', 'sample-'];
    return demoPatterns.some(p => id.toString().startsWith(p));
  }

  _hasDemoData(arr) {
    return arr.some(n => this._isDemoId(n.id) || this._isDemoContent(n));
  }
  _isDemoContent(data) {
    if (!data) return true;

    const demoImages = [
      'photo-1461896836934-f66c71d1ef65', 'photo-1516280440614-6697288d5d38',
      'photo-1526666923127-b2970f64b422', 'photo-1504711434969-e33886168f5c',
      'photo-1611974789855-9c2a0a7236a3', 'photo-1526304640152-d4619684e484'
    ];
    const img = (data.image || data.imagen || data.urlImagen || data.foto || '').toString();
    if (demoImages.some(d => img.includes(d))) return true;

    const demoTitles = ['noticia de ejemplo', 'demo', 'fallback', 'prueba', 'ejemplo', 'lorem ipsum'];
    const title = (data.title || data.titulo || '').toString().toLowerCase();
    if (demoTitles.some(t => title.includes(t))) return true;

    return false;
  }
  _norm(d) {
    const r = d.data();
    return {
      id: d.id,
      title: r.titulo || r.title || 'Sin título',
      excerpt: r.resumen || r.excerpt || '',
      content: r.contenido || r.content || '<p>...</p>',
      category: r.categoria || r.category || 'Nacionales',
      author: r.autor || r.author || 'Redacción Keling Rivera M.',
      date: r.fecha?.toDate ? r.fecha.toDate().toISOString() : (r.fecha || new Date().toISOString()),
      image: this._fixImg(r.imagen || r.image, r.categoria || r.category),
      readTime: r.tiempoLectura || 3,
      slug: r.slug || this._slug(r.titulo || r.title),
      destacada: !!r.destacada,
      vistas: Number(r.vistas || r.views || 0)
    };
  }
  _fixImg(v, cat) {
    const p = {
      Sucesos: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80',
      Nacionales: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
      Deportes: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
      Internacionales: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=800&q=80',
      Economía: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
      Espectáculos: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800&q=80'
    };
    const fb = p[cat] || p.Nacionales;

    // Sin valor o valores inválidos → fallback
    if (!v || v === 'NaN' || v === 'null' || v === 'undefined') return fb;
    if (typeof v !== 'string') return fb;
    if (v.startsWith('data:image')) return fb;

    // Firebase Storage → extraer nombre y usar copia local (más rápida)
    if (v.includes('firebasestorage.googleapis.com')) {
      try {
        const m = v.match(/\/o\/(.+?)(\?|$)/);
        if (m) { const fn = decodeURIComponent(m[1]).split('/').pop(); if (fn && fn.length > 2) return `images/${fn}`; }
      } catch(e) {}
    }

    // GitHub/jsdelivr → extraer nombre del path
    if (v.includes('githubusercontent.com') || v.includes('github.com') || v.includes('cdn.jsdelivr.net')) {
      try {
        const m = v.match(/images\/([^/?#]+)/);
        if (m && m[1]) return `images/${m[1]}`;
      } catch(e) {}
    }

    // Otras URLs HTTP (Unsplash, etc.) → usar directo
    if (v.startsWith('http://') || v.startsWith('https://')) return v;

    // Ruta local existente (ej: "images/foto.webp") → usar tal cual
    if (v.startsWith('images/')) return v;

    // Solo nombre de archivo suelto → construir ruta local preservando nombre original
    let fn = v.split('/').pop().split('\\').pop().trim();
    if (!fn || fn.length < 2 || fn.includes('collage')) return fb;

    // Si ya tiene extensión de imagen, usar como está
    if (/\.(webp|jpg|jpeg|png|gif)$/i.test(fn)) {
      return `images/${fn}`;
    }

    // Sin extensión → asumir webp
    return `images/${fn}.webp`;
  }
  _slug(t) {
    if (!t) return 'sin-titulo';
    return t.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '').trim()
      .replace(/\s+/g, '-')
      .substring(0, 80)
      .replace(/-+$/, '');
  }
  _fromCache() {
    try {
      const r = localStorage.getItem(CACHE_KEY);
      const m = JSON.parse(localStorage.getItem(CACHE_META_KEY) || '{}');
      if (!r) return [];
      if (Date.now() - (m.time || 0) > CACHE_MAX_AGE_MS) {
        this._clearCache();
        return [];
      }
      const parsed = JSON.parse(r).map(n => ({ ...n, date: new Date(n.date) }));
      // Validación extra: si contiene demo, invalidar
      if (this._hasDemoData(parsed)) {
        console.warn('[NewsService] Cache local contiene datos demo. Invalidando.');
        this._clearCache();
        return [];
      }
      return parsed;
    } catch (e) { return []; }
  }

  _clearCache() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_META_KEY);
    // Limpiar también versiones antiguas por si acaso
    localStorage.removeItem('ni_news_cache_v3');
    localStorage.removeItem('ni_news_cache_meta_v3');
    localStorage.removeItem('ni_news_cache_v4');
    localStorage.removeItem('ni_news_cache_meta_v4');
    localStorage.removeItem('ni_news_cache_v5');
    localStorage.removeItem('ni_news_cache_meta_v5');
    localStorage.removeItem('ni_news_cache_v6');
    localStorage.removeItem('ni_news_cache_meta_v6');
    localStorage.removeItem('ni_news_cache_v7');
    localStorage.removeItem('ni_news_cache_meta_v7');
    localStorage.removeItem('ni_news_cache_v8');
    localStorage.removeItem('ni_news_cache_meta_v8');
    localStorage.removeItem('ni_news_cache_v9');
    localStorage.removeItem('ni_news_cache_meta_v9');
  }
  _saveCache(n) {
    try {
      const serialized = n.map(x => ({
        ...x,
        date: x.date instanceof Date ? x.date.toISOString() : x.date
      }));
      localStorage.setItem(CACHE_KEY, JSON.stringify(serialized));
      localStorage.setItem(CACHE_META_KEY, JSON.stringify({ time: Date.now(), count: n.length }));
    } catch (e) {
      // Si falla (ej: quota), intentar con menos items
      try {
        const trimmed = n.slice(0, 20).map(x => ({
          ...x,
          date: x.date instanceof Date ? x.date.toISOString() : x.date
        }));
        localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
      } catch (e2) { /* localStorage lleno */ }
    }
  }
  _isStale() {
    try {
      const m = JSON.parse(localStorage.getItem(CACHE_META_KEY) || '{}');
      return (Date.now() - (m.time || 0)) > 1800000;
    } catch (e) { return true; }
  }
  _notify(d) {
    this.listeners.forEach(cb => { try { cb(d); } catch (e) { /* listener error */ } });
  }

  onUpdate(cb) {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(x => x !== cb); };
  }
}

export const newsService = new NewsService();
export { ERROR_CODES };
