/**
 * ViewabilityTracker - Sistema de tracking de visibilidad de anuncios
 * Cumple con estándares IAB (Interactive Advertising Bureau)
 * 
 * Estándar IAB: Un anuncio es "viewable" cuando:
 * - 50% del área del anuncio está visible
 * - Durante al menos 1 segundo continuo
 */
class ViewabilityTracker {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      threshold: options.threshold || 0.5, // 50% visible
      minViewTime: options.minViewTime || 1000, // 1 segundo
      checkInterval: options.checkInterval || 100, // Check cada 100ms
      ...options
    };

    this.isViewable = false;
    this.viewableStartTime = null;
    this.totalViewableTime = 0;
    this.viewabilityHistory = [];
    this.checkTimer = null;
    this.observer = null;

    this.callbacks = {
      onViewable: options.onViewable || (() => {}),
      onNotViewable: options.onNotViewable || (() => {}),
      onViewabilityChange: options.onViewabilityChange || (() => {})
    };

    this.init();
  }

  init() {
    // Usar IntersectionObserver para detección eficiente
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0]
      }
    );

    this.observer.observe(this.element);

    // Timer para tracking continuo
    this.startTracking();
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      const visibilityRatio = entry.intersectionRatio;
      
      // Registrar cambio de visibilidad
      this.viewabilityHistory.push({
        timestamp: Date.now(),
        ratio: visibilityRatio,
        isIntersecting: entry.isIntersecting
      });

      // Mantener solo últimos 100 registros
      if (this.viewabilityHistory.length > 100) {
        this.viewabilityHistory.shift();
      }

      // Callback de cambio
      this.callbacks.onViewabilityChange({
        ratio: visibilityRatio,
        isViewable: this.isViewable,
        totalTime: this.totalViewableTime
      });
    });
  }

  startTracking() {
    this.checkTimer = setInterval(() => {
      this.checkViewability();
    }, this.options.checkInterval);
  }

  checkViewability() {
    // Verificar si la página está visible
    if (document.visibilityState !== 'visible') {
      this.handleNotViewable();
      return;
    }

    // Verificar si el elemento está en viewport
    const rect = this.element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    // Calcular área visible
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
    
    const visibleArea = Math.max(0, visibleHeight) * Math.max(0, visibleWidth);
    const totalArea = rect.height * rect.width;
    
    const visibilityRatio = totalArea > 0 ? visibleArea / totalArea : 0;

    // Verificar si cumple threshold
    if (visibilityRatio >= this.options.threshold) {
      this.handleViewable();
    } else {
      this.handleNotViewable();
    }
  }

  handleViewable() {
    // Iniciar contador si no estaba activo
    if (!this.viewableStartTime) {
      this.viewableStartTime = Date.now();
    }

    // Calcular tiempo acumulado
    const currentViewTime = Date.now() - this.viewableStartTime;

    // Marcar como viewable si alcanzó el tiempo mínimo
    if (!this.isViewable && currentViewTime >= this.options.minViewTime) {
      this.isViewable = true;
      this.callbacks.onViewable({
        element: this.element,
        timeToViewable: currentViewTime,
        totalTime: this.totalViewableTime
      });
    }
  }

  handleNotViewable() {
    // Si estaba siendo visto, acumular tiempo
    if (this.viewableStartTime) {
      this.totalViewableTime += Date.now() - this.viewableStartTime;
      this.viewableStartTime = null;
    }

    // Si era viewable, notificar cambio
    if (this.isViewable) {
      this.callbacks.onNotViewable({
        element: this.element,
        totalTime: this.totalViewableTime
      });
    }
  }

  // Métricas públicas
  getMetrics() {
    let currentViewTime = 0;
    if (this.viewableStartTime) {
      currentViewTime = Date.now() - this.viewableStartTime;
    }

    return {
      isViewable: this.isViewable,
      totalViewableTime: this.totalViewableTime + currentViewTime,
      viewabilityHistory: [...this.viewabilityHistory],
      averageVisibility: this.calculateAverageVisibility(),
      viewabilityRate: this.calculateViewabilityRate()
    };
  }

  calculateAverageVisibility() {
    if (this.viewabilityHistory.length === 0) return 0;
    
    const sum = this.viewabilityHistory.reduce((acc, entry) => acc + entry.ratio, 0);
    return sum / this.viewabilityHistory.length;
  }

  calculateViewabilityRate() {
    // Porcentaje del tiempo que ha sido viewable
    const totalTime = Date.now() - (this.viewabilityHistory[0]?.timestamp || Date.now());
    if (totalTime === 0) return 0;
    
    return (this.totalViewableTime / totalTime) * 100;
  }

  // Verificación de cumplimiento IAB
  meetsIABStandard() {
    return this.isViewable && this.totalViewableTime >= this.options.minViewTime;
  }

  // Detener tracking
  stop() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Acumular tiempo final
    if (this.viewableStartTime) {
      this.totalViewableTime += Date.now() - this.viewableStartTime;
      this.viewableStartTime = null;
    }
  }

  // Reiniciar tracking
  reset() {
    this.isViewable = false;
    this.viewableStartTime = null;
    this.totalViewableTime = 0;
    this.viewabilityHistory = [];
  }

  // Destruir completamente
  destroy() {
    this.stop();
    this.callbacks = {};
  }
}

window.ViewabilityTracker = ViewabilityTracker;
