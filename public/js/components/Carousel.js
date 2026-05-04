/**
 * NewsCarousel - Componente de carrusel de noticias
 * @module components/Carousel
 */

import { formatearFecha, getColorCategoria, sanitizarImagen, toTitleCase, calcularTiempoLectura } from '../core/utils.js';

export class NewsCarousel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      console.warn(`Carousel: contenedor "${containerId}" no encontrado`);
      return;
    }

    this.options = {
      interval: 15000,
      autoplay: true,
      pauseOnHover: true,
      enableTouch: true,
      enableKeyboard: true,
      ...options
    };

    this.slides = [];
    this.currentIndex = 0;
    this.autoplayTimer = null;
    this.isTransitioning = false;
  }

  /**
   * Inicializa el carrusel con datos
   * @param {Array} slidesData - Array de noticias
   */
  init(slidesData) {
    if (!slidesData || !slidesData.length) {
      console.warn('Carousel: no hay datos para mostrar');
      return;
    }

    this.slides = slidesData.slice(0, 5);
    this.render();
    this.attachEvents();
    
    if (this.options.autoplay) {
      this.startAutoplay();
    }

    console.log(`📰 Carousel inicializado con ${this.slides.length} slides`);
  }

  /**
   * Renderiza el HTML del carrusel
   */
  render() {
    const indicators = this.slides.map((_, i) => `
      <button type="button" 
              data-slide="${i}" 
              aria-label="Ir a noticia ${i + 1}"
              ${i === 0 ? 'class="active" aria-current="true"' : ''}></button>
    `).join('');

    const items = this.slides.map((slide, i) => {
      const img = sanitizarImagen(slide.imagen, slide.id, slide.categoria);
      const color = getColorCategoria(slide.categoria);
      const tiempo = formatearFecha(slide.fecha);
      const titulo = toTitleCase(slide.titulo || '');
      const tituloTruncado = titulo.length > 100 ? titulo.substring(0, 97) + '...' : titulo;
      const minLectura = calcularTiempoLectura(slide.contenido || slide.resumen || '');
      const resumen = (slide.resumen || slide.contenido || '').substring(0, 140) + '...';

      return `
        <div class="carousel-item ${i === 0 ? 'active' : ''}" 
             data-noticia-id="${slide.id}"
             role="group" 
             aria-roledescription="slide"
             aria-label="${i + 1} de ${this.slides.length}">
          <img src="${img}" class="carousel-bg" aria-hidden="true" alt="">
          <img src="${img}" class="carousel-fg d-block w-100" alt="${tituloTruncado}">
          <div class="carousel-caption">
            <span class="carousel-badge" style="background:${color}">${slide.categoria || ''}</span>
            <h3>${tituloTruncado}</h3>
            <p>${resumen}</p>
            <div class="carousel-meta">
              <span><i class="far fa-clock"></i> ${tiempo}</span>
              <span><i class="fas fa-book-reader"></i> ${minLectura} min</span>
              <span style="opacity:.7;">Por: Redacción</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="carousel-indicators" role="tablist">${indicators}</div>
      <div class="carousel-inner">${items}</div>
      <button class="carousel-control-prev" 
              type="button"
              aria-label="Noticia anterior">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      </button>
      <button class="carousel-control-next" 
              type="button"
              aria-label="Siguiente noticia">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
      </button>
    `;
  }

  /**
   * Adjunta event listeners
   */
  attachEvents() {
    // Event delegation para mejor performance
    this.container.addEventListener('click', (e) => {
      // Indicadores
      const indicator = e.target.closest('[data-slide]');
      if (indicator) {
        const index = parseInt(indicator.dataset.slide);
        this.goToSlide(index);
        return;
      }

      // Controles
      if (e.target.closest('.carousel-control-prev')) {
        this.prev();
        return;
      }
      if (e.target.closest('.carousel-control-next')) {
        this.next();
        return;
      }

      // Click en slide (abrir noticia)
      const slide = e.target.closest('[data-noticia-id]');
      if (slide && !e.target.closest('.carousel-control-prev, .carousel-control-next')) {
        const noticiaId = slide.dataset.noticiaId;
        this.onSlideClick(noticiaId);
      }
    });

    // Pausar en hover (accesibilidad)
    if (this.options.pauseOnHover) {
      this.container.addEventListener('mouseenter', () => this.pause());
      this.container.addEventListener('mouseleave', () => {
        if (this.options.autoplay) this.startAutoplay();
      });
    }

    // Touch para móvil
    if (this.options.enableTouch) {
      this.setupTouchEvents();
    }

    // Teclado (accesibilidad)
    if (this.options.enableKeyboard) {
      this.setupKeyboardEvents();
    }
  }

  /**
   * Configura eventos táctiles
   */
  setupTouchEvents() {
    let touchStartX = 0;
    let touchEndX = 0;

    this.container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      
      // Mínimo 50px de swipe
      if (Math.abs(diff) > 50) {
        diff > 0 ? this.next() : this.prev();
      }
    }, { passive: true });
  }

  /**
   * Configura eventos de teclado
   */
  setupKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      // Solo si el carrusel está visible
      if (!this.isVisible()) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      }
    });
  }

  /**
   * Verifica si el carrusel está visible
   * @returns {boolean}
   */
  isVisible() {
    const rect = this.container.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  /**
   * Va a un slide específico
   * @param {number} index - Índice del slide
   */
  goToSlide(index) {
    if (this.isTransitioning || index === this.currentIndex) return;
    if (index < 0 || index >= this.slides.length) return;

    this.isTransitioning = true;

    // Actualizar slides
    const items = this.container.querySelectorAll('.carousel-item');
    items[this.currentIndex].classList.remove('active');
    items[index].classList.add('active');

    // Actualizar indicadores
    const indicators = this.container.querySelectorAll('[data-slide]');
    indicators[this.currentIndex].classList.remove('active');
    indicators[this.currentIndex].removeAttribute('aria-current');
    indicators[index].classList.add('active');
    indicators[index].setAttribute('aria-current', 'true');

    this.currentIndex = index;

    // Resetear autoplay
    if (this.options.autoplay) {
      this.startAutoplay();
    }

    setTimeout(() => {
      this.isTransitioning = false;
    }, 600); // Duración de la transición CSS
  }

  /**
   * Slide anterior
   */
  prev() {
    const prevIndex = this.currentIndex === 0 ? this.slides.length - 1 : this.currentIndex - 1;
    this.goToSlide(prevIndex);
  }

  /**
   * Siguiente slide
   */
  next() {
    const nextIndex = (this.currentIndex + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  /**
   * Inicia autoplay
   */
  startAutoplay() {
    this.pause(); // Limpiar timer anterior
    
    this.autoplayTimer = setInterval(() => {
      this.next();
    }, this.options.interval);
  }

  /**
   * Pausa autoplay
   */
  pause() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  /**
   * Callback cuando se hace click en un slide
   * @param {string} noticiaId - ID de la noticia
   */
  onSlideClick(noticiaId) {
    // Emitir evento personalizado
    const event = new CustomEvent('carousel:slideClick', {
      detail: { noticiaId }
    });
    this.container.dispatchEvent(event);

    // Callback si existe
    if (typeof this.options.onSlideClick === 'function') {
      this.options.onSlideClick(noticiaId);
    }
  }

  /**
   * Actualiza los slides
   * @param {Array} slidesData - Nuevos datos
   */
  update(slidesData) {
    this.pause();
    this.currentIndex = 0;
    this.init(slidesData);
  }

  /**
   * Destruye el carrusel
   */
  destroy() {
    this.pause();
    this.container.innerHTML = '';
    console.log('📰 Carousel destruido');
  }
}

export default NewsCarousel;
