import { newsService, ERROR_CODES } from './news-service.js';
import { getFirebaseError } from './firebase-loader.js';

const PLACEHOLDERS = {
  'Sucesos': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
  'Nacionales': 'https://images.unsplash.com/photo-1526666923127-b2970f64b422?w=800&q=80',
  'Deportes': 'https://images.unsplash.com/photo-1461896836934-f66c71d1ef65?w=800&q=80',
  'Internacionales': 'https://images.unsplash.com/photo-1526304640152-d4619684e484?w=800&q=80',
  'Economía': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  'Espectáculos': 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800&q=80',
  'Tecnología': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  'Cultura': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'
};

const CATEGORIES = {
  'Sucesos': { color: '#dc2626', icon: 'fa-exclamation-triangle' },
  'Nacionales': { color: '#1e40af', icon: 'fa-building-columns' },
  'Deportes': { color: '#047857', icon: 'fa-futbol' },
  'Internacionales': { color: '#7c3aed', icon: 'fa-globe' },
  'Espectáculos': { color: '#db2777', icon: 'fa-film' },
  'Economía': { color: '#0369a1', icon: 'fa-chart-line' },
  'Tecnología': { color: '#0284c7', icon: 'fa-microchip' },
  'Cultura': { color: '#9333ea', icon: 'fa-masks-theater' }
};

class App {
  constructor() {
    this.news = [];
    this.state = { currentCategory: 'Todas', searchQuery: '', theme: localStorage.getItem('ni_theme') || 'light', views: {}, isOnline: navigator.onLine, pageSize: 12 };
    this.carruselState = { current: 0, interval: null };
    this._searchDebounce = null;
    this._init();
  }

  async _init() {
    this._applyTheme(this.state.theme);
    this._setupConnectivity();
    this._showSkeletons();
    this._initHeaderAutoHide();
    this._setupMobileMenu();
    // PRIMERA CARGA: useCache: false para forzar Firebase y evitar demo data persistente
    const result = await newsService.loadNews({ useCache: false, useRealtime: true, limit: 50 });
    this.news = result.data;

    // Si Firebase está vacío o falló, mostrar mensaje útil en vez de dejar skeletons
    if (this.news.length === 0) {
      console.warn('[App] Firebase retornó 0 noticias. Verifica que la colección "noticias" no esté vacía.');
    }

    this._hideSkeletons();
    this._renderAll();
    this._updateStatusBar(result);
    newsService.onUpdate((updated) => { this.news = updated; this._renderAll(); this._showToast('Nuevas noticias', 'success'); });
    this._initWeather();
  }

  _renderAll() {
    this._renderCarrusel();
    this._renderNewsGrid();
    this._renderTrending();
    this._renderPopulares();
  }

  _renderCarrusel() {
    const container = document.getElementById('heroSlides');
    const indicators = document.getElementById('heroIndicators');
    if (!container) return;
    const recent = [...this.news].sort((a,b) => new Date(b.date) - new Date(a.date));
    const catNorm = this._normCat(this.state.currentCategory);
    let pool = this.state.currentCategory !== 'Todas' ? recent.filter(n => this._normCat(n.category) === catNorm) : recent;
    if(!pool.length) pool = recent;
    const destacadas = pool.filter(n => n.destacada).slice(0, 3);
    const noDest = pool.filter(n => !n.destacada).slice(0, 5 - destacadas.length);
    const slides = [...destacadas, ...noDest].slice(0, 5);
    if (slides.length === 0) { container.innerHTML = this._carruselFallback(); return; }
    container.innerHTML = slides.map((slide, i) => {
      const color = CATEGORIES[slide.category]?.color || '#c41e3a';
      return `<div class="carrusel-slide" onclick="app.openArticle('${slide.id}')" role="tabpanel"><img src="${slide.image}" alt="${this._esc(slide.title)}" width="1200" height="675" loading="${i===0?'eager':'lazy'}" decoding="async" ${i===0?'fetchpriority="high"':''} onerror="this.onerror=null;this.src='${PLACEHOLDERS[slide.category]||PLACEHOLDERS.Nacionales}'" style="background:linear-gradient(135deg,#e7e5e4,#d6d3d1)"><div class="carrusel-overlay"><span class="hero-category" style="background:${color}">${this._esc(slide.category)}</span><h2>${this._esc(slide.title)}</h2><p>${this._esc(slide.excerpt||'')}</p></div></div>`;
    }).join('');
    indicators.innerHTML = slides.map((_, i) => `<button class="carrusel-dot ${i===0?'active':''}" onclick="app.carruselGoTo(${i})" aria-label="Noticia ${i+1}"></button>`).join('');
    this.carruselState.slides = slides;
    if (slides.length > 1) this._startCarruselAuto();
  }

