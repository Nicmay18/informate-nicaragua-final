/**
 * NewsCard - Componente de tarjeta de noticia
 * @module components/NewsCard
 */

import { formatearFecha, toTitleCase, sanitizarImagen, getFallbackImage } from '../core/utils.js';

export class NewsCard {
  constructor(noticia, options = {}) {
    this.noticia = noticia;
    this.options = {
      variant: 'default', // 'default', 'featured', 'compact'
      showShareButtons: true,
      showCategory: true,
      showDate: true,
      showExcerpt: true,
      onClick: null,
      ...options
    };
  }

  /**
   * Renderiza la tarjeta como HTML string
   * @returns {string} HTML de la tarjeta
   */
  render() {
    const { variant } = this.options;
    
    switch (variant) {
      case 'featured':
        return this.renderFeatured();
      case 'compact':
        return this.renderCompact();
      default:
        return this.renderDefault();
    }
  }

  /**
   * Renderiza tarjeta por defecto
   * @private
   */
  renderDefault() {
    const { noticia, options } = this;
    const img = sanitizarImagen(noticia.imagen, noticia.id, noticia.categoria);
    const fallback = getFallbackImage(noticia.categoria);
    const titulo = toTitleCase(noticia.titulo || '');
    const url = noticia.slug ? `/noticia/${noticia.slug}` : `/noticia?id=${noticia.id}`;
    const fecha = formatearFecha(noticia.fecha);
    const resumen = (noticia.resumen || noticia.contenido || '').substring(0, 150);

    return `
      <article class="card" data-noticia-id="${noticia.id}">
        <div class="card-image-wrapper">
          <img class="img-bg" src="${img}" aria-hidden="true" onerror="this.style.display='none'">
          <img class="img-fg" 
               src="${img}" 
               alt="${titulo}" 
               loading="lazy" 
               onerror="this.src='${fallback}'">
        </div>
        <div class="card-body">
          ${options.showCategory ? `<span class="tag ${noticia.categoria}">${noticia.categoria}</span>` : ''}
          <h3>${titulo}</h3>
          ${options.showExcerpt ? `<p>${resumen}...</p>` : ''}
          <div class="card-footer">
            ${options.showDate ? `<span><i class="far fa-clock"></i> ${fecha}</span>` : ''}
            <div style="display:flex;gap:8px;align-items:center;">
              ${options.showShareButtons ? this.renderShareButtons(url, titulo) : ''}
              <span class="read-more">Leer <i class="fas fa-arrow-right"></i></span>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Renderiza tarjeta destacada (breaking news)
   * @private
   */
  renderFeatured() {
    const { noticia } = this;
    const img = sanitizarImagen(noticia.imagen, noticia.id, noticia.categoria);
    const fallback = getFallbackImage(noticia.categoria);
    const titulo = toTitleCase(noticia.titulo || '');
    const url = noticia.slug ? `/noticia/${noticia.slug}` : `/noticia?id=${noticia.id}`;
    const fecha = formatearFecha(noticia.fecha);
    const resumen = (noticia.resumen || noticia.contenido || '').substring(0, 200);

    return `
      <article class="breaking-card" data-noticia-id="${noticia.id}">
        <div class="card-image-wrapper">
          <img class="img-bg" src="${img}" aria-hidden="true" onerror="this.style.display='none'">
          <img class="img-fg" src="${img}" alt="${titulo}" loading="eager" onerror="this.src='${fallback}'">
        </div>
        <div class="breaking-body">
          <div><span class="breaking-badge"><i class="fas fa-bolt"></i> Destacada</span></div>
          <span class="tag ${noticia.categoria}" style="margin-bottom:12px;">${noticia.categoria}</span>
          <h2>${titulo}</h2>
          <p>${resumen}...</p>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#94a3b8;margin-top:12px;">
            <span><i class="far fa-clock"></i> ${fecha}</span>
            <span style="color:var(--azul);font-weight:700;">Leer más <i class="fas fa-arrow-right"></i></span>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Renderiza tarjeta compacta (sidebar)
   * @private
   */
  renderCompact() {
    const { noticia } = this;
    const img = sanitizarImagen(noticia.imagen, noticia.id, noticia.categoria);
    const fallback = getFallbackImage(noticia.categoria);
    const titulo = toTitleCase(noticia.titulo || '');
    const fecha = formatearFecha(noticia.fecha);

    return `
      <div class="trending-item" data-noticia-id="${noticia.id}">
        <img src="${img}" 
             alt="${titulo}" 
             loading="lazy"
             onerror="this.src='${fallback}'"
             style="width:60px;height:60px;border-radius:8px;object-fit:cover;flex-shrink:0;">
        <div style="flex:1;">
          <div class="trending-title">${titulo}</div>
          <div class="trending-meta">
            <i class="far fa-clock"></i> ${fecha}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza botones de compartir
   * @private
   */
  renderShareButtons(url, titulo) {
    const tituloEscapado = titulo.replace(/'/g, '');
    
    return `
      <button onclick="event.stopPropagation();compartirWA('${url}','${tituloEscapado}')" 
              class="btn-sm"
              style="background:#10B981;color:#fff;border:none;padding:5px 10px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;"
              aria-label="Compartir en WhatsApp">
        <i class="fab fa-whatsapp"></i> WA
      </button>
      <button onclick="event.stopPropagation();compartirFB('${url}')" 
              class="btn-sm"
              style="background:#1877f2;color:#fff;border:none;padding:5px 10px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;"
              aria-label="Compartir en Facebook">
        <i class="fab fa-facebook-f"></i> FB
      </button>
    `;
  }

  /**
   * Crea elemento DOM desde la tarjeta
   * @returns {HTMLElement}
   */
  createElement() {
    const template = document.createElement('template');
    template.innerHTML = this.render().trim();
    const element = template.content.firstChild;
    
    // Adjuntar event listener
    element.addEventListener('click', (e) => {
      // Ignorar clicks en botones de compartir
      if (e.target.closest('button')) return;
      
      if (typeof this.options.onClick === 'function') {
        this.options.onClick(this.noticia.id, this.noticia);
      } else {
        window.location.href = this.noticia.slug ? `/noticia/${this.noticia.slug}` : `/noticia?id=${this.noticia.id}`;
      }
    });
    
    return element;
  }

  /**
   * Actualiza los datos de la tarjeta
   * @param {Object} noticia - Nuevos datos
   */
  update(noticia) {
    this.noticia = noticia;
  }
}

/**
 * NewsGrid - Gestor de grid de noticias
 */
export class NewsGrid {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      console.warn(`NewsGrid: contenedor "${containerId}" no encontrado`);
      return;
    }

    this.options = {
      itemsPerPage: 12,
      variant: 'default',
      onCardClick: null,
      ...options
    };

    this.noticias = [];
    this.currentPage = 1;
    this.cards = new Map();
  }

  /**
   * Renderiza el grid de noticias
   * @param {Array} noticias - Array de noticias
   * @param {boolean} append - Si es true, agrega al final
   */
  render(noticias, append = false) {
    if (!append) {
      this.noticias = noticias;
      this.currentPage = 1;
      this.container.innerHTML = '';
      this.cards.clear();
    } else {
      this.noticias = [...this.noticias, ...noticias];
    }

    const start = append ? this.noticias.length - noticias.length : 0;
    const end = this.noticias.length;
    const noticiasToRender = this.noticias.slice(start, end);

    noticiasToRender.forEach((noticia, index) => {
      const variant = (index === 0 && !append) ? 'featured' : this.options.variant;
      
      const card = new NewsCard(noticia, {
        variant,
        onClick: this.options.onCardClick
      });

      const element = card.createElement();
      this.container.appendChild(element);
      this.cards.set(noticia.id, card);
    });

    console.log(`📰 Renderizadas ${noticiasToRender.length} noticias`);
  }

  /**
   * Carga más noticias (paginación)
   */
  loadMore() {
    this.currentPage++;
    const start = (this.currentPage - 1) * this.options.itemsPerPage;
    const end = start + this.options.itemsPerPage;
    const moreNoticias = this.noticias.slice(start, end);
    
    if (moreNoticias.length > 0) {
      this.render(moreNoticias, true);
    }
    
    return moreNoticias.length > 0;
  }

  /**
   * Filtra noticias por categoría
   * @param {string} categoria - Categoría a filtrar
   */
  filter(categoria) {
    const filtradas = categoria === 'Todas' 
      ? this.noticias 
      : this.noticias.filter(n => n.categoria === categoria);
    
    this.container.innerHTML = '';
    this.cards.clear();
    this.render(filtradas);
  }

  /**
   * Actualiza una noticia específica
   * @param {string} id - ID de la noticia
   * @param {Object} data - Nuevos datos
   */
  updateCard(id, data) {
    const card = this.cards.get(id);
    if (card) {
      card.update(data);
      // Re-renderizar la tarjeta
      const element = this.container.querySelector(`[data-noticia-id="${id}"]`);
      if (element) {
        const newElement = card.createElement();
        element.replaceWith(newElement);
      }
    }
  }

  /**
   * Limpia el grid
   */
  clear() {
    this.container.innerHTML = '';
    this.noticias = [];
    this.cards.clear();
    this.currentPage = 1;
  }

  /**
   * Destruye el grid
   */
  destroy() {
    this.clear();
    console.log('📰 NewsGrid destruido');
  }
}

export default { NewsCard, NewsGrid };
