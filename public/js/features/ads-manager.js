/**
 * AdManager - Sistema de anuncios optimizado
 * @module features/ads-manager
 * 
 * Características:
 * - Lazy loading con IntersectionObserver
 * - Viewability tracking
 * - Auto-refresh ético (máx 3 veces)
 * - Targeting contextual
 * - Performance optimizado
 */

export class AdManager {
  constructor(options = {}) {
    this.options = {
      viewabilityThreshold: 0.5, // 50% visible
      refreshInterval: 30000, // 30 segundos
      maxRefreshes: 3, // Límite ético
      minViewableTime: 1000, // 1 segundo para contar como viewable
      rootMargin: '100px', // Cargar antes de entrar en viewport
      ...options
    };

    this.slots = new Map();
    this.refreshCounts = new Map();
    this.timers = new Map();
    this.tracking = new Map();
    this.observer = null;
    
    this.init();
  }

  /**
   * Inicializa el AdManager
   */
  init(retries = 0) {
    // Esperar a que AdSense esté disponible (máx 10 intentos)
    if (typeof window.adsbygoogle === 'undefined') {
      if (retries >= 10) {
        console.warn('[AdManager] AdSense no disponible después de 10 intentos. Abortando.');
        return;
      }
      console.warn(`[AdManager] AdSense no disponible, reintentando (${retries + 1}/10)...`);
      setTimeout(() => this.init(retries + 1), 1000);
      return;
    }

    // Crear IntersectionObserver para viewability
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        threshold: [0, 0.5, 1],
        rootMargin: this.options.rootMargin
      }
    );

    // Registrar slots existentes
    this.registerSlots();

    // Pausar refresh cuando la página no es visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAllRefresh();
      }
    });

    console.log('📢 AdManager inicializado');
  }

  /**
   * Registra todos los slots de anuncios
   */
  registerSlots() {
    const slots = document.querySelectorAll('.ad-slot, .ad-box, .ad-inline');
    
    slots.forEach((el, index) => {
      // Asignar ID si no tiene
      if (!el.id) {
        el.id = `ad-slot-${index}`;
      }

      // Registrar slot
      this.slots.set(el.id, {
        element: el,
        loaded: false,
        visible: false,
        refreshCount: 0
      });

      // Observar
      this.observer.observe(el);
    });

    console.log(`📢 Registrados ${slots.length} slots de anuncios`);
  }

  /**
   * Maneja intersección de slots
   * @private
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      const slotId = entry.target.id;
      const slot = this.slots.get(slotId);
      
      if (!slot) return;

      const isVisible = entry.isIntersecting && 
                       entry.intersectionRatio >= this.options.viewabilityThreshold;

      slot.visible = isVisible;

      if (isVisible) {
        // Cargar ad si no está cargado
        if (!slot.loaded) {
          this.loadAd(slotId);
        }
        
        // Iniciar tracking de viewability
        this.startViewabilityTracking(slotId);
        
        // Iniciar timer de refresh
        this.startRefreshTimer(slotId);
      } else {
        // Pausar refresh cuando no es visible
        this.pauseRefresh(slotId);
        this.stopViewabilityTracking(slotId);
      }
    });
  }

  /**
   * Carga un anuncio en un slot
   * @param {string} slotId - ID del slot
   */
  loadAd(slotId) {
    const slot = this.slots.get(slotId);
    if (!slot || slot.loaded) return;

    const element = slot.element;
    const config = this.getSlotConfig(element);

    // Verificar ancho mínimo (responsive)
    if (config.minWidth && window.innerWidth < config.minWidth) {
      console.log(`📢 Slot ${slotId} omitido (ancho insuficiente)`);
      return;
    }

    try {
      // Buscar elemento ins.adsbygoogle dentro del slot
      let adsElement = element.querySelector('ins.adsbygoogle');
      
      if (!adsElement) {
        // Crear elemento si no existe
        adsElement = document.createElement('ins');
        adsElement.className = 'adsbygoogle';
        adsElement.style.display = 'block';
        adsElement.setAttribute('data-ad-client', config.client);
        adsElement.setAttribute('data-ad-slot', config.slot);
        adsElement.setAttribute('data-ad-format', config.format);
        
        if (config.responsive) {
          adsElement.setAttribute('data-full-width-responsive', 'true');
        }
        
        element.appendChild(adsElement);
      }

      // Push a AdSense
      (window.adsbygoogle = window.adsbygoogle || []).push({});

      slot.loaded = true;
      element.dataset.loaded = 'true';

      console.log(`📢 Ad cargado: ${slotId} (${config.position})`);

      // Analytics
      this.trackAdLoad(slotId, config);

    } catch (error) {
      console.error(`[AdManager] Error cargando slot ${slotId}:`, error);
    }
  }

  /**
   * Obtiene configuración de un slot
   * @private
   * @param {HTMLElement} element - Elemento del slot
   * @returns {Object} Configuración
   */
  getSlotConfig(element) {
    const position = element.dataset.position || 'default';
    const category = document.body.dataset.category || 'general';
    
    const configs = {
      'header': {
        position: 'header',
        client: 'ca-pub-4115203339551838',
        slot: '4727039722',
        format: 'auto',
        responsive: true,
        keywords: [category, 'nicaragua', 'noticias'],
        minWidth: 728
      },
      'article-top': {
        position: 'article-top',
        client: 'ca-pub-4115203339551838',
        slot: '4727039722',
        format: 'auto',
        responsive: true,
        keywords: [category, 'lectura'],
        minWidth: 300
      },
      'article-mid': {
        position: 'article-mid',
        client: 'ca-pub-4115203339551838',
        slot: '4727039722',
        format: 'rectangle',
        responsive: false,
        keywords: [category, 'contenido'],
        minWidth: 300
      },
      'sidebar': {
        position: 'sidebar',
        client: 'ca-pub-4115203339551838',
        slot: '4727039722',
        format: 'vertical',
        responsive: true,
        keywords: [category, 'descubrimiento'],
        minWidth: 300
      },
      'footer': {
        position: 'footer',
        client: 'ca-pub-4115203339551838',
        slot: '4727039722',
        format: 'horizontal',
        responsive: true,
        keywords: [category],
        minWidth: 320
      },
      'default': {
        position: 'default',
        client: 'ca-pub-4115203339551838',
        slot: '4727039722',
        format: 'auto',
        responsive: true,
        keywords: [category],
        minWidth: 300
      }
    };

    return configs[position] || configs['default'];
  }

  /**
   * Inicia timer de refresh para un slot
   * @private
   * @param {string} slotId - ID del slot
   */
  startRefreshTimer(slotId) {
    const slot = this.slots.get(slotId);
    if (!slot) return;

    // Verificar límite de refreshes
    const refreshCount = this.refreshCounts.get(slotId) || 0;
    if (refreshCount >= this.options.maxRefreshes) {
      console.log(`📢 Slot ${slotId} alcanzó límite de refreshes`);
      return;
    }

    // Limpiar timer anterior si existe
    this.pauseRefresh(slotId);

    // Crear nuevo timer
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && slot.visible) {
        this.refreshAd(slotId);
      }
    }, this.options.refreshInterval);

    this.timers.set(slotId, timer);
  }

  /**
   * Refresca un anuncio
   * @private
   * @param {string} slotId - ID del slot
   */
  refreshAd(slotId) {
    const slot = this.slots.get(slotId);
    if (!slot) return;

    // Incrementar contador
    const count = (this.refreshCounts.get(slotId) || 0) + 1;
    this.refreshCounts.set(slotId, count);

    console.log(`📢 Refreshing ad ${slotId} (${count}/${this.options.maxRefreshes})`);

    // Limpiar contenido anterior
    const adsElement = slot.element.querySelector('ins.adsbygoogle');
    if (adsElement) {
      adsElement.remove();
    }

    // Marcar como no cargado para forzar recarga
    slot.loaded = false;
    slot.element.dataset.loaded = 'false';

    // Recargar
    this.loadAd(slotId);

    // Verificar si alcanzó el límite
    if (count >= this.options.maxRefreshes) {
      this.pauseRefresh(slotId);
    }
  }

  /**
   * Pausa refresh de un slot
   * @private
   * @param {string} slotId - ID del slot
   */
  pauseRefresh(slotId) {
    const timer = this.timers.get(slotId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(slotId);
    }
  }

  /**
   * Pausa todos los refreshes
   * @private
   */
  pauseAllRefresh() {
    this.timers.forEach((timer, slotId) => {
      clearInterval(timer);
    });
    this.timers.clear();
  }

  /**
   * Inicia tracking de viewability
   * @private
   * @param {string} slotId - ID del slot
   */
  startViewabilityTracking(slotId) {
    // Limpiar tracking anterior
    this.stopViewabilityTracking(slotId);

    const startTime = Date.now();
    let visibleTime = 0;
    let tracked = false;

    const track = setInterval(() => {
      const slot = this.slots.get(slotId);
      
      if (slot && slot.visible) {
        visibleTime += 100;
        
        // Contar como viewable después de 1 segundo
        if (!tracked && visibleTime >= this.options.minViewableTime) {
          this.trackViewability(slotId, visibleTime);
          tracked = true;
        }
      }
    }, 100);

    this.tracking.set(slotId, track);
  }

  /**
   * Detiene tracking de viewability
   * @private
   * @param {string} slotId - ID del slot
   */
  stopViewabilityTracking(slotId) {
    const track = this.tracking.get(slotId);
    if (track) {
      clearInterval(track);
      this.tracking.delete(slotId);
    }
  }

  /**
   * Verifica si un slot está en viewport
   * @private
   * @param {string} slotId - ID del slot
   * @returns {boolean}
   */
  isInViewport(slotId) {
    const slot = this.slots.get(slotId);
    if (!slot) return false;

    const rect = slot.element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  /**
   * Tracking de carga de ad
   * @private
   */
  trackAdLoad(slotId, config) {
    if (typeof gtag === 'function') {
      gtag('event', 'ad_load', {
        event_category: 'Ads',
        event_label: slotId,
        ad_position: config.position,
        ad_format: config.format
      });
    }
  }

  /**
   * Tracking de viewability
   * @private
   */
  trackViewability(slotId, visibleTime) {
    console.log(`📢 Ad viewable: ${slotId} (${visibleTime}ms)`);

    if (typeof gtag === 'function') {
      gtag('event', 'ad_viewable', {
        event_category: 'Ads',
        event_label: slotId,
        value: Math.round(visibleTime / 1000)
      });
    }
  }

  /**
   * Destruye el AdManager
   */
  destroy() {
    // Desconectar observer
    if (this.observer) {
      this.observer.disconnect();
    }

    // Limpiar timers
    this.pauseAllRefresh();

    // Limpiar tracking
    this.tracking.forEach((track) => clearInterval(track));
    this.tracking.clear();

    // Limpiar slots
    this.slots.clear();
    this.refreshCounts.clear();

    console.log('📢 AdManager destruido');
  }
}

/**
 * Inicializa AdManager cuando la página está lista
 */
export function initAdManager(options = {}) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => new AdManager(options), 1000);
    });
  } else {
    setTimeout(() => new AdManager(options), 1000);
  }
}

export default AdManager;