  _renderNewsGrid() {
    const grid = document.getElementById('newsGrid');
    const filtered = this._getFiltered();
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:var(--space-10)"><i class="fas fa-inbox" style="font-size:3rem;color:var(--text-muted)"></i><p>No hay noticias disponibles.</p><div style="margin-top:1rem;display:flex;gap:1rem;justify-content:center;"><button class="btn btn-primary" onclick="app.filter('Todas')"><i class="fas fa-home"></i> Ver todas</button><button class="btn btn-secondary" onclick="app.refresh()"><i class="fas fa-sync-alt"></i> Reintentar</button></div><button class="btn btn-ghost" style="margin-top:0.5rem;" onclick="localStorage.clear();location.reload(true)"><i class="fas fa-trash"></i> Limpiar caché y recargar</button></div>`;
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }
    const isFiltered = this.state.currentCategory !== 'Todas';
    const pageSize = this.state.pageSize;
    const visible = filtered.slice(0, pageSize);
    const hasMore = filtered.length > pageSize;
    grid.innerHTML = visible.map((n, i) => {
      const color = CATEGORIES[n.category]?.color || '#000';
      const ago = this._timeAgo(n.date);
      const isFirst = i === 0;
      const showCategory = !isFiltered || isFirst;
      const categoryBadge = showCategory ? `<span class="news-card-category" style="background:${color}">${this._esc(n.category)}</span>` : '';
      const author = n.author || 'Redacción';
      const viewsBadge = n.vistas ? `<span class="news-card-views"><i class="far fa-eye"></i> ${n.vistas}</span>` : '';
      const heroClass = isFirst ? 'news-card--hero' : '';
      return `<article class="news-card ${heroClass}" onclick="app.openArticle('${n.id}')">`
        + `<div class="news-card-image"><img src="${n.image}" alt="${this._esc(n.title)}" width="640" height="400" loading="${i<2?'eager':'lazy'}" decoding="async" onerror="this.onerror=null;this.src='${PLACEHOLDERS[n.category]||PLACEHOLDERS.Nacionales}'">${categoryBadge}</div>`
        + `<div class="news-card-content"><h3 class="news-card-title">${this._esc(n.title)}</h3><p class="news-card-excerpt">${this._esc(n.excerpt)}</p>`
        + `<div class="news-card-meta"><span class="news-card-author"><i class="far fa-user"></i> ${this._esc(author)}</span><span><i class="far fa-clock"></i> ${ago}</span>${viewsBadge}</div></div></article>`;
    }).join('');
    if (loadMoreBtn) {
      loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
      loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Cargar más noticias';
      loadMoreBtn.disabled = false;
    }
  }

  toggleMenu(forceClose) {
    const menu = document.getElementById('mobileMenu');
    const btn = document.getElementById('mobileMenuBtn');
    if (forceClose === true) menu.classList.remove('open');
    else if (forceClose === false) menu.classList.add('open');
    else menu.classList.toggle('open');
    const isOpen = menu.classList.contains('open');
    btn.setAttribute('aria-expanded', isOpen);
    menu.setAttribute('aria-hidden', !isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (!isOpen) btn.focus();
  }
  closeMenu() { this.toggleMenu(true); }

  toggleSearch() {
    const searchBox = document.querySelector('.search-box');
    searchBox.classList.toggle('open');
    if (searchBox.classList.contains('open')) {
      document.getElementById('searchInput').focus();
    }
  }

  _setupMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const closeBtn = document.querySelector('.mobile-menu-close');
    const overlay = document.querySelector('.mobile-menu-overlay');
    if (!menu) return;
    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) this.closeMenu();
    });
    // Listeners directos para máxima compatibilidad táctil
    if (closeBtn) {
      closeBtn.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); this.closeMenu(); }, { passive: false });
      closeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.closeMenu(); });
    }
    if (overlay) {
      overlay.addEventListener('touchend', (e) => { e.preventDefault(); this.closeMenu(); }, { passive: false });
    }
    // Swipe para cerrar (desde el panel hacia la izquierda)
    let touchStartX = 0;
    const panel = document.querySelector('.mobile-menu-panel');
    if (panel) {
      panel.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
      panel.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (dx < -40) this.closeMenu(); // swipe left 40px+
      }, { passive: true });
    }
  }

  _initHeaderAutoHide() {
    let lastScroll = 0;
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll <= 0) {
        header.classList.remove('hidden');
        return;
      }
      if (currentScroll > lastScroll && !header.classList.contains('hidden')) {
        header.classList.add('hidden');
      } else if (currentScroll < lastScroll && header.classList.contains('hidden')) {
        header.classList.remove('hidden');
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  _renderTrending() {
    const list = document.getElementById('trendingList');
    if (!list) return;
    // Tendencias: score = vistas / horas desde publicación (promedio últimas 72h)
    const now = Date.now();
    const scored = this.news.map(n => {
      const ageH = Math.max(1, (now - new Date(n.date).getTime()) / 3600000);
      const score = ageH <= 72 ? (n.vistas || 0) / ageH : 0;
      return { ...n, _score: score };
    }).sort((a, b) => b._score - a._score);
    // Si nadie tiene vistas, fallback a más recientes
    const hasViews = scored.some(n => n._score > 0);
    const trend = (hasViews ? scored : [...this.news].sort((a,b) => new Date(b.date) - new Date(a.date))).slice(0, 5);
    const ranks = ['gold','silver','bronze','normal','normal'];
    list.innerHTML = trend.map((n, i) => `<div class="trending-item" onclick="app.openArticle('${n.id}')"><div class="trending-rank ${ranks[i]}">${i+1}</div><div class="trending-content"><div class="trending-title">${this._esc(n.title)}</div><div class="trending-meta">${this._esc(n.category)} • ${this._timeAgo(n.date)}${n.vistas ? ` • ${n.vistas} lecturas` : ''}</div></div></div>`).join('');
  }

  _renderPopulares() {
    const list = document.getElementById('popularesList');
    if (!list) return;
    // Más leídas: ordenadas por vistas reales (Firebase). Fallback a más recientes si todas en 0.
    const sorted = [...this.news].sort((a, b) => (b.vistas || 0) - (a.vistas || 0));
    const hasViews = sorted.some(n => (n.vistas || 0) > 0);
    const pop = (hasViews ? sorted : [...this.news].sort((a,b) => new Date(b.date) - new Date(a.date))).slice(0, 4);
    list.innerHTML = pop.map((n) => `<div class="trending-item" onclick="app.openArticle('${n.id}')"><div style="width:60px;height:60px;border-radius:var(--radius);overflow:hidden;flex-shrink:0;"><img src="${n.image}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null;this.src='${PLACEHOLDERS[n.category]||PLACEHOLDERS.Nacionales}'"></div><div class="trending-content"><div class="trending-title">${this._esc(n.title)}</div><div class="trending-meta">${this._esc(n.category)}${n.vistas ? ` • ${n.vistas} lecturas` : ''}</div></div></div>`).join('');
  }

  carruselGoTo(idx) {
    this.carruselState.current = idx;
    const c = document.getElementById('heroSlides');
    if (c) c.style.transform = `translateX(-${idx*100}%)`;
    document.querySelectorAll('.carrusel-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    this._resetCarruselAuto();
  }

  carruselNext() {
    const len = this.carruselState.slides?.length || 0;
    if (len) this.carruselGoTo((this.carruselState.current + 1) % len);
  }
  carruselPrev() {
    const len = this.carruselState.slides?.length || 0;
    if (len) this.carruselGoTo((this.carruselState.current - 1 + len) % len);
  }
  _startCarruselAuto() {
    clearInterval(this.carruselState.interval);
    this.carruselState.interval = setInterval(() => this.carruselNext(), 6000);
  }
  _resetCarruselAuto() {
    clearInterval(this.carruselState.interval);
    this._startCarruselAuto();
  }

  filter(cat, btn) {
    this.state.currentCategory = cat;
    document.querySelectorAll('.nav-link, .mobile-menu-link').forEach(b => { b.classList.remove('active'); b.removeAttribute('aria-current'); });
    let active = btn;
    if (!active) document.querySelectorAll('.nav-link, .mobile-menu-link').forEach(l => { const t = l.textContent.trim(); if (cat === 'Todas' && t.includes('Inicio')) active = l; else if (t.includes(cat)) active = l; });
    if (active) { active.classList.add('active'); if (active.classList.contains('nav-link')) active.setAttribute('aria-current', 'page'); }
    this.state.pageSize = 12;
    this._renderNewsGrid();
    const sectionTitle = document.querySelector('.section-title');
    if (sectionTitle) sectionTitle.textContent = cat === 'Todas' ? 'Últimas Noticias' : cat;
  }

  search(q) {
    clearTimeout(this._searchDebounce);
    this._searchDebounce = setTimeout(() => { this.state.searchQuery = q.toLowerCase(); this.state.pageSize = 12; this._renderNewsGrid(); }, 300);
  }

  async loadMore() {
    const btn = document.getElementById('loadMoreBtn');
    if (!btn) return;
    // Si hay más noticias ocultas, mostrarlas; si no, refrescar desde servidor
    const filtered = this._getFiltered();
    if (filtered.length > this.state.pageSize) {
      this.state.pageSize += 6;
      this._renderNewsGrid();
      return;
    }
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
    btn.disabled = true;
    const result = await newsService.refresh(50);
    if (result.data.length > 0) { this.news = result.data; this._renderAll(); this._showToast('Noticias actualizadas', 'success'); }
    else { const err = getFirebaseError(); let msg = 'No se pudieron actualizar'; if (err === ERROR_CODES.NETWORK) msg = 'Sin conexión'; else if (err === ERROR_CODES.PERMISSION_DENIED) msg = 'Error de permisos'; this._showToast(msg, 'error'); }
    btn.innerHTML = orig; btn.disabled = false;
  }

  openArticle(id) {
    const n = this.news.find(x => x.id === id);
    if (n?.slug) window.location.href = `/noticia.html?slug=${encodeURIComponent(n.slug)}&id=${encodeURIComponent(id)}`;
    else window.location.href = `/noticia.html?id=${encodeURIComponent(id)}`;
  }

  toggleTheme() {
    this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
    this._applyTheme(this.state.theme);
  }
  refresh() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadMore();
  }

  _initWeather() {
    const cities = [{name:'Managua',lat:12.1328,lon:-86.2504},{name:'León',lat:12.4379,lon:-86.8784},{name:'Estelí',lat:13.09,lon:-86.36}];
    this.weatherState = {cities,currentCityIndex:0};
    this._loadWeather(0);
    setInterval(() => { const next = (this.weatherState.currentCityIndex+1)%cities.length; this._loadWeather(next); }, 10000);
  }

  async _loadWeather(idx) {
    const city = this.weatherState.cities[idx];
    this.weatherState.currentCityIndex = idx;
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility&timezone=America%2FManagua`);
      const data = await res.json();
      const cur = data.current;
      const codeMap = {
        0:{icon:'fa-sun',label:'Despejado'},
        1:{icon:'fa-cloud-sun',label:'Mayormente despejado'},
        2:{icon:'fa-cloud-sun',label:'Parcialmente nublado'},
        3:{icon:'fa-cloud',label:'Nublado'},
        45:{icon:'fa-smog',label:'Niebla'},
        48:{icon:'fa-smog',label:'Niebla con escarcha'},
        51:{icon:'fa-cloud-rain',label:'Llovizna ligera'},
        53:{icon:'fa-cloud-rain',label:'Llovizna moderada'},
        55:{icon:'fa-cloud-showers-heavy',label:'Llovizna densa'},
        61:{icon:'fa-cloud-rain',label:'Lluvia ligera'},
        63:{icon:'fa-cloud-showers-heavy',label:'Lluvia moderada'},
        65:{icon:'fa-cloud-showers-heavy',label:'Lluvia fuerte'},
        71:{icon:'fa-snowflake',label:'Nieve ligera'},
        73:{icon:'fa-snowflake',label:'Nieve moderada'},
        75:{icon:'fa-snowflake',label:'Nieve fuerte'},
        80:{icon:'fa-cloud-rain',label:'Chubascos ligeros'},
        81:{icon:'fa-cloud-showers-heavy',label:'Chubascos moderados'},
        82:{icon:'fa-cloud-showers-heavy',label:'Chubascos violentos'},
        95:{icon:'fa-bolt',label:'Tormenta'},
        96:{icon:'fa-bolt',label:'Tormenta con granizo'},
        99:{icon:'fa-bolt',label:'Tormenta severa'}
      };
      const info = codeMap[cur.weather_code] || {icon:'fa-sun',label:'Despejado'};
      const el = (id) => document.getElementById(id); if(!el('weatherIcon'))return;
      el('weatherIcon').className = `fas ${info.icon} weather-icon`;
      el('weatherTemp').textContent = `${Math.round(cur.temperature_2m)}°C`;
      el('weatherCity').textContent = city.name;
      el('weatherDesc').textContent = info.label;
      el('weatherHumidity').textContent = `${cur.relative_humidity_2m}%`;
      el('weatherWind').textContent = `${cur.wind_speed_10m} km/h`;
      const visKm = cur.visibility ? (cur.visibility / 1000).toFixed(1) : '--';
      el('weatherVisibility').textContent = `${visKm} km`;
      el('weatherCityIndicator').textContent = `${idx + 1} / ${this.weatherState.cities.length}`;
    } catch(e){
      const el = (id) => document.getElementById(id);
      if(el('weatherDesc')) el('weatherDesc').textContent = 'No disponible';
    }
  }

  _normCat(c) {
    if (!c) return '';
    return c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/s$/, '');
  }
  _getFiltered() {
    const catNorm = this._normCat(this.state.currentCategory);
    let f = this.state.currentCategory === 'Todas'
      ? [...this.news]
      : this.news.filter(n => this._normCat(n.category) === catNorm);
    if (this.state.searchQuery) {
      f = f.filter(n =>
        (n.title || '').toLowerCase().includes(this.state.searchQuery) ||
        (n.excerpt || '').toLowerCase().includes(this.state.searchQuery)
      );
    }
    return f.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  _applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    const btn = document.getElementById('themeBtn');
    if (btn) btn.innerHTML = t === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    try { localStorage.setItem('ni_theme', t); } catch (e) { /* storage full */ }
  }
  _setupConnectivity() {
    window.addEventListener('online', () => {
      this.state.isOnline = true;
      this._showConnStatus('updated', 'Conexión restaurada');
      this.loadMore();
    });
    window.addEventListener('offline', () => {
      this.state.isOnline = false;
      this._showConnStatus('offline', 'Sin conexión');
    });
  }
  _updateStatusBar(result) {
    if (result.source === 'empty' || result.source === 'firebase_error') {
      const err = getFirebaseError();
      if (err === ERROR_CODES.NETWORK) this._showConnStatus('offline', 'Sin conexión.');
      else if (err === ERROR_CODES.PERMISSION_DENIED) this._showConnStatus('offline', 'Error de permisos.');
      else this._showConnStatus('offline', 'Error al cargar noticias. Intenta recargar.');
    } else if (result.source === 'firebase') this._showConnStatus('updated', 'Noticias en tiempo real');
    else if (result.source === 'cache') this._showConnStatus('updated', 'Noticias desde caché');
  }
  _showConnStatus(type, msg) {
    const bar = document.getElementById('connStatus');
    if (!bar) return;
    bar.className = 'conn-status ' + type;
    bar.textContent = msg;
    bar.classList.add('show');
    if (type !== 'offline') setTimeout(() => bar.classList.remove('show'), 4000);
  }
  _showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = type === 'error' ? '#dc2626' : type === 'success' ? '#047857' : 'var(--color-secondary)';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
  _showSkeletons() {
    const g = document.getElementById('newsGrid');
    if (g) g.innerHTML = '<div class="news-card skeleton" style="height:400px"></div>'.repeat(3);
  }
  _hideSkeletons() {}
  _carruselFallback() { return `<div class="carrusel-slide" style="background:linear-gradient(135deg,#1a1a2e,#0f172a);display:flex;align-items:center;justify-content:center;color:white;flex-direction:column;"><h2 style="font-family:var(--font-display);font-size:2rem;margin-bottom:1rem;">Nicaragua Informate</h2><p>Conectando...</p><button class="btn btn-primary" style="margin-top:1.5rem;" onclick="app.loadMore()"><i class="fas fa-sync-alt"></i> Reintentar</button></div>`; }
  _timeAgo(d) { if (!d) return '--'; const date = new Date(d); const s = Math.floor((Date.now()-date)/1000); if (s<60) return 'Hace un momento'; const m = Math.floor(s/60); if (m<60) return `Hace ${m} min`; const h = Math.floor(m/60); if (h<24) return `Hace ${h} h`; return date.toLocaleDateString('es-NI', {day:'numeric',month:'short'}); }
  _esc(str) {
    if (typeof str !== 'string') return str ?? '';
    if (!this._escDiv) this._escDiv = document.createElement('div');
    this._escDiv.textContent = str;
    return this._escDiv.innerHTML;
  }
}

window.app = new App();
