/**
 * AdManager - Sistema central de gestión de anuncios
 * Optimizado para máxima viewability y revenue
 */
class AdManager {
  constructor(config = {}) {
    this.config = {
      adsenseClient: config.adsenseClient || 'ca-pub-4115203339551838',
      lazyLoadOffset: config.lazyLoadOffset || '200px',
      refreshInterval: config.refreshInterval || 30000,
      maxRefreshes: config.maxRefreshes || 3,
      viewabilityThreshold: config.viewabilityThreshold || 0.5,
      ...config
    };

    this.slots = new Map();
    this.observer = null;
    this.refreshTimers = new Map();
    this.refreshCounts = new Map();
    this.analytics = new AdAnalytics();

    // Métricas de rendimiento
    this.metrics = {
      totalRequests: 0,
      successfulLoads: 0,
      viewableImpressions: 0,
      revenueEstimate: 0
    };

    this.init();
  }

  init() {
    // Esperar a que AdSense esté disponible
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // Crear IntersectionObserver para lazy loading
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        rootMargin: this.config.lazyLoadOffset,
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    // Registrar slots existentes en DOM
    this.registerExistingSlots();

    // Configurar eventos globales
    this.setupGlobalEvents();

    console.log('[AdManager] Inicializado con', this.slots.size, 'slots');
  }

  registerExistingSlots() {
    document.querySelectorAll('[data-ad-slot]').forEach(element => {
      const slotId = element.id || this.generateSlotId();
      if (!element.id) element.id = slotId;

      const slotType = element.dataset.adPosition || 'generic';
      const slot = this.createSlot(slotType, element);

      this.slots.set(slotId, slot);
      this.observer.observe(element);
    });
  }

  createSlot(type, element) {
    const slotClasses = {
      'header': HeaderAdSlot,
      'article-mid': ArticleMidAdSlot,
      'sidebar': SidebarAdSlot,
      'sticky-footer': StickyFooterAdSlot,
      'in-article': InArticleAdSlot,
      'parallax': ParallaxAdSlot
    };

    const SlotClass = slotClasses[type] || BaseAdSlot;
    return new SlotClass(element, this.config);
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      const slotId = entry.target.id;
      const slot = this.slots.get(slotId);

      if (!slot) return;

      // Calcular viewability percentage
      const visibilityRatio = entry.intersectionRatio;

      if (entry.isIntersecting && visibilityRatio >= this.config.viewabilityThreshold) {
        // Slot es visible - cargar o refrescar
        if (!slot.isLoaded) {
          this.loadSlot(slotId);
        } else if (slot.isActiveView) {
          this.startRefreshTimer(slotId);
        }
        slot.updateViewability(visibilityRatio);
      } else {
        // Slot no visible - pausar refrescos
        this.pauseRefreshTimer(slotId);
        slot.updateViewability(0);
      }
    });
  }

  async loadSlot(slotId) {
    const slot = this.slots.get(slotId);
    if (!slot || slot.isLoaded) return;

    this.metrics.totalRequests++;

    try {
      // Obtener targeting contextual
      const targeting = await this.getContextualTargeting(slot.element);

      // Configurar slot antes de cargar
      slot.configure(targeting);

      // Cargar anuncio
      await slot.load();
      slot.isLoaded = true;
      this.metrics.successfulLoads++;

      // Track evento
      this.analytics.track('ad_loaded', {
        slotId,
        slotType: slot.type,
        targeting: targeting.keywords
      });

      // Iniciar tracking de viewability
      this.startViewabilityTracking(slotId);

    } catch (error) {
      console.error(`[AdManager] Error cargando slot ${slotId}:`, error);
      slot.showFallback();
    }
  }

  startViewabilityTracking(slotId) {
    const slot = this.slots.get(slotId);
    if (!slot) return;

    // Usar Visibility API para tracking preciso
    let visibleStartTime = null;
    let totalVisibleTime = 0;

    const trackVisibility = () => {
      const isVisible = document.visibilityState === 'visible' && 
                       this.isElementInViewport(slot.element);

      if (isVisible && !visibleStartTime) {
        visibleStartTime = Date.now();
      } else if (!isVisible && visibleStartTime) {
        totalVisibleTime += Date.now() - visibleStartTime;
        visibleStartTime = null;

        // Marcar como viewable si acumuló 1 segundo
        if (totalVisibleTime >= 1000 && !slot.isViewable) {
          slot.isViewable = true;
          this.metrics.viewableImpressions++;

          this.analytics.track('ad_viewable', {
            slotId,
            timeToViewable: totalVisibleTime
          });
        }
      }
    };

    // Check cada 100ms
    const tracker = setInterval(trackVisibility, 100);
    slot.viewabilityTracker = tracker;
  }

  startRefreshTimer(slotId) {
    const count = this.refreshCounts.get(slotId) || 0;
    if (count >= this.config.maxRefreshes) return;

    // Limpiar timer existente
    this.pauseRefreshTimer(slotId);

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && 
          this.isElementInViewport(this.slots.get(slotId)?.element)) {
        this.refreshSlot(slotId);
      }
    }, this.config.refreshInterval);

    this.refreshTimers.set(slotId, timer);
  }

  pauseRefreshTimer(slotId) {
    const timer = this.refreshTimers.get(slotId);
    if (timer) {
      clearInterval(timer);
      this.refreshTimers.delete(slotId);
    }
  }

  async refreshSlot(slotId) {
    const slot = this.slots.get(slotId);
    if (!slot || !slot.isLoaded) return;

    const count = this.refreshCounts.get(slotId) || 0;
    if (count >= this.config.maxRefreshes) {
      this.pauseRefreshTimer(slotId);
      return;
    }

    try {
      // Solo refrescar si el slot tiene buen rendimiento
      const performance = slot.getPerformanceMetrics();
      if (performance.ctr < 0.001) { // CTR menor a 0.1%, no refrescar
        return;
      }

      await slot.refresh();
      this.refreshCounts.set(slotId, count + 1);

      this.analytics.track('ad_refreshed', {
        slotId,
        refreshCount: count + 1,
        previousCtr: performance.ctr
      });

    } catch (error) {
      console.error(`[AdManager] Error refrescando ${slotId}:`, error);
    }
  }

  async getContextualTargeting(element) {
    // Extraer keywords del contenido circundante
    const article = element.closest('article') || document.body;

    // Categoría de la página
    const category = document.body.dataset.category || 
                    article.dataset.category || 
                    'general';

    // Keywords del título y contenido
    const title = article.querySelector('h1, h2')?.textContent || '';
    const content = article.querySelector('.article-content')?.textContent || '';

    // Extraer entidades relevantes (simplificado)
    const text = `${title} ${content}`;
    const keywords = this.extractKeywords(text);

    // Sentimiento del contenido (evitar ads en contenido negativo)
    const sentiment = this.analyzeSentiment(text);

    return {
      category,
      keywords: keywords.slice(0, 10), // Máximo 10 keywords
      sentiment,
      pageUrl: window.location.href,
      device: this.getDeviceType()
    };
  }

  extractKeywords(text) {
    // Implementación simple - en producción usar NLP
    const commonWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se'];
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !commonWords.includes(w));

    // Contar frecuencia
    const frequency = {};
    words.forEach(w => frequency[w] = (frequency[w] || 0) + 1);

    // Ordenar por frecuencia
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  }

  analyzeSentiment(text) {
    // Simplificado - detectar contenido sensible
    const negativeWords = ['muerte', 'asesinato', 'tragedia', 'accidente', 'crimen'];
    const hasNegative = negativeWords.some(w => text.toLowerCase().includes(w));
    return hasNegative ? 'negative' : 'neutral';
  }

  getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  isElementInViewport(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    );
  }

  generateSlotId() {
    return `ad-slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setupGlobalEvents() {
    // Pausar todos los refrescos cuando tab no está visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.refreshTimers.forEach((timer, slotId) => {
          this.pauseRefreshTimer(slotId);
        });
      }
    });

    // Actualizar métricas cada 30 segundos
    setInterval(() => this.logMetrics(), 30000);
  }

  logMetrics() {
    const rpm = this.metrics.viewableImpressions > 0 
      ? (this.metrics.revenueEstimate / this.metrics.viewableImpressions * 1000).toFixed(2)
      : 0;

    console.log('[AdManager] Métricas:', {
      ...this.metrics,
      rpm: `$${rpm}`,
      activeSlots: this.slots.size,
      viewabilityRate: this.metrics.totalRequests > 0 
        ? ((this.metrics.viewableImpressions / this.metrics.totalRequests) * 100).toFixed(1) + '%'
        : '0%'
    });
  }

  // API pública
  getSlot(slotId) {
    return this.slots.get(slotId);
  }

  getAllSlots() {
    return Array.from(this.slots.values());
  }

  destroy() {
    this.observer?.disconnect();
    this.refreshTimers.forEach(timer => clearInterval(timer));
    this.slots.forEach(slot => slot.destroy());
    this.slots.clear();
  }
}

// Exportar para uso global
window.AdManager = AdManager;
